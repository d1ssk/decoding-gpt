"""Export chapter 08 cross-entropy data at several points of the chapter 11 run.

Run: python experiments/nanogpt/loss.py /path/to/nanoGPT
Requires the main-run snapshots written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
import math
from pathlib import Path

import torch
from torch.nn import functional as F

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot,
                      sha256, val_batches, val_window)


def run(nanogpt_dir):
    snapshots = []
    for it in (0, 250, 2000):
        path = main_snapshot(it)
        _, model, meta, saved = load_snapshot(nanogpt_dir, path)
        V = model.config.vocab_size
        ids, targets, text = val_window(nanogpt_dir, meta)
        idx, y = torch.tensor([ids]), torch.tensor([targets])
        with torch.no_grad():
            logits, loss = model(idx, y)
            logp = F.log_softmax(logits[0], dim=-1)
            per_position = -logp[torch.arange(len(ids)), targets]
            # forward() averages -log p(target) over all B*T positions.
            torch.testing.assert_close(per_position.mean(), loss)
            # ignore_index=-1 drops a position from the average.
            masked = y.clone()
            masked[0, :8] = -1
            _, masked_loss = model(idx, masked)
            torch.testing.assert_close(masked_loss, per_position[8:].mean())
            xb, yb = val_batches(nanogpt_dir, 200, model.config.block_size)
            _, val_loss = model(xb, yb)
        probs = logp.exp()
        top = torch.topk(probs, 5)
        snapshots.append(dict(
            iter=it, sha256=sha256(path), loss=round(loss.item(), 5),
            valLoss=round(val_loss.item(), 5),
            targetProb=[round(p, 5) for p in probs[torch.arange(len(ids)), targets].tolist()],
            perPosition=[round(v, 4) for v in per_position.tolist()],
            top=[[[i, round(v, 4)] for i, v in zip(ti, tv)]
                 for ti, tv in zip(top.indices.tolist(), top.values.tolist())]))
    first = snapshots[0]
    return dict(
        experimentId="nanogpt-08-loss", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", modelArgs=saved["model_args"],
        vocabulary=[meta["itos"][i] for i in range(V)], text=text, ids=ids, targets=targets,
        valStart=3, uniformLoss=math.log(V), valWindows=200, valSeed=0, snapshots=snapshots,
        verification=dict(meanOfNegativeLogProb=True, ignoreIndexExcluded=True,
                          initialLossNearUniform=abs(first["valLoss"] - math.log(V)) < 0.05))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "loss.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    for s in data["snapshots"]:
        print(s["iter"], s["loss"], s["valLoss"])
    print(data["uniformLoss"], data["verification"])
    print(f"Generated {output.name}")
