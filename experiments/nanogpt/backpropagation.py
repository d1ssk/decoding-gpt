"""Export chapter 09 gradient checks and gradient-flow data.

Run: python experiments/nanogpt/backpropagation.py /path/to/nanoGPT
Requires the main-run snapshot written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import copy
import json
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as F

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot,
                      sha256, val_window)


def forward_from_embedding(model, emb):
    x = model.transformer.drop(emb)
    for block in model.transformer.h:
        x = block(x)
    return model.lm_head(model.transformer.ln_f(x))


def run(nanogpt_dir):
    path = main_snapshot()
    _, model, meta, saved = load_snapshot(nanogpt_dir, path)
    V = model.config.vocab_size
    ids, targets, text = val_window(nanogpt_dir, meta)
    idx, y = torch.tensor([ids]), torch.tensor([targets])
    T = len(ids)

    # 1. dL/dlogits = (softmax(logits) - onehot(target)) / N for the mean loss.
    logits, _ = model(idx, y)
    logits = logits.detach().requires_grad_(True)
    loss = F.cross_entropy(logits.view(-1, V), y.view(-1))
    loss.backward()
    expected = (F.softmax(logits.detach(), -1) - F.one_hot(y, V)) / T
    torch.testing.assert_close(logits.grad, expected, rtol=1e-5, atol=1e-7)
    t_show = 9
    logit_grad = dict(position=t_show, target=targets[t_show],
                      prob=[round(v, 5) for v in F.softmax(logits.detach()[0, t_show], -1).tolist()],
                      grad=[round(v, 6) for v in logits.grad[0, t_show].tolist()])

    # 2. Central finite differences in float64 against autograd.
    m64 = copy.deepcopy(model).double()
    named = dict(m64.named_parameters())
    picks = [("transformer.wte.weight", (ids[9], 0)),
             ("transformer.h.0.attn.c_attn.weight", (0, 0)),
             ("transformer.h.3.mlp.c_fc.weight", (5, 7)),
             ("transformer.ln_f.weight", (3,))]
    m64.zero_grad()
    m64(idx, y)[1].backward()
    checks = []
    for name, where in picks:
        p = named[name]
        analytic = p.grad[where].item()
        eps = 1e-6
        with torch.no_grad():
            orig = p[where].item()
            p[where] = orig + eps
            plus = m64(idx, y)[1].item()
            p[where] = orig - eps
            minus = m64(idx, y)[1].item()
            p[where] = orig
        numeric = (plus - minus) / (2 * eps)
        rel = abs(analytic - numeric) / max(abs(analytic), abs(numeric), 1e-12)
        assert rel < 1e-5, (name, analytic, numeric)
        checks.append(dict(parameter=name, index=list(where), autograd=analytic,
                           finiteDifference=numeric, relativeError=rel))

    # 3. Split the tied wte/lm_head gradient into its two paths.
    model.zero_grad()
    model(idx, y)[1].backward()
    tied = model.transformer.wte.weight.grad.clone()
    untied = copy.deepcopy(model)
    untied.lm_head.weight = nn.Parameter(untied.transformer.wte.weight.detach().clone())
    untied.zero_grad()
    untied(idx, y)[1].backward()
    g_in = untied.transformer.wte.weight.grad
    g_out = untied.lm_head.weight.grad
    torch.testing.assert_close(g_in + g_out, tied, rtol=1e-5, atol=1e-8)
    present = sorted(set(ids))
    nonzero_in = [i for i in range(V) if g_in[i].abs().sum() > 0]
    assert nonzero_in == present
    tying = dict(inputRowNorm=[round(v, 6) for v in g_in.norm(dim=-1).tolist()],
                 outputRowNorm=[round(v, 6) for v in g_out.norm(dim=-1).tolist()],
                 rowsInInput=present)

    # 4. Gradient of each position's loss with respect to every input embedding.
    with torch.no_grad():
        emb0 = model.transformer.wte(idx) + model.transformer.wpe(torch.arange(T))
    influence = []
    for t in range(T):
        emb = emb0.clone().requires_grad_(True)
        out = forward_from_embedding(model, emb)
        F.cross_entropy(out[0, t][None], y[0, t][None]).backward()
        norms = emb.grad[0].norm(dim=-1)
        assert torch.count_nonzero(norms[t + 1:]) == 0
        influence.append([round(v, 5) for v in norms[: t + 1].tolist()])

    return dict(
        experimentId="nanogpt-09-backpropagation", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", snapshot=dict(iter=saved["iter_num"], sha256=sha256(path)),
        modelArgs=saved["model_args"], vocabulary=[meta["itos"][i] for i in range(V)],
        text=text, ids=ids, targets=targets, valStart=3,
        logitGradient=logit_grad, finiteDifference=checks, weightTying=tying,
        embeddingGradientNorms=influence,
        verification=dict(softmaxMinusOneHot=True, finiteDifferenceRelTol=1e-5,
                          tiedGradientIsSumOfPaths=True, inputPathRowsMatchInputTokens=True,
                          futurePositionsReceiveZeroGradient=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "backpropagation.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    print(json.dumps(data["finiteDifference"], indent=1))
    print(len(data["weightTying"]["rowsInInput"]))
    print(data["embeddingGradientNorms"][63][-12:])
    print(f"Generated {output.name}")
