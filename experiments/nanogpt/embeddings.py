"""Export initialized nanoGPT embeddings; requires PyTorch and pinned model.py.

Run: python embeddings.py /path/to/nanoGPT/model.py
The output is an untrained model computation, not a training result.
"""

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path

import torch

COMMIT = "3adf61e154c3fe3fca428ad6bc3818b27a3b8291"
MODEL_SHA256 = "7c01703240dbec5d554527dc666e35b3df8391d0b117fddc07afcf325a21d11c"


def run(model_path):
    if hashlib.sha256(model_path.read_bytes()).hexdigest() != MODEL_SHA256:
        raise ValueError(f"Expected unchanged model.py from nanoGPT {COMMIT}")
    spec = importlib.util.spec_from_file_location("nanogpt_model", model_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    torch.manual_seed(42)
    config = dict(vocab_size=5, block_size=8, n_embd=3, n_layer=1,
                  n_head=1, dropout=0.0, bias=True)
    with contextlib.redirect_stdout(io.StringIO()):
        model = module.GPT(module.GPTConfig(**config)).eval()
    vocabulary = ["\n", "e", "h", "l", "o"]
    idx = torch.tensor([[2, 1, 3, 3, 4, 0], [0, 2, 1, 3, 3, 4]])
    with torch.no_grad():
        token = model.transformer.wte(idx)
        position = model.transformer.wpe(torch.arange(idx.size(1)))
        combined = token + position
        assert token.shape == (2, 6, 3)
        assert position.shape == (6, 3)
        assert torch.equal(token[0, 2], token[0, 3])
        assert torch.equal(combined[0, 3], combined[1, 3])
        # Verify the exported addition against the actual first block's input,
        # including shorter sequences and the maximum supported length.
        seen = []
        hook = model.transformer.h[0].register_forward_pre_hook(
            lambda _module, args: seen.append(args[0].clone()))
        try:
            for length in (1, 3, 6, 8):
                inputs = idx[:, :length] if length <= 6 else torch.zeros((2, 8), dtype=torch.long)
                model(inputs)
                expected = model.transformer.wte(inputs) + model.transformer.wpe(torch.arange(length))
                torch.testing.assert_close(seen[-1], expected, rtol=0, atol=0)
        finally:
            hook.remove()
        try:
            model(torch.zeros((1, 9), dtype=torch.long))
        except AssertionError:
            pass
        else:
            raise AssertionError("Input longer than block_size was accepted")
    return {
        "experimentId": "nanogpt-03-embeddings",
        "kind": "initialized-untrained-nanogpt",
        "upstreamCommit": COMMIT,
        "modelSha256": MODEL_SHA256,
        "torchVersion": torch.__version__,
        "device": "cpu",
        "seed": 42,
        "config": config,
        "vocabulary": vocabulary,
        "input": idx.tolist(),
        "tokenWeights": model.transformer.wte.weight.detach().tolist(),
        "positionWeights": model.transformer.wpe.weight.detach().tolist(),
        "combined": combined.tolist(),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path)
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt/embeddings.json"
    output.write_text(json.dumps(run(args.model), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {output.name}")
