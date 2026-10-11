"""Generate the demo vocabulary using nanoGPT's character preparation logic.

Usage: python3 experiments/nanogpt/shakespeare_tokenizer.py /path/to/input.txt
Download input.txt from SOURCE_URL; keep the full corpus outside the repository.
"""

import hashlib
import json
import sys
from pathlib import Path

SOURCE_COMMIT = "6f9487a6fe5b420b7ca9afb0d7c078e37c1d1b4e"
SOURCE_URL = f"https://raw.githubusercontent.com/karpathy/char-rnn/{SOURCE_COMMIT}/data/tinyshakespeare/input.txt"
SHA256 = "86c4e6aa9db7c042ec79f339dcb96d42b0075e16b8fc2e86bf0ca57e2dc565ed"


def generate(path):
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SHA256:
        raise ValueError("Input checksum differs from the pinned Tiny Shakespeare corpus")
    data = raw.decode("utf-8")
    chars = sorted(set(data))
    stoi = {char: index for index, char in enumerate(chars)}
    sample = "To be, or not to be?"
    ids = [stoi[char] for char in sample]
    assert len(chars) == 65
    assert "".join(chars[index] for index in ids) == sample
    return {
        "sourceRepository": "karpathy/nanoGPT",
        "sourceCommit": "3adf61e154c3fe3fca428ad6bc3818b27a3b8291",
        "sourceFile": "data/shakespeare_char/prepare.py",
        "corpusUrl": SOURCE_URL,
        "corpusSha256": SHA256,
        "vocabulary": chars,
        "sample": sample,
        "ids": ids,
    }


if __name__ == "__main__":
    result = generate(Path(sys.argv[1]))
    output = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt/shakespeare-tokenizer.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {output.name}")
