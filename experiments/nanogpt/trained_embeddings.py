"""Export chapter 03 token and position embeddings before and after the chapter 11 run.

Run: python experiments/nanogpt/trained_embeddings.py /path/to/nanoGPT
Requires the main-run snapshots written by tiny_gpt.py (kept local, unpublished).
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch

from tiny_gpt import COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot, sha256

# Character classes used to color the token-embedding map.
VOWELS = set("aeiou")


def char_class(char):
    if char in " \n":
        return "space"
    if char.islower():
        return "vowel" if char in VOWELS else "consonant"
    if char.isupper():
        return "upper"
    return "symbol"


def cosine(weight):
    unit = weight / weight.norm(dim=1, keepdim=True)
    return unit @ unit.T


def pca(weight, orient):
    """Leading principal components; `orient` fixes the arbitrary signs."""
    centered = weight - weight.mean(dim=0)
    _, s, vh = torch.linalg.svd(centered, full_matrices=False)
    coords = centered @ vh[:len(orient)].T
    for k, (row, sign) in enumerate(orient):
        if torch.sign(coords[row, k]) != sign:
            coords[:, k] = -coords[:, k]
    ratio = (s ** 2) / (s ** 2).sum()
    return coords, ratio


def per_mille(matrix):
    return [[round(v * 1000) for v in row] for row in matrix.tolist()]


def mean_offdiag(sim, rows, cols=None):
    cols = rows if cols is None else cols
    block = sim[rows][:, cols]
    if cols is rows:
        block = block[~torch.eye(len(rows), dtype=torch.bool)]
    return round(block.mean().item(), 3)


def run(nanogpt_dir):
    train = np.fromfile(nanogpt_dir / "data/shakespeare_char/train.bin", dtype=np.uint16)
    log_counts = torch.tensor(np.log(np.bincount(train, minlength=65) + 1.0), dtype=torch.float32)
    stages = []
    for it in (0, 2000):
        path = main_snapshot(it)
        _, model, meta, saved = load_snapshot(nanogpt_dir, path)
        vocab = [meta["itos"][i] for i in range(model.config.vocab_size)]
        wte = model.transformer.wte.weight.detach()
        wpe = model.transformer.wpe.weight.detach()
        assert model.lm_head.weight is model.transformer.wte.weight
        sim, pos_sim = cosine(wte), cosine(wpe)
        # Fix arbitrary signs: space negative PC1, period positive PC2, a positive PC3.
        coords, ratio = pca(wte, [(vocab.index(" "), -1), (vocab.index("."), 1), (vocab.index("a"), 1)])
        pos_coords, pos_ratio = pca(wpe, [(0, -1), (0, 1)])
        groups = {name: [i for i, c in enumerate(vocab) if char_class(c) == name]
                  for name in ("vowel", "consonant", "upper", "symbol", "space")}
        case_pairs = [(vocab.index(c.upper()), vocab.index(c)) for c in "abcdefghijklmnopqrstuvwxyz"]
        T = wpe.size(0)
        stages.append(dict(
            iter=it, sha256=sha256(path),
            wteStd=round(wte.std().item(), 4), wpeStd=round(wpe.std().item(), 4),
            wteRowNorm=round(wte.norm(dim=1).mean().item(), 4),
            wpeRowNorm=round(wpe.norm(dim=1).mean().item(), 4),
            tokenPca=[[round(v, 4) for v in row] for row in coords.tolist()],
            # Pearson correlation of PC1 with log(training count + 1) per character.
            pc1LogCountCorrelation=round(torch.corrcoef(
                torch.stack([coords[:, 0], log_counts]))[0, 1].item(), 3),
            tokenPcaRatio=[round(r, 4) for r in ratio[:4].tolist()],
            tokenCosine=per_mille(sim),
            positionCosine=per_mille(pos_sim),
            positionPc1=[round(v, 4) for v in pos_coords[:, 0].tolist()],
            positionPcaRatio=[round(r, 4) for r in pos_ratio[:4].tolist()],
            positionCosineByDistance=[round(torch.diagonal(pos_sim, k).mean().item(), 3)
                                      for k in range(T)],
            groupCosine=dict(
                vowelVowel=mean_offdiag(sim, groups["vowel"]),
                consonantConsonant=mean_offdiag(sim, groups["consonant"]),
                vowelConsonant=mean_offdiag(sim, groups["vowel"], groups["consonant"]),
                upperUpper=mean_offdiag(sim, groups["upper"]),
                symbolSymbol=mean_offdiag(sim, groups["symbol"]),
                casePairsMean=round(sum(sim[a, b].item() for a, b in case_pairs) / 26, 3),
                allOffDiagonal=mean_offdiag(sim, list(range(len(vocab)))))))
    return dict(
        experimentId="nanogpt-03-trained-embeddings", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        modelArgs=saved["model_args"], vocabulary=vocab,
        classes=[char_class(c) for c in vocab],
        pcaOrientation="space has negative PC1, '.' positive PC2, and 'a' positive PC3; position 0 negative PC1",
        cosineScale="per mille", stages=stages,
        verification=dict(weightTying=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    data = run(parser.parse_args().nanogpt.resolve())
    output = DATA_OUT / "trained-embeddings.json"
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                      encoding="utf-8")
    for s in data["stages"]:
        print(s["iter"], s["wteStd"], s["wpeStd"], s["tokenPcaRatio"], s["positionPcaRatio"],
              s["groupCosine"], s["positionCosineByDistance"][:3],
              s["positionCosineByDistance"][-3:])
    print(f"Generated {output.name}")
