"""Export chapter 05 multi-head attention data from the chapter 11 tiny GPT.

Run: python experiments/nanogpt/multi_head_attention.py /path/to/nanoGPT
Requires the main-run snapshot written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
from pathlib import Path

import torch
from torch.nn import functional as F

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot,
                      sha256, trace, val_batches, val_window)


def run(nanogpt_dir):
    path = main_snapshot()
    _, model, meta, saved = load_snapshot(nanogpt_dir, path)
    cfg = model.config
    L, H, C = cfg.n_layer, cfg.n_head, cfg.n_embd
    ids, targets, text = val_window(nanogpt_dir, meta)
    idx = torch.tensor([ids])
    T = len(ids)
    tr = trace(model, idx)

    # Lower triangles in per-mille integers (row t has t+1 entries).
    maps = [[[[round(1000 * a) for a in row[: t + 1]]
              for t, row in enumerate(tr["layers"][l]["att"][0, h].tolist())]
             for h in range(H)] for l in range(L)]

    # Statistics and ablations over fixed random validation windows.
    xb, yb = val_batches(nanogpt_dir, 200, cfg.block_size)
    full = trace(model, xb)
    base_loss = F.cross_entropy(full["logits"].view(-1, cfg.vocab_size), yb.view(-1)).item()
    t_idx = torch.arange(cfg.block_size)
    distance = (t_idx[:, None] - t_idx[None, :]).clamp(min=0).float()
    stats = []
    for l in range(L):
        att = full["layers"][l]["att"]
        row = []
        for h in range(H):
            a = att[:, h]
            entropy = -(a.clamp_min(1e-12).log() * a).sum(-1)
            ablated = trace(model, xb, ablate=(l, h))["logits"]
            loss = F.cross_entropy(ablated.view(-1, cfg.vocab_size), yb.view(-1)).item()
            row.append(dict(
                meanDistance=round((a * distance).sum(-1).mean().item(), 3),
                selfWeight=round(a.diagonal(dim1=-2, dim2=-1).mean().item(), 4),
                previousWeight=round(a.diagonal(offset=-1, dim1=-2, dim2=-1).mean().item(), 4),
                entropy=round(entropy.mean().item(), 4),
                ablationLoss=round(loss, 5), ablationDelta=round(loss - base_loss, 5)))
        stats.append(row)

    # The heads occupy contiguous component ranges before c_proj mixes them.
    heads = tr["layers"][0]["heads"]
    concat = heads.transpose(1, 2).reshape(1, T, C)
    for h in range(H):
        torch.testing.assert_close(concat[..., h * C // H:(h + 1) * C // H], heads[:, h])
    w = model.transformer.h[0].attn.c_proj.weight
    by_head = sum(heads[:, h] @ w[:, h * C // H:(h + 1) * C // H].T for h in range(H))
    torch.testing.assert_close(by_head, tr["layers"][0]["attn"], rtol=1e-4, atol=1e-6)
    for l in range(L):
        assert torch.allclose(tr["layers"][l]["att"].sum(-1), torch.ones(1, H, T))
        assert torch.count_nonzero(tr["layers"][l]["att"][0].triu(1)) == 0

    return dict(
        experimentId="nanogpt-05-multi-head-attention", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", snapshot=dict(iter=saved["iter_num"], sha256=sha256(path)),
        modelArgs=saved["model_args"], text=text, ids=ids, valStart=3,
        attentionPerMille=maps, statsWindows=200, statsSeed=0,
        baselineLoss=round(base_loss, 5), headStats=stats,
        verification=dict(moduleAgreement=True, concatenationAgreement=True,
                          perHeadProjectionSumAgreement=True, rowsSumToOne=True,
                          futureWeightsZero=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "multi-head-attention.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    print(json.dumps(data["headStats"], indent=1)[:3000])
    print(f"Generated {output.name}")
