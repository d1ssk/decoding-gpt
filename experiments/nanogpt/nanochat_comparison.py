"""Export chapter 13 data computed with pinned nanochat and nanoGPT code.

Run: python experiments/nanogpt/nanochat_comparison.py /path/to/nanochat /path/to/nanoGPT/model.py
Requires PyTorch and the dependencies imported by nanochat/gpt.py (filelock).
Computes rotary-embedding examples with nanochat's own functions and compares
parameter counts of untrained models with matching sizes. No training is run.
"""

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import math
import sys
from pathlib import Path

import torch

from embeddings import COMMIT as NANOGPT_COMMIT, MODEL_SHA256

NANOCHAT_COMMIT = "92d63d4e8bb4df75c3b71618f31ddde2378b2bcd"
NANOCHAT_GPT_SHA256 = "8cdedc2e418b9d4dc45884e07f59904fcdec066bb3d76664b2adf2d415f704e3"


def run(nanochat_dir, nanogpt_model):
    if hashlib.sha256((nanochat_dir / "nanochat/gpt.py").read_bytes()).hexdigest() != NANOCHAT_GPT_SHA256:
        raise ValueError(f"Expected unchanged nanochat/gpt.py from {NANOCHAT_COMMIT}")
    if hashlib.sha256(nanogpt_model.read_bytes()).hexdigest() != MODEL_SHA256:
        raise ValueError(f"Expected unchanged model.py from nanoGPT {NANOGPT_COMMIT}")
    sys.path.insert(0, str(nanochat_dir))
    from nanochat import gpt as chat

    # Rotary embeddings with nanochat's own precomputation and rotation.
    head_dim, positions = 8, 16
    cos, sin = chat.GPT._precompute_rotary_embeddings(None, positions, head_dim, device="cpu")
    q = torch.tensor([1.0, 0.4, -0.6, 0.8, 0.3, 0.9, 0.5, -0.2])
    k = torch.tensor([0.8, -0.3, 0.2, 0.6, 0.7, 0.5, -0.4, 0.3])
    rq = chat.apply_rotary_emb(q.expand(1, positions, 1, head_dim).contiguous(), cos, sin)[0, :, 0]
    rk = chat.apply_rotary_emb(k.expand(1, positions, 1, head_dim).contiguous(), cos, sin)[0, :, 0]
    dots = rq @ rk.T
    # The score depends only on the offset m - n.
    for m in range(positions - 1):
        for n in range(positions - 1):
            assert abs(dots[m, n] - dots[m + 1, n + 1]) < 1e-5
    # Pair i holds components (i, i + d/2) and turns by -m * inv_freq[i].
    half = head_dim // 2
    inv_freq = 1.0 / (100000 ** (torch.arange(0, head_dim, 2).float() / head_dim))
    for m in range(positions):
        z = torch.complex(q[:half], q[half:]) * torch.exp(-1j * m * inv_freq)
        torch.testing.assert_close(torch.cat([z.real, z.imag]), rq[m], rtol=1e-5, atol=1e-6)

    # Parameter counts for matching sizes (untrained; counts do not depend on values).
    size = dict(n_layer=4, n_head=4, n_embd=128)
    torch.manual_seed(0)
    with contextlib.redirect_stdout(io.StringIO()):
        chat_model = chat.GPT(chat.GPTConfig(sequence_len=64, vocab_size=65, n_kv_head=4,
                                             window_pattern="L", **size))
        chat_model.init_weights()
    chat_counts = chat_model.num_scaling_params()
    spec = importlib.util.spec_from_file_location("nanogpt_model", nanogpt_model)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with contextlib.redirect_stdout(io.StringIO()):
        gpt_model = module.GPT(module.GPTConfig(block_size=64, vocab_size=65, bias=False,
                                                dropout=0.0, **size))
    gpt_counts = {}
    for name, p in gpt_model.named_parameters():
        key = ("wte" if name.endswith("wte.weight") else "wpe" if "wpe" in name
               else "layernorm" if "ln_" in name else "transformer_matrices")
        gpt_counts[key] = gpt_counts.get(key, 0) + p.numel()
    gpt_counts["total"] = sum(p.numel() for p in gpt_model.parameters())
    with torch.no_grad():
        idx = torch.randint(65, (4, 64), generator=torch.Generator().manual_seed(0))
        chat_loss = chat_model(idx, idx).item()

    return dict(
        experimentId="nanogpt-13-from-nanogpt-to-nanochat", kind="untrained-code-comparison",
        nanochatCommit=NANOCHAT_COMMIT, nanochatGptSha256=NANOCHAT_GPT_SHA256,
        nanogptCommit=NANOGPT_COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32",
        rotary=dict(headDim=head_dim, base=100000, positions=positions, q=q.tolist(), k=k.tolist(),
                    invFreq=[round(v, 8) for v in inv_freq.tolist()],
                    rotatedQ=[[round(v, 5) for v in row] for row in rq.tolist()],
                    rotatedK=[[round(v, 5) for v in row] for row in rk.tolist()],
                    dots=[[round(v, 4) for v in row] for row in dots.tolist()]),
        parameters=dict(size=dict(vocab_size=65, sequence_len=64, **size),
                        nanochat=chat_counts, nanogpt=gpt_counts,
                        nanochatPaddedVocab=chat_model.transformer.wte.weight.shape[0]),
        nanochatInitialLossRandomTokens=round(chat_loss, 4), uniformLoss=math.log(65),
        verification=dict(dotDependsOnlyOnOffset=True, pairRotationMatchesComplex=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanochat", type=Path)
    parser.add_argument("nanogpt_model", type=Path)
    args = parser.parse_args()
    data = run(args.nanochat.resolve(), args.nanogpt_model.resolve())
    output = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt/nanochat-comparison.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(data["parameters"], indent=1), data["nanochatInitialLossRandomTokens"])
    print(data["rotary"]["invFreq"], data["rotary"]["dots"][0][:4])
    print(f"Generated {output.name}")
