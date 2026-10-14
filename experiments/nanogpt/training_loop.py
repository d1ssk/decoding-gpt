"""Export chapter 10 checks of the train.py update step.

Run: python experiments/nanogpt/training_loop.py /path/to/nanoGPT
Requires the main-run snapshots written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import contextlib
import copy
import io
import json
import math
from pathlib import Path

import torch

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, README_CPU, load_snapshot,
                      main_snapshot, sha256, val_batches)


def get_lr(it, cfg):
    if it < cfg["warmup_iters"]:
        return cfg["learning_rate"] * (it + 1) / (cfg["warmup_iters"] + 1)
    if it > cfg["lr_decay_iters"]:
        return cfg["min_lr"]
    ratio = (it - cfg["warmup_iters"]) / (cfg["lr_decay_iters"] - cfg["warmup_iters"])
    coeff = 0.5 * (1.0 + math.cos(math.pi * ratio))
    return cfg["min_lr"] + coeff * (cfg["learning_rate"] - cfg["min_lr"])


def run(nanogpt_dir):
    cfg = README_CPU
    record = json.loads((DATA_OUT / "tiny-training.json").read_text(encoding="utf-8"))
    for it, lr, _, _ in record["history"]:
        assert f"{get_lr(it, cfg):.6g}" == f"{lr:.6g}"  # history keeps 6 significant digits

    path = main_snapshot(0)
    _, model, _, saved = load_snapshot(nanogpt_dir, path)
    model.train()

    # Parameter groups created by configure_optimizers().
    params = {n: p for n, p in model.named_parameters() if p.requires_grad}
    decay = [n for n, p in params.items() if p.dim() >= 2]
    nodecay = [n for n, p in params.items() if p.dim() < 2]
    with contextlib.redirect_stdout(io.StringIO()):
        optimizer = model.configure_optimizers(cfg["weight_decay"], cfg["learning_rate"],
                                               (cfg["beta1"], cfg["beta2"]), "cpu")
    assert [len(g["params"]) for g in optimizer.param_groups] == [len(decay), len(nodecay)]
    groups = dict(
        decay=[dict(name=n, shape=list(params[n].shape), numel=params[n].numel()) for n in decay],
        noDecay=[dict(name=n, shape=list(params[n].shape), numel=params[n].numel())
                 for n in nodecay])

    # Gradient accumulation: 4 micro-batches of 3 with loss / 4 match one batch of 12.
    xb, yb = val_batches(nanogpt_dir, 12, cfg["block_size"], seed=1)
    full = copy.deepcopy(model)
    full(xb, yb)[1].backward()
    accum = copy.deepcopy(model)
    for k in range(4):
        (accum(xb[3 * k:3 * k + 3], yb[3 * k:3 * k + 3])[1] / 4).backward()
    diffs = [(a.grad - b.grad).abs().max().item()
             for a, b in zip(full.parameters(), accum.parameters())]
    assert max(diffs) < 1e-6

    # One AdamW step on the first iteration, reproduced element by element.
    lr = get_lr(0, cfg)
    for group in optimizer.param_groups:
        group["lr"] = lr
    model.zero_grad()
    model(xb, yb)[1].backward()
    norm = torch.nn.utils.clip_grad_norm_(model.parameters(), cfg["grad_clip"]).item()
    examples = []
    picks = [("transformer.h.0.attn.c_attn.weight", (0, 0), cfg["weight_decay"]),
             ("transformer.h.0.ln_1.weight", (0,), 0.0)]
    before = {n: params[n][w].item() for n, w, _ in picks}
    grads = {n: params[n].grad[w].item() for n, w, _ in picks}
    optimizer.step()
    b1, b2, eps = cfg["beta1"], cfg["beta2"], 1e-8
    for name, where, wd in picks:
        g, w0 = grads[name], before[name]
        m, v = (1 - b1) * g, (1 - b2) * g * g
        m_hat, v_hat = m / (1 - b1), v / (1 - b2)
        decayed = w0 * (1 - lr * wd)
        manual = decayed - lr * m_hat / (math.sqrt(v_hat) + eps)
        actual = params[name][where].item()
        assert abs(manual - actual) < 1e-7, (name, manual, actual)
        examples.append(dict(parameter=name, index=list(where), weightDecay=wd, lr=lr,
                             weightBefore=w0, gradAfterClip=g, m=m, v=v, mHat=m_hat,
                             vHat=v_hat, weightAfter=actual))

    norms = [row[3] for row in record["history"]]
    clipped = [row[0] for row in record["history"] if row[3] > cfg["grad_clip"]]
    return dict(
        experimentId="nanogpt-10-training-loop", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", snapshot=dict(iter=0, sha256=sha256(path)),
        config=cfg, parameterGroups=groups,
        decayParameters=sum(p["numel"] for p in groups["decay"]),
        noDecayParameters=sum(p["numel"] for p in groups["noDecay"]),
        accumulationMaxAbsDifference=max(diffs), firstStepGradNorm=norm,
        adamwExamples=examples, clippedIterations=len(clipped),
        clippedFirst=clipped[:5], clippedLast=clipped[-5:],
        maxGradNorm=max(norms), finalGradNorm=norms[-1],
        verification=dict(lrScheduleMatchesHistory=True, parameterGroupsMatch=True,
                          gradientAccumulationMatches=True, adamwStepReproduced=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "training-loop.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print({k: v for k, v in data.items() if k not in ("parameterGroups", "config")})
    print(f"Generated {output.name}")
