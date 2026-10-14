"""Export chapter 04 measurements of the 1/sqrt(d) score scaling.

Run: python experiments/nanogpt/attention_scaling.py /path/to/nanoGPT
Part 1 uses random query/key vectors with independent N(0, 1) components.
Part 2 measures the actual (scaled) scores of the chapter 11 model; it requires
the main-run snapshots written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
import math
from pathlib import Path

import torch

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot, sha256,
                      val_batches)

T = 64
TRIALS = 4000
DIMS = [1, 2, 4, 8, 16, 32, 64, 128, 256]


def effective_positions(weights):
    """exp(entropy): 1 when one position takes all the weight, T when uniform."""
    entropy = -(weights * weights.clamp_min(1e-30).log()).sum(-1)
    return entropy.exp()


def random_part():
    gen = torch.Generator().manual_seed(0)
    rows = []
    for d in DIMS:
        # One query against T keys: the last row of a causal T x T score array.
        q = torch.randn(TRIALS, 1, d, generator=gen)
        k = torch.randn(TRIALS, T, d, generator=gen)
        raw = (q * k).sum(-1)
        row = dict(d=d)
        for name, scores in (("raw", raw), ("scaled", raw / math.sqrt(d))):
            weights = torch.softmax(scores, dim=-1)
            row[name] = dict(scoreStd=round(scores.std().item(), 4),
                             maxWeight=round(weights.max(-1).values.mean().item(), 4),
                             effectivePositions=round(effective_positions(weights).mean().item(), 3))
        rows.append(row)
    return rows


@torch.no_grad()
def model_part(nanogpt_dir):
    stages = []
    for it in (0, 2000):
        path = main_snapshot(it)
        _, model, _, _ = load_snapshot(nanogpt_dir, path)
        x, _ = val_batches(nanogpt_dir, 200, model.config.block_size)
        tr = model.transformer
        B, L = x.shape
        C, H = model.config.n_embd, model.config.n_head
        d = C // H
        mask = torch.ones(L, L, dtype=torch.bool).tril()
        h = tr.drop(tr.wte(x) + tr.wpe(torch.arange(L)))
        layers = []
        for block in tr.h:
            a = block.ln_1(h)
            q, k, _ = block.attn.c_attn(a).split(C, dim=2)
            q, k = [t.view(B, L, H, d).transpose(1, 2) for t in (q, k)]
            scores = (q @ k.transpose(-2, -1)) / math.sqrt(d)
            weights = torch.softmax(scores.masked_fill(~mask, float("-inf")), dim=-1)
            last = weights[:, :, -1]
            layers.append(dict(
                queryComponentStd=round(q.std().item(), 4),
                scaledScoreStd=round(scores[..., mask].std().item(), 4),
                lastMaxWeight=round(last.max(-1).values.mean().item(), 4),
                lastEffectivePositions=round(effective_positions(last).mean().item(), 3)))
            h = block(h)
        stages.append(dict(iter=it, sha256=sha256(path), headSize=d, layers=layers))
    return stages


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    nanogpt_dir = parser.parse_args().nanogpt.resolve()
    data = dict(
        experimentId="nanogpt-04-attention-scaling", kind="random-and-trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        positions=T, trials=TRIALS, seed=0,
        randomVectors="q, k with independent N(0, 1) components; one query against 64 keys",
        effectivePositions="exp(entropy of the softmax weights), averaged over trials",
        random=random_part(),
        modelEvaluation="200 validation windows of 64 characters, torch.Generator seed 0; "
                        "last position (63) for weight statistics",
        model=model_part(nanogpt_dir))
    output = DATA_OUT / "attention-scaling.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for row in data["random"]:
        print(row)
    for stage in data["model"]:
        print(stage["iter"], stage["layers"])
    print(f"Generated {output.name}")
