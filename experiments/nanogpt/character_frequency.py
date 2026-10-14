"""Export chapter 01 character frequencies and frequency-only baseline losses.

Run: python3 experiments/nanogpt/character_frequency.py /path/to/nanoGPT
The nanoGPT directory must contain prepared data/shakespeare_char/{train.bin,val.bin,meta.pkl}.
Standard library and NumPy only; no model is involved.
"""

import argparse
import json
import math
import pickle
from pathlib import Path

import numpy as np

DATA_OUT = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt"


def cross_entropy(probs, targets):
    return float(-np.log(probs[targets]).mean())


def run(nanogpt_dir):
    data_dir = nanogpt_dir / "data/shakespeare_char"
    with open(data_dir / "meta.pkl", "rb") as f:
        meta = pickle.load(f)
    V = meta["vocab_size"]
    train = np.fromfile(data_dir / "train.bin", dtype=np.uint16).astype(np.int64)
    val = np.fromfile(data_dir / "val.bin", dtype=np.uint16).astype(np.int64)
    train_counts = np.bincount(train, minlength=V)
    val_counts = np.bincount(val, minlength=V)

    # Add-one smoothing keeps every probability positive; the counts are large
    # enough that it barely changes the frequent characters.
    unigram = (train_counts + 1) / (train_counts.sum() + V)
    pair_counts = np.zeros((V, V), dtype=np.int64)
    np.add.at(pair_counts, (train[:-1], train[1:]), 1)
    bigram = (pair_counts + 1) / (pair_counts.sum(axis=1, keepdims=True) + V)
    assert np.allclose(bigram.sum(axis=1), 1) and math.isclose(unigram.sum(), 1)

    # Loss on validation targets, matching what estimate_loss() averages:
    # every position but the first of a sequence has a previous character.
    targets, previous = val[1:], val[:-1]
    uniform_loss = math.log(V)
    unigram_loss = cross_entropy(unigram, targets)
    bigram_loss = float(-np.log(bigram[previous, targets]).mean())
    order = np.argsort(-train_counts, kind="stable")
    return dict(
        experimentId="nanogpt-01-character-frequency", kind="corpus-statistics",
        dataset="shakespeare_char", vocabulary=[meta["itos"][i] for i in range(V)],
        trainTokens=int(train.size), valTokens=int(val.size),
        trainCounts=train_counts.tolist(), valCounts=val_counts.tolist(),
        orderByTrainCount=order.tolist(),
        unseenInTrain=[meta["itos"][i] for i in range(V) if train_counts[i] == 0],
        unseenInVal=[meta["itos"][i] for i in range(V) if val_counts[i] == 0],
        smoothing="add-one (Laplace) on training counts",
        baselines=dict(uniform=round(uniform_loss, 4), unigram=round(unigram_loss, 4),
                       bigram=round(bigram_loss, 4)),
        baselineTargets="val.bin characters 1..N-1; bigram conditions on the previous character")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "character-frequency.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    top = [data["vocabulary"][i] for i in data["orderByTrainCount"][:10]]
    print(top, data["baselines"], data["unseenInTrain"], data["unseenInVal"])
    print(f"Generated {output.name}")
