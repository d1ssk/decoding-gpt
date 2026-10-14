"""Export chapter 06 residual-stream and MLP data from the chapter 11 tiny GPT.

Run: python experiments/nanogpt/residual_stream.py /path/to/nanoGPT
Requires the main-run snapshot written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
from pathlib import Path

import torch
from torch.nn import functional as F

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot,
                      sha256, trace, val_batches, val_window)


def r(values, digits=4):
    return [round(v, digits) for v in values]


def run(nanogpt_dir):
    path = main_snapshot()
    _, model, meta, saved = load_snapshot(nanogpt_dir, path)
    cfg = model.config
    ids, _, text = val_window(nanogpt_dir, meta)
    idx = torch.tensor([ids])
    tr = trace(model, idx)
    layers = tr["layers"]

    # The stream before ln_f is the embedding plus every sublayer output.
    total = tr["embedding"] + sum(layer["attn"] + layer["mlp"] for layer in layers)
    torch.testing.assert_close(total, layers[-1]["after_mlp"], rtol=1e-5, atol=1e-5)

    # Contributions written into the stream at each position, in order.
    writes = [("embedding", tr["embedding"])]
    for l, layer in enumerate(layers):
        writes += [(f"attn{l}", layer["attn"]), (f"mlp{l}", layer["mlp"])]
    final = layers[-1]["after_mlp"][0]
    stream, contributions = torch.zeros_like(final), []
    for name, value in writes:
        value = value[0]
        stream = stream + value
        contributions.append(dict(
            name=name, norm=r(value.norm(dim=-1).tolist(), 3),
            streamNorm=r(stream.norm(dim=-1).tolist(), 3),
            cosToFinal=r(F.cosine_similarity(value, final, dim=-1).tolist(), 3)))

    # LayerNorm at the input of layer 0 attention for one position.
    pos = 52
    ln = model.transformer.h[0].ln_1
    vec = tr["embedding"][0, pos]
    mean, var = vec.mean(), vec.var(unbiased=False)
    normalized = (vec - mean) / torch.sqrt(var + 1e-5)
    torch.testing.assert_close(normalized * ln.weight, ln(vec), rtol=1e-5, atol=1e-6)
    layer_norm = dict(position=pos, input=r(vec.tolist(), 5), mean=mean.item(),
                      std=var.sqrt().item(), normalized=r(normalized.tolist()),
                      weight=r(ln.weight.tolist()), output=r(ln(vec).tolist()))

    # Statistics over fixed random validation windows.
    xb, _ = val_batches(nanogpt_dir, 200, cfg.block_size)
    full = trace(model, xb)
    edges = torch.linspace(-8, 4, 49)
    mlp_stats, stream_stats = [], [dict(name="embedding",
                                        meanNorm=full["embedding"].norm(dim=-1).mean().item())]
    for l, layer in enumerate(full["layers"]):
        pre = layer["hidden"].flatten()
        counts = torch.histc(pre.clamp(-8, 4 - 1e-6), bins=48, min=-8, max=4)
        mlp_stats.append(dict(layer=l, positiveFraction=(pre > 0).float().mean().item(),
                              histogram=[int(c) for c in counts.tolist()],
                              total=pre.numel()))
        stream_stats += [
            dict(name=f"attn{l}", meanNorm=layer["after_attn"].norm(dim=-1).mean().item(),
                 meanWrite=layer["attn"].norm(dim=-1).mean().item()),
            dict(name=f"mlp{l}", meanNorm=layer["after_mlp"].norm(dim=-1).mean().item(),
                 meanWrite=layer["mlp"].norm(dim=-1).mean().item())]

    # The MLP acts on each position separately: changing one position's
    # input leaves every other position's output unchanged.
    block = model.transformer.h[0]
    with torch.no_grad():
        m_in = block.ln_2(layers[0]["after_attn"])
        changed = m_in.clone()
        changed[0, 10] += 1.0
        a, b = block.mlp(m_in), block.mlp(changed)
    others = [t for t in range(len(ids)) if t != 10]
    assert torch.equal(a[0, others], b[0, others]) and not torch.equal(a[0, 10], b[0, 10])

    return dict(
        experimentId="nanogpt-06-mlp-and-residual-stream", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", snapshot=dict(iter=saved["iter_num"], sha256=sha256(path)),
        modelArgs=saved["model_args"], text=text, ids=ids, valStart=3,
        contributions=contributions, layerNorm=layer_norm,
        histogramEdges=r(edges.tolist(), 2), mlpStats=mlp_stats,
        streamStats=[{k: (round(v, 4) if isinstance(v, float) else v) for k, v in s.items()}
                     for s in stream_stats],
        statsWindows=200, statsSeed=0,
        verification=dict(streamDecomposition=True, layerNormFormula=True,
                          mlpPositionwise=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "residual-stream.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    print(json.dumps(data["streamStats"], indent=1))
    print([round(m["positiveFraction"], 3) for m in data["mlpStats"]])
    print(data["layerNorm"]["mean"], data["layerNorm"]["std"])
    print(f"Generated {output.name}")
