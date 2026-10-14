"""Export chapter 02 coverage of train.bin by the chapter 11 training batches.

Run: python experiments/nanogpt/batch_coverage.py /path/to/nanoGPT
Reruns the chapter 11 training (about 30 s on CPU) with tiny_gpt.train(),
recording every get_batch() start position without consuming random numbers.
Start positions depend only on the random-number sequence; the rerun is checked
against the per-iteration losses published in tiny-training.json (within 5e-5).
Final weights can differ from the snapshot by float rounding (~1e-4) because CPU
kernels are not bitwise deterministic across runs.
"""

import argparse
import json
import math
from pathlib import Path

import numpy as np
import torch

from tiny_gpt import COMMIT, DATA_OUT, MODEL_SHA256, README_CPU, train


def run(nanogpt_dir):
    draws = []
    result = train(nanogpt_dir, README_CPU,
                   on_batch=lambda split, ix, training: draws.append((split, ix, training)))
    record = json.loads((DATA_OUT / "tiny-training.json").read_text(encoding="utf-8"))
    assert len(record["history"]) == len(result["history"])
    for published, row in zip(record["history"], result["history"]):
        # Published values carry 6 significant digits.
        assert abs(published[2] - row["loss"]) < 5e-5, (published, row)

    # Batches drawn in training mode feed updates, except the prefetch after the
    # last update. Batches drawn by estimate_loss() run with the model in eval mode.
    training = [ix for split, ix, is_training in draws if is_training]
    assert all(split == "train" for split, _, t in draws if t)
    updates = README_CPU["max_iters"] + 1
    assert len(training) == updates + 1
    starts = np.array(training[:updates]).reshape(-1)
    T = README_CPU["block_size"]
    data_len = len(np.memmap(nanogpt_dir / "data/shakespeare_char/train.bin",
                             dtype=np.uint16, mode="r"))

    # Coverage of each token position by the inputs X (positions i..i+T-1).
    diff = np.zeros(data_len + 1, dtype=np.int64)
    np.add.at(diff, starts, 1)
    np.add.at(diff, starts + T, -1)
    coverage = np.cumsum(diff)[:data_len]
    # Every position can appear in an input except the final token of the file.
    eligible = coverage[:data_len - 1]
    counts = np.bincount(eligible)
    mean = float(eligible.mean())
    # Poisson approximation: each of the n windows covers a position with p ~ T/(N-T).
    poisson = [len(eligible) * math.exp(-mean) * mean ** k / math.factorial(k)
               for k in range(len(counts))]
    # Coarse profile over the file: mean coverage in 200 equal segments.
    segments = np.array_split(eligible, 200)
    first_seen = None
    covered = np.zeros(data_len, dtype=bool)
    unique_fraction = []
    for it in range(updates):
        for i in training[it]:
            covered[i:i + T] = True
        if it + 1 in (1, 10, 100, 250, 500, 1000, 1500, 2001):
            unique_fraction.append([it + 1, round(float(covered[:data_len - 1].mean()), 5)])
    return dict(
        experimentId="nanogpt-02-batch-coverage", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        config=dict(batchSize=README_CPU["batch_size"],
                                                     blockSize=T, updates=updates),
        trainTokens=data_len, windows=int(starts.size), duplicateStarts=int(
            starts.size - np.unique(starts).size),
        meanCoverage=round(mean, 4), maxCoverage=int(eligible.max()),
        neverInInput=int((eligible == 0).sum()),
        neverInInputFraction=round(float((eligible == 0).mean()), 5),
        poissonZeroFraction=round(math.exp(-mean), 5),
        coverageCounts=counts.tolist(), poissonCounts=[round(v, 1) for v in poisson],
        segmentMeans=[round(float(s.mean()), 3) for s in segments],
        coveredFractionByUpdate=unique_fraction,
        evalBatchesDrawn=sum(1 for _, _, t in draws if not t),
        verification=dict(lossesMatchPublishedHistory=True, tolerance=5e-5))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "batch-coverage.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    print({k: v for k, v in data.items() if k not in ("segmentMeans", "poissonCounts")})
    print(f"Generated {output.name}")
