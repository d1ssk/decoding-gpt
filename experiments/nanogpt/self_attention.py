"""Export and verify chapter 04 attention computations from pinned nanoGPT.

Run: python experiments/nanogpt/self_attention.py /path/to/nanoGPT/model.py
Requires PyTorch. No checkpoint is written; all model values are untrained.
"""

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import math
from pathlib import Path

import torch
from torch.nn import functional as F

from embeddings import COMMIT, MODEL_SHA256


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
    block = model.transformer.h[0]
    attn = block.attn
    cases = []
    # At t=3, change only an earlier token or only a later token.
    inputs = ([2, 1, 3, 3, 4, 0], [4, 1, 3, 3, 4, 0], [2, 1, 3, 3, 1, 0])
    max_error = 0.0

    def compute(ids):
        nonlocal max_error
        idx = torch.tensor([ids])
        B, T = idx.shape
        C = config["n_embd"]
        embedding = model.transformer.drop(model.transformer.wte(idx)
                                   + model.transformer.wpe(torch.arange(T)))
        x = block.ln_1(embedding)
        q, k, v = attn.c_attn(x).split(C, dim=2)
        q, k, v = [a.view(B, T, 1, C).transpose(1, 2) for a in (q, k, v)]
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(C)
        modes = []
        for causal in (True, False):
            mask = torch.ones(T, T, dtype=torch.bool).tril()
            masked = scores.masked_fill(~mask, float("-inf")) if causal else scores
            weights = F.softmax(masked, dim=-1)
            values = weights @ v
            reference = F.scaled_dot_product_attention(q, k, v, is_causal=causal)
            torch.testing.assert_close(values, reference, rtol=1e-5, atol=1e-7)
            output = attn.c_proj(values.transpose(1, 2).contiguous().view(B, T, C))
            torch.testing.assert_close(weights.sum(-1), torch.ones(B, 1, T))
            if causal:
                assert torch.count_nonzero(weights[0, 0].triu(1)) == 0
                actual = attn(x)
                torch.testing.assert_close(output, actual, rtol=1e-5, atol=1e-7)
                max_error = max(max_error, (output - actual).abs().max().item())
                torch.testing.assert_close(values[0, 0, 0], v[0, 0, 0])
            modes.append(dict(weights=weights[0, 0].tolist(),
                              weightedValues=(weights[0, 0, :, :, None] * v[0, 0]).tolist(),
                              aggregate=values[0, 0].tolist(),
                              output=output[0].tolist()))
        return dict(input=ids, embedding=embedding[0].tolist(), normalized=x[0].tolist(),
                    query=q[0, 0].tolist(), key=k[0, 0].tolist(), value=v[0, 0].tolist(),
                    scores=scores[0, 0].tolist(), modes=modes)

    with torch.no_grad():
        cases = [compute(ids) for ids in inputs]
        # Check short, normal, and maximum lengths against the actual module.
        for length in (1, 3, 8):
            compute(([2, 1, 3, 3, 4, 0, 2, 1])[:length])
        baseline, past, future = cases
        assert baseline["embedding"][3] == past["embedding"][3]
        assert baseline["query"][3] == past["query"][3]
        assert baseline["modes"][0]["output"][3] != past["modes"][0]["output"][3]
        for field in ("aggregate", "output"):
            assert baseline["modes"][0][field][:4] == future["modes"][0][field][:4]
            assert baseline["modes"][1][field][3] != future["modes"][1][field][3]
        toy_values = torch.tensor([[1., 0.], [0., 2.], [3., 1.]])
        toy_weights = torch.tensor([0.2, 0.3, 0.5])
        torch.testing.assert_close(toy_weights @ toy_values, torch.tensor([1.7, 1.1]))
    return dict(experimentId="nanogpt-04-self-attention", kind="initialized-untrained-nanogpt",
                upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
                device="cpu", dtype="float32", seed=42, config=config,
                vocabulary=["\n", "e", "h", "l", "o"], selectedPosition=3,
                modeOrder=["causal", "unmasked-educational-intervention"],
                caseOrder=["baseline", "past", "future"], cases=cases,
                verification=dict(maxModuleAbsoluteError=max_error,
                                  moduleTolerance=dict(rtol=1e-5, atol=1e-7),
                                  futurePrefixExactlyEqual=True,
                                  pastOutputChanged=True, unmaskedFutureOutputChanged=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path)
    args = parser.parse_args()
    data = run(args.model)
    output = Path(__file__).resolve().parents[2] / "public/site/data/nanogpt/self-attention.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                      encoding="utf-8")
    print(json.dumps(data["verification"], indent=2))
    print(f"Generated {output.name}")
