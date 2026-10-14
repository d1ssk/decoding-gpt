"""Export chapter 11 samples from snapshots of the main tiny-GPT run.

Run: python experiments/nanogpt/tiny_samples.py /path/to/nanoGPT \
       [--checkpoint /path/to/out-shakespeare-char/ckpt.pt] [--sample-output sample.txt]

Each snapshot is sampled like sample.py: seed 1337, start "\n", temperature 0.8,
top_k 200. With --checkpoint, the iteration-2000 snapshot is compared with the
checkpoint written by train.py; with --sample-output, the generated text is
compared with sample.py's printed sample.
"""

import argparse
import contextlib
import io
import json
from pathlib import Path

import torch

from tiny_gpt import (COMMIT, DATA_OUT, MODEL_SHA256, load_snapshot, main_snapshot, sha256)

SETTINGS = dict(start="\n", maxNewTokens=300, temperature=0.8, topK=200, seed=1337)


def run(nanogpt_dir, checkpoint, sample_output):
    record = json.loads((DATA_OUT / "tiny-training.json").read_text(encoding="utf-8"))
    evals = {e["iter"]: e for e in record["evals"]}
    samples, verification = [], dict(checkpointCompared=False, sampleOutputCompared=False)
    for it in record["snapshotIterations"]:
        path = main_snapshot(it)
        module, _, meta, saved = load_snapshot(nanogpt_dir, path)
        stoi, itos = meta["stoi"], meta["itos"]
        # sample.py seeds before constructing the model, whose initialization
        # consumes random numbers, and then loads the saved weights.
        torch.manual_seed(SETTINGS["seed"])
        with contextlib.redirect_stdout(io.StringIO()):
            model = module.GPT(module.GPTConfig(**saved["model_args"]))
        model.load_state_dict(saved["model"])
        model.eval()
        x = torch.tensor([[stoi[c] for c in SETTINGS["start"]]])
        y = model.generate(x, SETTINGS["maxNewTokens"], temperature=SETTINGS["temperature"],
                           top_k=SETTINGS["topK"])
        text = "".join(itos[i] for i in y[0].tolist())
        samples.append(dict(iter=it, sha256=sha256(path), text=text,
                            train=evals.get(it, {}).get("train"),
                            val=evals.get(it, {}).get("val")))
        if it == 2000 and checkpoint:
            state = torch.load(checkpoint, map_location="cpu")["model"]
            mine = model.state_dict()
            assert state.keys() == mine.keys()
            assert all(torch.equal(state[k], mine[k]) for k in state)
            verification["checkpointCompared"] = True
        if it == 2000 and sample_output:
            printed = Path(sample_output).read_text(encoding="utf-8")
            assert text in printed, "sample.py output differs"
            verification["sampleOutputCompared"] = True
    return dict(
        experimentId="nanogpt-11-train-a-tiny-gpt-samples", kind="trained-character-gpt",
        upstreamCommit=COMMIT, modelSha256=MODEL_SHA256, torchVersion=torch.__version__,
        device="cpu", dtype="float32", settings=SETTINGS, samples=samples,
        verification=verification)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nanogpt", type=Path)
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--sample-output", type=Path)
    args = parser.parse_args()
    data = run(args.nanogpt.resolve(), args.checkpoint, args.sample_output)
    output = DATA_OUT / "tiny-samples.json"
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for s in data["samples"]:
        print(s["iter"], repr(s["text"][:120]))
    print(data["verification"])
    print(f"Generated {output.name}")
