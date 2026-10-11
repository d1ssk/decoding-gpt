"""Generate the chapter 01 character-tokenization example using Python 3 only.

Run from the repository root: python3 experiments/nanogpt/text_to_tokens.py
This is an educational input, not a trained-model or Shakespeare result.
"""

import json
import struct
from pathlib import Path


def run():
    corpus = "hello\nhello\n"
    chars = sorted(set(corpus))
    stoi = {char: index for index, char in enumerate(chars)}

    def encode(text):
        return [stoi[char] for char in text]

    def decode(ids):
        return "".join(chars[index] for index in ids)

    split = int(len(corpus) * 0.9)
    train_ids = encode(corpus[:split])
    val_ids = encode(corpus[split:])
    sample = "hello\n"
    ids = encode(sample)

    # Explicit little-endian uint16 for a portable byte-count check.
    # The source repository’s NumPy tofile call uses the array's byte order instead.
    train_bytes = struct.pack(f"<{len(train_ids)}H", *train_ids)
    val_bytes = struct.pack(f"<{len(val_ids)}H", *val_ids)
    assert decode(train_ids + val_ids) == corpus
    assert decode(ids) == sample
    assert list(struct.unpack(f"<{len(train_ids)}H", train_bytes)) == train_ids
    try:
        encode("hello!")
    except KeyError as error:
        assert error.args == ("!",)
    else:
        raise AssertionError("Unknown characters must fail to encode")

    return {
        "experimentId": "nanogpt-01-text-to-tokens",
        "kind": "educational-character-tokenization",
        "upstreamCommit": "3adf61e154c3fe3fca428ad6bc3818b27a3b8291",
        "corpus": corpus,
        "vocabulary": chars,
        "sample": sample,
        "ids": ids,
        "decoded": decode(ids),
        "splitIndex": split,
        "trainIds": train_ids,
        "validationIds": val_ids,
        "trainBytes": len(train_bytes),
        "validationBytes": len(val_bytes),
    }


if __name__ == "__main__":
    output = (
        Path(__file__).resolve().parents[2]
        / "public/site/data/nanogpt/text-to-tokens.json"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(run(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {output.name}")
