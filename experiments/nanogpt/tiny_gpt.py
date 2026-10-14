"""Train small character-level GPTs with the procedure of pinned nanoGPT train.py.

Run: python experiments/nanogpt/tiny_gpt.py /path/to/nanoGPT main [--reference-log train.log]
     python experiments/nanogpt/tiny_gpt.py /path/to/nanoGPT scaling

The nanoGPT directory must contain the unchanged model.py and prepared
data/shakespeare_char/{train.bin,val.bin,meta.pkl}. The loop below follows
train.py's order of random draws, evaluation, learning-rate schedule, AdamW,
and gradient clipping for a single CPU process (float32, no DDP, no compile).
It only adds measurements that do not consume random numbers. Model snapshots
are written to a local runs directory; they are never published.
"""

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import math
import pickle
import re
import time
from pathlib import Path

import numpy as np
import torch
from torch.nn import functional as F

from embeddings import COMMIT, MODEL_SHA256

ROOT = Path(__file__).resolve().parents[2]
DATA_OUT = ROOT / "public/site/data/nanogpt"
RUNS_DIR = ROOT / "lab/nanogpt/runs"

# config/train_shakespeare_char.py with the README's CPU overrides.
README_CPU = dict(
    eval_interval=250, eval_iters=20, log_interval=1,
    batch_size=12, block_size=64, n_layer=4, n_head=4, n_embd=128,
    dropout=0.0, bias=False, learning_rate=1e-3, max_iters=2000,
    lr_decay_iters=2000, min_lr=1e-4, warmup_iters=100,
    weight_decay=1e-1, beta1=0.9, beta2=0.99, grad_clip=1.0,
    decay_lr=True, gradient_accumulation_steps=1,
)
README_COMMAND = (
    "python train.py config/train_shakespeare_char.py --device=cpu --compile=False "
    "--eval_iters=20 --log_interval=1 --block_size=64 --batch_size=12 --n_layer=4 "
    "--n_head=4 --n_embd=128 --max_iters=2000 --lr_decay_iters=2000 --dropout=0.0"
)


