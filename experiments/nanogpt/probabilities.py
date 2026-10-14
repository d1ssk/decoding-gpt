"""Export chapter 07 logits, probabilities, and per-layer readouts.

Run: python experiments/nanogpt/probabilities.py /path/to/nanoGPT
Requires the main-run snapshot written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
from pathlib import Path

import torch
from torch.nn import functional as F

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot,
                      sha256, trace, val_window)


def run(nanogpt_dir):
    path = main_snapshot()
    _, model, meta, saved = load_snapshot(nanogpt_dir, path)
    ids, targets, text = val_window(nanogpt_dir, meta)
    idx = torch.tensor([ids])
    tr = trace(model, idx)
    wte = model.transformer.wte.weight

    # lm_head and the token embedding are one Parameter.
    assert model.lm_head.weight is wte
    torch.testing.assert_close(tr["logits"], tr["final"] @ wte.T, rtol=1e-5, atol=1e-5)
    # Without targets, forward() returns only the last position.
    with torch.no_grad():
        last, loss = model(idx)
    assert loss is None and list(last.shape) == [1, 1, model.config.vocab_size]

    # One step of generate(): temperature, top-k, softmax, multinomial.
    temperature, top_k = 0.8, 5
    torch.manual_seed(1337)
    generated = model.generate(idx, 1, temperature=temperature, top_k=top_k)[0, -1].item()
    scaled = tr["logits"][0, -1] / temperature
    kth = torch.topk(scaled, top_k).values[-1]
    probs = F.softmax(scaled.masked_fill(scaled < kth, float("-inf")), dim=-1)
    torch.manual_seed(1337)
    assert torch.multinomial(probs[None], 1).item() == generated

    # Read the stream after each block through ln_f and lm_head.
    stages = [("embedding", tr["embedding"])] + [
        (f"block{l}", layer["after_mlp"]) for l, layer in enumerate(tr["layers"])]
    lens = []
    with torch.no_grad():
        for name, stream in stages:
            p = F.softmax(model.lm_head(model.transformer.ln_f(stream))[0], dim=-1)
            top = torch.topk(p, 5)
            lens.append(dict(
                name=name,
                top=[[[i, round(v, 4)] for i, v in zip(ti, tv)]
                     for ti, tv in zip(top.indices.tolist(), top.values.tolist())],
                target=[round(p[t, y].item(), 4) for t, y in enumerate(targets)]))
    torch.testing.assert_close(
        torch.tensor([row for row in lens[-1]["target"]]),
        F.softmax(tr["logits"][0], -1)[torch.arange(len(ids)), targets], rtol=0, atol=1e-4)

    return dict(
        experimentId="nanogpt-07-hidden-states-to-probabilities", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", snapshot=dict(iter=saved["iter_num"], sha256=sha256(path)),
        modelArgs=saved["model_args"], vocabulary=[meta["itos"][i] for i in range(len(meta["itos"]))],
        text=text, ids=ids, targets=targets, valStart=3,
        logits=[[round(v, 3) for v in row] for row in tr["logits"][0].tolist()],
        logitLens=lens,
        generateCheck=dict(temperature=temperature, topK=top_k, seed=1337, sampled=generated),
        verification=dict(weightTyingSameParameter=True, logitsEqualFinalTimesWte=True,
                          inferenceReturnsLastPosition=True, generateStepReproduced=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "probabilities.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    voc = data["vocabulary"]
    for stage in data["logitLens"]:
        print(stage["name"], [(repr(voc[i]), p) for i, p in stage["top"][56]],
              sum(stage["target"]) / len(stage["target"]))
    print(f"Generated {output.name}")
