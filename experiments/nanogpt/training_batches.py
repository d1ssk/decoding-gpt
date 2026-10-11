"""Generate chapter 02's illustrative batches with Python 3 only.

Run: python3 experiments/nanogpt/training_batches.py
This computes slices of an educational input; it does not train a model.
"""

import json
from pathlib import Path


def make_batch(data, starts, block_size):
    if not 1 <= block_size < len(data):
        raise ValueError("Require 1 <= block_size < len(data)")
    if not starts or any(not 0 <= i < len(data) - block_size for i in starts):
        raise ValueError("Every start must leave room for block_size + 1 tokens")
    x = [data[i:i + block_size] for i in starts]
    y = [data[i + 1:i + block_size + 1] for i in starts]
    return x, y


def run():
    corpus = "hello\nhello\n"
    vocabulary = sorted(set(corpus))
    stoi = {char: index for index, char in enumerate(vocabulary)}
    data = [stoi[char] for char in corpus]
    block_size = 4
    starts = [0, 3]
    x, y = make_batch(data, starts, block_size)

    # Check every legal slice, including the last target at the end of the data.
    for length in range(1, len(data)):
        for start in range(len(data) - length):
            inputs, targets = make_batch(data, [start], length)
            assert len(inputs[0]) == len(targets[0]) == length
            assert inputs[0][1:] == targets[0][:-1]
            assert targets[0][-1] == data[start + length]
    assert make_batch(data, [0, 0], 4)[0][0] == x[0]
    for invalid_starts, invalid_length in [([8], 4), ([0], 12), ([-1], 4)]:
        try:
            make_batch(data, invalid_starts, invalid_length)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid window accepted")

    return {
        "experimentId": "nanogpt-02-training-batches",
        "kind": "educational-batch-slicing",
        "upstreamCommit": "3adf61e154c3fe3fca428ad6bc3818b27a3b8291",
        "corpus": corpus,
        "vocabulary": vocabulary,
        "data": data,
        "blockSize": block_size,
        "starts": starts,
        "x": x,
        "y": y,
    }


if __name__ == "__main__":
    output = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt/training-batches.json"
    output.write_text(json.dumps(run(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {output.name}")