def load_module(nanogpt_dir):
    model_path = nanogpt_dir / "model.py"
    if hashlib.sha256(model_path.read_bytes()).hexdigest() != MODEL_SHA256:
        raise ValueError(f"Expected unchanged model.py from nanoGPT {COMMIT}")
    spec = importlib.util.spec_from_file_location("nanogpt_model", model_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_model(module, cfg, vocab_size):
    args = dict(n_layer=cfg["n_layer"], n_head=cfg["n_head"], n_embd=cfg["n_embd"],
                block_size=cfg["block_size"], bias=cfg["bias"], vocab_size=vocab_size,
                dropout=cfg["dropout"])
    with contextlib.redirect_stdout(io.StringIO()):
        return module.GPT(module.GPTConfig(**args)), args


def load_snapshot(nanogpt_dir, path):
    """Return (module, model in eval mode, meta, saved record) for a snapshot."""
    module = load_module(nanogpt_dir)
    saved = torch.load(path, map_location="cpu")
    with contextlib.redirect_stdout(io.StringIO()):
        model = module.GPT(module.GPTConfig(**saved["model_args"]))
    model.load_state_dict(saved["model"])
    with open(nanogpt_dir / "data/shakespeare_char/meta.pkl", "rb") as f:
        meta = pickle.load(f)
    return module, model.eval(), meta, saved


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


# Fixed validation window used by the chapter 05-09 visualizations.
VAL_START = 3


def val_window(nanogpt_dir, meta, start=VAL_START, length=64):
    data = np.memmap(nanogpt_dir / "data/shakespeare_char/val.bin", dtype=np.uint16, mode="r")
    ids = [int(i) for i in data[start:start + length + 1]]
    return ids[:-1], ids[1:], "".join(meta["itos"][i] for i in ids[:-1])


def val_batches(nanogpt_dir, count, length, seed=0, split="val"):
    """Fixed random windows drawn with a separate generator (validation by default)."""
    data = np.memmap(nanogpt_dir / f"data/shakespeare_char/{split}.bin", dtype=np.uint16, mode="r")
    gen = torch.Generator().manual_seed(seed)
    ix = torch.randint(len(data) - length, (count,), generator=gen)
    x = torch.stack([torch.from_numpy(data[i:i + length].astype(np.int64)) for i in ix])
    y = torch.stack([torch.from_numpy(data[i + 1:i + 1 + length].astype(np.int64)) for i in ix])
    return x, y


def main_snapshot(it=2000):
    """Path of a main-run snapshot after checking it against the published record."""
    path = RUNS_DIR / "main" / f"iter-{it:05d}.pt"
    record = json.loads((DATA_OUT / "tiny-training.json").read_text(encoding="utf-8"))
    if sha256(path) != record["snapshotSha256"][str(it)]:
        raise ValueError(f"{path} differs from the snapshot recorded in tiny-training.json")
    return path


@torch.no_grad()
def trace(model, idx, ablate=None):
    """Recompute GPT.forward() step by step and keep intermediate arrays.

    ablate=(layer, head) zeros that head's aggregated values before c_proj.
    Without ablation the result is checked against the actual modules.
    """
    B, T = idx.shape
    C, H = model.config.n_embd, model.config.n_head
    tr = model.transformer
    x = tr.drop(tr.wte(idx) + tr.wpe(torch.arange(T)))
    out = dict(embedding=x, layers=[])
    for layer, block in enumerate(tr.h):
        a_in = block.ln_1(x)
        q, k, v = block.attn.c_attn(a_in).split(C, dim=2)
        q, k, v = [a.view(B, T, H, C // H).transpose(1, 2) for a in (q, k, v)]
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(C // H)
        mask = torch.ones(T, T, dtype=torch.bool).tril()
        att = torch.softmax(scores.masked_fill(~mask, float("-inf")), dim=-1)
        heads = att @ v
        if ablate is not None and ablate[0] == layer:
            heads = heads.clone()
            heads[:, ablate[1]] = 0
        attn = block.attn.c_proj(heads.transpose(1, 2).contiguous().view(B, T, C))
        if ablate is None:
            torch.testing.assert_close(attn, block.attn(a_in), rtol=1e-4, atol=1e-6)
        x = x + attn
        m_in = block.ln_2(x)
        hidden = block.mlp.c_fc(m_in)
        mlp = block.mlp(m_in)
        x = x + mlp
        out["layers"].append(dict(att=att, heads=heads, attn=attn, hidden=hidden,
                                  mlp=mlp, after_attn=x - mlp, after_mlp=x))
    out["final"] = tr.ln_f(x)
    out["logits"] = model.lm_head(out["final"])
    if ablate is None:
        torch.testing.assert_close(out["logits"][:, [-1]], model(idx)[0], rtol=1e-4, atol=1e-5)
    return out


def train(nanogpt_dir, cfg, snapshot_iters=(), snapshot_dir=None, grad_detail_iters=(),
          on_batch=None):
    module = load_module(nanogpt_dir)
    data_dir = nanogpt_dir / "data/shakespeare_char"
    with open(data_dir / "meta.pkl", "rb") as f:
        vocab_size = pickle.load(f)["vocab_size"]
    B, T = cfg["batch_size"], cfg["block_size"]
    accum = cfg["gradient_accumulation_steps"]

    def get_batch(split):
        data = np.memmap(data_dir / f"{split}.bin", dtype=np.uint16, mode="r")
        ix = torch.randint(len(data) - T, (B,))
        if on_batch is not None:
            # Observation only: records start positions without drawing random numbers.
            on_batch(split, ix.tolist(), model.training)
        x = torch.stack([torch.from_numpy((data[i:i + T]).astype(np.int64)) for i in ix])
        y = torch.stack([torch.from_numpy((data[i + 1:i + 1 + T]).astype(np.int64)) for i in ix])
        return x, y

    torch.manual_seed(1337)
    model, model_args = build_model(module, cfg, vocab_size)
    with contextlib.redirect_stdout(io.StringIO()):
        optimizer = model.configure_optimizers(cfg["weight_decay"], cfg["learning_rate"],
                                               (cfg["beta1"], cfg["beta2"]), "cpu")

    @torch.no_grad()
    def estimate_loss():
        out = {}
        model.eval()
        for split in ["train", "val"]:
            losses = torch.zeros(cfg["eval_iters"])
            for k in range(cfg["eval_iters"]):
                X, Y = get_batch(split)
                _, loss = model(X, Y)
                losses[k] = loss.item()
            out[split] = losses.mean().item()
        model.train()
        return out

    def get_lr(it):
        warmup, decay = cfg["warmup_iters"], cfg["lr_decay_iters"]
        lr, min_lr = cfg["learning_rate"], cfg["min_lr"]
        if it < warmup:
            return lr * (it + 1) / (warmup + 1)
        if it > decay:
            return min_lr
        ratio = (it - warmup) / (decay - warmup)
        assert 0 <= ratio <= 1
        return min_lr + 0.5 * (1.0 + math.cos(math.pi * ratio)) * (lr - min_lr)

    def save(it):
        if snapshot_dir is not None and it in snapshot_iters:
            snapshot_dir.mkdir(parents=True, exist_ok=True)
            torch.save(dict(model=model.state_dict(), model_args=model_args, iter_num=it,
                            config=cfg), snapshot_dir / f"iter-{it:05d}.pt")

    history, evals, grad_detail = [], [], []
    iter_num, best_val = 0, 1e9
    X, Y = get_batch("train")
    started = time.time()
    while True:
        lr = get_lr(iter_num) if cfg["decay_lr"] else cfg["learning_rate"]
        for group in optimizer.param_groups:
            group["lr"] = lr
        if iter_num % cfg["eval_interval"] == 0:
            losses = estimate_loss()
            evals.append(dict(iter=iter_num, **losses))
            best_val = min(best_val, losses["val"])
        save(iter_num)
        for _ in range(accum):
            _, loss = model(X, Y)
            loss = loss / accum
            X, Y = get_batch("train")
            loss.backward()
        if iter_num in grad_detail_iters:
            grad_detail.append(dict(iter=iter_num, norms={
                name: p.grad.norm().item() for name, p in model.named_parameters()}))
        grad_norm = None
        if cfg["grad_clip"] != 0.0:
            grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), cfg["grad_clip"]).item()
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)
        history.append(dict(iter=iter_num, lr=lr, loss=loss.item() * accum, gradNorm=grad_norm))
        iter_num += 1
        if iter_num > cfg["max_iters"]:
            break
    elapsed = time.time() - started
    return dict(model=model, model_args=model_args, history=history, evals=evals,
                grad_detail=grad_detail, best_val=best_val, seconds=elapsed,
                params=sum(p.numel() for p in model.parameters()),
                non_embedding_params=model.get_num_params())


def parse_reference_log(path):
    text = Path(path).read_text(encoding="utf-8")
    iters = {int(i): float(v) for i, v in re.findall(r"^iter (\d+): loss ([\d.]+)", text, re.M)}
    evals = {int(i): (float(a), float(b)) for i, a, b in
             re.findall(r"^step (\d+): train loss ([\d.]+), val loss ([\d.]+)", text, re.M)}
    return iters, evals


def round_sig(value, digits=6):
    return None if value is None else float(f"{value:.{digits}g}")


def run_main(nanogpt_dir, reference_log):
    snapshot_iters = (0, 50, 100, 250, 500, 1000, 2000)
    detail_iters = (0, 100, 1000, 2000)
    snapshot_dir = RUNS_DIR / "main"
    result = train(nanogpt_dir, README_CPU, snapshot_iters, snapshot_dir, detail_iters)
    verification = dict(referenceLogCompared=False)
    if reference_log:
        iters, evals = parse_reference_log(reference_log)
        assert len(iters) == len(result["history"]) and len(evals) == len(result["evals"])
        for row in result["history"]:
            assert f"{row['loss']:.4f}" == f"{iters[row['iter']]:.4f}", row
        for row in result["evals"]:
            assert (f"{row['train']:.4f}", f"{row['val']:.4f}") == tuple(
                f"{v:.4f}" for v in evals[row["iter"]]), row
        verification = dict(referenceLogCompared=True, iterationsCompared=len(iters),
                            evaluationsCompared=len(evals), decimalsCompared=4)
    snapshots = {str(it): sha256(snapshot_dir / f"iter-{it:05d}.pt") for it in snapshot_iters}
    return dict(
        experimentId="nanogpt-11-train-a-tiny-gpt", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        numpyVersion=np.__version__, device="cpu", dtype="float32", seed=1337,
        dataset="shakespeare_char", readmeCommand=README_COMMAND, config=README_CPU,
        modelArgs=result["model_args"], parameters=result["params"],
        nonEmbeddingParameters=result["non_embedding_params"],
        tokensPerIteration=README_CPU["batch_size"] * README_CPU["block_size"],
        trainingSeconds=round(result["seconds"], 1),
        evals=[{k: round_sig(v) if k != "iter" else v for k, v in e.items()}
               for e in result["evals"]],
        history=[[r["iter"], round_sig(r["lr"]), round_sig(r["loss"]), round_sig(r["gradNorm"])]
                 for r in result["history"]],
        historyColumns=["iter", "lr", "loss", "gradNormBeforeClip"],
        gradientNorms=[dict(iter=g["iter"], norms={k: round_sig(v) for k, v in g["norms"].items()})
                       for g in result["grad_detail"]],
        snapshotIterations=list(snapshot_iters), snapshotSha256=snapshots,
        verification=verification)


SCALING_SHAPES = [(1, 32), (2, 32), (4, 32), (1, 64), (2, 64), (4, 64), (8, 64),
                  (1, 128), (2, 128), (4, 128), (8, 128), (2, 256), (4, 256), (8, 256)]


def run_scaling(nanogpt_dir):
    runs = []

    def record(group, overrides):
        cfg = dict(README_CPU, **overrides)
        cfg["n_head"] = max(1, cfg["n_embd"] // 32)
        cfg.setdefault("lr_decay_iters", cfg["max_iters"])
        cfg["lr_decay_iters"] = cfg["max_iters"]
        result = train(nanogpt_dir, cfg)
        last = result["evals"][-1]
        # A steadier final measurement than estimate_loss(): 200 fixed windows per split.
        model, T = result["model"].eval(), cfg["block_size"]
        final = {}
        with torch.no_grad():
            for split in ("train", "val"):
                xb, yb = val_batches(nanogpt_dir, 200, T, split=split)
                logits, _ = model(xb, yb)
                per = F.cross_entropy(logits.view(-1, logits.size(-1)), yb.view(-1),
                                      reduction="none").view(200, T)
                final[split] = per
        tokens = cfg["batch_size"] * cfg["block_size"] * (cfg["max_iters"] + 1)
        n = result["non_embedding_params"]
        flops_per_token = 6 * n + 12 * cfg["n_layer"] * cfg["n_embd"] * cfg["block_size"]
        runs.append(dict(
            group=group, nLayer=cfg["n_layer"], nHead=cfg["n_head"], nEmbd=cfg["n_embd"],
            blockSize=cfg["block_size"], batchSize=cfg["batch_size"],
            maxIters=cfg["max_iters"], dropout=cfg["dropout"],
            parameters=result["params"], nonEmbeddingParameters=n,
            trainingTokens=tokens, estimatedFlops=flops_per_token * tokens,
            train=round_sig(last["train"]), val=round_sig(last["val"]),
            fixedTrain=round_sig(final["train"].mean().item()),
            fixedVal=round_sig(final["val"].mean().item()),
            valByPosition=[round(v, 4) for v in final["val"].mean(0).tolist()],
            bestVal=round_sig(result["best_val"]), seconds=round(result["seconds"], 1),
            evals=[[e["iter"], round_sig(e["train"]), round_sig(e["val"])]
                   for e in result["evals"]]))
        print(group, overrides, runs[-1]["fixedTrain"], runs[-1]["fixedVal"], runs[-1]["seconds"],
              flush=True)

    for n_layer, n_embd in SCALING_SHAPES:
        record("model-size", dict(n_layer=n_layer, n_embd=n_embd))
    for max_iters in (250, 500, 1000, 2000, 4000, 8000):
        record("training-length", dict(max_iters=max_iters,
                                       eval_interval=max(250, max_iters // 8)))
    for block_size in (8, 16, 32, 64, 128, 256):
        record("context-length", dict(block_size=block_size, batch_size=768 // block_size))
    for dropout in (0.0, 0.2):
        record("overfitting", dict(n_layer=6, n_embd=256, max_iters=6000,
                                   eval_interval=250, eval_iters=100, dropout=dropout))
    return dict(
        experimentId="nanogpt-12-scaling-experiments", kind="trained-character-gpt-sweep",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        numpyVersion=np.__version__, device="cpu", dtype="float32", seed=1337,
        dataset="shakespeare_char", baseConfig=README_CPU,
        headRule="n_head = max(1, n_embd // 32)", lrDecayRule="lr_decay_iters = max_iters",
        flopsRule="(6 * non-embedding parameters + 12 * n_layer * n_embd * block_size)"
                  " * batch_size * block_size * (max_iters + 1)",
        fixedEvaluation="200 windows of block_size tokens per split, torch.Generator seed 0",
        runs=runs)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    parser.add_argument("run", choices=["main", "scaling"])
    parser.add_argument("--reference-log", type=Path)
    args = parser.parse_args()
    if args.run == "main":
        data = run_main(args.nanogpt.resolve(), args.reference_log)
        output = DATA_OUT / "tiny-training.json"
    else:
        data = run_scaling(args.nanogpt.resolve())
        output = DATA_OUT / "scaling.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                      encoding="utf-8")
    print(f"Generated {output.name}")
