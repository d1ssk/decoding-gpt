# Decoding GPT development

Commands run from the repository root. This guide covers local development, unpublished experiments, article structure, and deployment.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Vite dependency caches are separated by mode in `astro.config.ts`. Astro's
content sync during a production build can optimize React dependencies while
the development server is running. Separate caches prevent the production JSX
runtime from replacing the development runtime and causing `jsxDEV is not a
function` during hydration.

## Structure

```text
src/content/  Bilingual MDX articles and metadata
src/pages/    Astro routes
src/components/ Reusable site and visualization components
lab/          Private local experiments (gitignored; not published)
experiments/  Reproducible generators for published article examples
public/site/data/ Lightweight generated artifacts for visualizations
```

Model checkpoints and large datasets are not stored in this repository.

`lab/` is the developer's private workspace for freely running experiments, not a public resource. It is excluded from Git and deployment; articles must not link to it. How notebooks will be published remains undecided: they may be organized separately, or selected code and execution results may be included directly in articles.

## Deployment

The site is statically built with Astro and deployed by `.github/workflows/deploy.yml`. Production URLs use the repository base path `/decoding-gpt/`; keep internal links base-path aware. Astro serves deployable assets from `public/site/` so local source repository snapshots can remain outside the published site.

## Source references

Source repository references used in articles should be tied to specific commits where appropriate.

## Local nanoGPT dataset preparation

`public/data/nanogpt/` holds a local working copy of `public/data/nanoGPT-master/`.
Both directories are gitignored and outside Astro's `public/site/` asset directory.
The copied source files are unchanged and were verified against nanoGPT commit
`3adf61e154c3fe3fca428ad6bc3818b27a3b8291`.

With that local copy in place, run both original preparation scripts from this
repository's root:

```bash
python3 -m venv lab/nanogpt/.venv
lab/nanogpt/.venv/bin/python -m pip install numpy requests tiktoken
lab/nanogpt/.venv/bin/python public/data/nanogpt/data/shakespeare_char/prepare.py
TIKTOKEN_CACHE_DIR=lab/nanogpt/.tiktoken-cache lab/nanogpt/.venv/bin/python public/data/nanogpt/data/shakespeare/prepare.py
```

Each script reads `input.txt` in its own dataset directory and overwrites
`train.bin` and `val.bin` there. The character version also writes `meta.pkl`.
For reproducible inputs, place the corpus from the pinned `SOURCE_URL` below
in both directories before running; its SHA-256 must be
`86c4e6aa9db7c042ec79f339dcb96d42b0075e16b8fc2e86bf0ca57e2dc565ed`.
Without `input.txt`, the original scripts download from the source repository's
`master` branch. BPE preparation also downloads GPT-2 encoding files on its first
run and keeps them in the local cache specified above.

| Dataset directory        | Training tokens | Validation tokens |
| ------------------------ | --------------: | ----------------: |
| `data/shakespeare_char/` |       1,003,854 |           111,540 |
| `data/shakespeare/`      |         301,966 |            36,059 |

Both binary formats store `uint16` IDs (two bytes per token). Keep the full corpus,
binary files, and source copy local; published visualizations use the lightweight
artifacts in `public/site/data/`.

## Article example data

Chapter 01 uses a small, deterministic character-tokenization example. Regenerate
its JSON artifact with Python 3 (standard library only):

```bash
python3 experiments/nanogpt/text_to_tokens.py
npx prettier --write public/site/data/nanogpt/text-to-tokens.json
```

The generator verifies encoding/decoding round trips, unknown-character failure,
and binary serialization. Its output is an educational computation, not a model
training result. Keep the executable
snippets and reported results in both article translations consistent with the
artifact. No Python process or network request is needed to build or view the site.

The interactive demo uses a separate vocabulary generated from Tiny Shakespeare
with nanoGPT's `sorted(set(data))` and enumeration procedure. Download the corpus
from the pinned `SOURCE_URL` in `experiments/nanogpt/shakespeare_tokenizer.py`
to a temporary location, then run:

```bash
python3 experiments/nanogpt/shakespeare_tokenizer.py /path/to/input.txt
npx prettier --write public/site/data/nanogpt/shakespeare-tokenizer.json
```

The generator verifies the corpus SHA-256 and records both source commits in the
artifact. Only the vocabulary and initial example are published, not the corpus.
The initial example, `To be, or not to be?`, lets readers check that repeated
characters receive the same ID.
`TokenInspector.astro` renders the initial IDs at build time and encodes edited
input in the browser with that fixed vocabulary. Unknown characters produce an
error. No network or Python runtime is needed to use the demo.

## Overview figures

Chapter 00's `PipelineDiagram.astro` accepts an optional `href` and `chapters`
label per step; links are relative (`../01-text-to-tokens/`) so they work under
the base path in both languages. `SampleComparison.astro` shows the opening of
the iteration-0 and iteration-2000 samples from `tiny-samples.json` without
JavaScript.

## Character frequencies

Chapter 01 also shows how often each character appears in `train.bin` and the
validation loss of frequency-only predictions. With the prepared local nanoGPT
data (see “Local nanoGPT dataset preparation”), run with NumPy:

```bash
lab/nanogpt/.venv/bin/python experiments/nanogpt/character_frequency.py public/data/nanogpt
```

The artifact `character-frequency.json` holds training and validation counts and
three baselines on the validation targets: uniform (`ln 65`), unigram, and bigram
(previous character), both with add-one smoothing of the training counts.
`CharacterFrequency.astro` renders the bars and a loss scale at build time; the
chapter 11 value on that scale comes from `tiny-training.json`. No JavaScript is
needed.

## Training batch example

Chapter 02 uses a deterministic 12-token input with fixed starting positions.
Regenerate its artifact with Python 3 (standard library only):

```bash
python3 experiments/nanogpt/training_batches.py
npx prettier --write public/site/data/nanogpt/training-batches.json
```

The generator checks all valid window lengths and starts, the final target at
the data boundary, and invalid inputs. `BatchInspector.astro` renders the saved
batch at build time and computes new slices in the browser when controls change.
This is an educational computation, not a trained-model result. The demo fixes
`B = 2`. The Sample button independently draws both starts, with replacement,
from `0` through `N - T - 1`. Changing `T` also resamples the entire batch;
changing the prediction position `t` preserves the selected starts.
The articles show the source repository’s `get_batch()` implementation, with
comments omitted, followed by an interactive section. The demo shows source
indices, IDs, and characters in three rows; the input and target tables emphasize
IDs. Prediction examples show IDs first, with characters in parentheses.
When changing the excerpt, verify it against the pinned source commit.

## Batch coverage

Chapter 02 counts how often each `train.bin` position appeared in an input `X`
during the chapter 11 run. `experiments/nanogpt/batch_coverage.py` reruns that
training through `tiny_gpt.train()` with an `on_batch` hook that records start
positions without drawing random numbers (about 30 seconds on CPU):

```bash
lab/nanogpt/.venv/bin/python experiments/nanogpt/batch_coverage.py public/data/nanogpt
```

Start positions depend only on the random sequence. The generator checks the rerun
against all 2,001 per-iteration losses in `tiny-training.json` (within 5e-5);
final weights can differ from the snapshot by float rounding (about 1e-4) because
CPU kernels are not bitwise deterministic. Batches drawn by `estimate_loss()` run
in eval mode and are excluded. `BatchCoverage.astro` renders the count histogram
with a Poisson estimate and the covered share by update, without JavaScript.
The chapter's runnable `get_batch()` check uses seed 0 and is unrelated to the
run's first batch.

## Embedding example

Chapter 03 exports weights and sums from an initialized, untrained nanoGPT model.
Use a Python environment with PyTorch installed (the published artifact records
PyTorch 2.8.0 on CPU), and supply the unchanged `model.py` from the pinned commit:

```bash
python experiments/nanogpt/embeddings.py /path/to/nanoGPT/model.py
npx prettier --write public/site/data/nanogpt/embeddings.json
```

The generator verifies the source file's SHA-256 before importing it. It records
the source commit, seed, full model configuration, environment, embedding weights,
and initial sums. It checks those sums against the actual first Transformer
block's input at several input lengths, including `block_size`, and checks that
longer inputs are rejected. No checkpoint is saved. Exact initialization values
can vary across PyTorch versions and execution environments.

`EmbeddingInspector.astro` renders the saved example at build time. Browser
controls select a batch position and edit a token, with input length fixed at six, while
keeping the full learned weight tables available in an expandable section. New sums use float32 rounding
before being displayed to four decimal places. The weights remain fixed; these
controls do not train a model. The site build and runtime need neither Python nor
PyTorch. Both translations include a runnable shape/equality check using the
same configuration.

The example model uses `n_embd = 3`. `EmbeddingVectorPlot.astro` and
`src/lib/embedding-plot.ts` render those three components with an orthographic
projection, a shared axis scale, and a fixed extent covering all token/position
combinations. Dragging (including touch) or arrow keys rotates the view. A slider
controls zoom; an unchecked-by-default checkbox moves the position arrow from
the origin to the token tip.
The sum stays fixed during translation. Numeric tables and the initial SVG also
render without JavaScript. This uses SVG and pointer events with no plotting
dependency or external runtime service.

## Trained embeddings

Chapter 03 compares `wte` and `wpe` after 0 and 2,000 updates of the chapter 11
run, using the local snapshots:

```bash
lab/nanogpt/.venv/bin/python experiments/nanogpt/trained_embeddings.py public/data/nanogpt
```

`trained-embeddings.json` holds, per stage, the three leading principal components
of the 65 token rows (signs fixed so that the space has negative PC1 and `.`
positive PC2 and `a` positive PC3), explained-variance ratios, the correlation of PC1 with log training
counts, cosine-similarity arrays for tokens (65 × 65) and positions (64 × 64) in
per mille, mean position similarity by distance, and group means (vowels,
consonants, uppercase, symbols, case pairs). `EmbeddingMap.astro` places each
character as a glyph colored by class (a palette validated for color-vision
deficiency; the glyph itself is the label) and lists cosine neighbors of a selected
character. Its 3D mode uses an orthographic SVG projection with a common scale
across stages and axes, drag and arrow-key rotation, scroll/pinch and +/− key
zoom (initially 1.5×), and a coordinate readout. Axes scale together with the points. Reset restores both rotation and zoom. PCA is fitted separately at each stage.
`PositionSimilarity.astro` draws the position heatmap on a canvas with
a blue–paper–orange diverging scale and the by-distance curve as SVG.

## Self-attention example

Chapter 04 follows one head in the same initialized model as Chapter 03. Generate
its small, fixed input comparisons with PyTorch 2.8.0 on CPU:

```bash
python experiments/nanogpt/self_attention.py /path/to/nanoGPT/model.py
npx prettier --write public/site/data/nanogpt/self-attention.json
```

The generator verifies the pinned source SHA-256 before importing it. The artifact
records configuration, environment, source provenance, and intermediate arrays for
the original input and two single-token changes (past and future relative to
position 3). Each input has causal and unmasked computations; the unmasked mode
is an educational intervention, not normal nanoGPT inference. No checkpoint is
saved. The opening toy example is separate from these untrained-model data.

Checks compare manual aggregation with PyTorch scaled dot product attention in
both modes and compare causal projected outputs with the actual nanoGPT module.
They cover lengths 1, 3, 6, and 8, normalized attention rows, zero future weights,
the first position's identity aggregation, and invariance of the causal prefix
when a future token changes. The generator also checks that a past change affects
the selected output and that a future change affects it when masking is removed.

The opening weighted-sum example in `WeightedVectorSum.astro` is an independent
illustration with two samples, three positions, and two components. In
`src/lib/weighted-vectors.ts`, a fixed seed (29) generates signed input vectors
and shared linear transformation weights. Applying those weights with zero bias
produces `v`. The same module applies the documented query and key weights to
the inputs, scales the dot products by `1/√2` (`d = 2`), applies the causal mask,
and takes a row-wise softmax; that `att` produces `y = att @ v`. All three chapter
04 toy figures therefore show one consistent computation. Coefficients are shown
to three decimals; sums use full precision.
The singleton head axis is omitted only in the `v`, `att`, and `y` fixture arrays.
The UI shows full shapes and fixes the head index to zero.

`VectorGrid.astro` renders `x`, `v`, and `y` as grids of SVG arrows from
`VectorArrow.astro`, with centered origins and a shared symmetric scale.
Selecting one of six cells in `x` highlights the corresponding positions in
`v` and `y`, the source sample, and the attention row. The display follows
`x`, `v`, `att`, the weighted-vector equation, and finally `y`. Position indices
in `att` are smaller and lighter than the coefficient entries. A component
disclosure includes the selected input, numeric weighted sum, and value weights.
All arrays remain fixed; interaction chooses which computed output to inspect.
The initial state and native `details` element work without JavaScript. A small
Astro script handles selection without new dependencies.

`QueryKeyDotProducts.astro` adds the query–key illustration to chapter 04.
`src/lib/query-key-vectors.ts` re-exports the queries, keys, and dot products
from `weighted-vectors.ts` (kept in one module to avoid a circular import) and
adds the display helpers. Separate `B × T` grids show queries and keys; selecting any cell in either
grid highlights the corresponding sample row in both. The lower `T × T` grid overlays
`q_t` and `k_j` and shows their raw dot product, before scaling or masking.
Both samples are rendered statically, and a small script switches the visible
sample. A component disclosure shows numeric vectors, dot products, and weights.
The no-JavaScript fallback shows sample zero. `VectorArrow.astro` supports a
shared extent and an optional dashed second vector for these pair plots.

`ScoresToWeights.astro` shows the toy example's scaled scores, the masked
scores, and the softmax weights side by side for a selected sample, with a slider
multiplying the scores by 0.25–8 before softmax (`causalSoftmax()` in
`src/lib/attention-scaling.ts`). Factor 1 reproduces `att`.

`AttentionScaling.astro` plots `attention-scaling.json`, generated by:

```bash
lab/nanogpt/.venv/bin/python experiments/nanogpt/attention_scaling.py public/data/nanogpt
```

Part 1 draws one query and 64 keys with independent standard normal components
(4,000 trials per `d`, seed 0) and records the score standard deviation, mean
largest weight, and effective number of positions `exp(entropy)` with and
without `1/√d`. Part 2 measures the actual scaled scores of the chapter 11 model
at 0 and 2,000 updates on the 200 fixed validation windows; it does not remove the
scaling from the trained model, which would not be meaningful.

## Trained tiny GPT (chapters 00–12)

Chapters 05–12 (and parts of 00–04) inspect one small model trained with the CPU command from the
nanoGPT README (`n_layer = 4`, `n_head = 4`, `n_embd = 128`, `block_size = 64`,
2,000 iterations). `experiments/nanogpt/tiny_gpt.py` reruns `train.py`'s loop
with the unchanged pinned `model.py`, the same random-draw order, evaluation,
schedule, AdamW, and clipping (single CPU process, float32). It only adds
measurements that consume no random numbers: per-iteration learning rate,
loss, and pre-clipping gradient norm, per-parameter gradient norms at a few
iterations, and weight snapshots. Snapshots are written to
`lab/nanogpt/runs/main/` (gitignored) and never published; their SHA-256
values are recorded in `tiny-training.json` and checked by every downstream
generator.

Regenerate everything with PyTorch 2.8.0 on CPU, using the local nanoGPT copy
with prepared `data/shakespeare_char/` (see “Local nanoGPT dataset
preparation”):

```bash
cd public/data/nanogpt
../../../lab/nanogpt/.venv/bin/python train.py config/train_shakespeare_char.py \
  --device=cpu --compile=False --eval_iters=20 --log_interval=1 --block_size=64 \
  --batch_size=12 --n_layer=4 --n_head=4 --n_embd=128 --max_iters=2000 \
  --lr_decay_iters=2000 --dropout=0.0 > /tmp/train.log 2>&1
../../../lab/nanogpt/.venv/bin/python sample.py --out_dir=out-shakespeare-char \
  --device=cpu --num_samples=1 --max_new_tokens=300 > /tmp/sample.txt 2>/dev/null
cd ../../../experiments/nanogpt
PY=../../lab/nanogpt/.venv/bin/python
NANOGPT=../../public/data/nanogpt
$PY tiny_gpt.py $NANOGPT main --reference-log /tmp/train.log
$PY multi_head_attention.py $NANOGPT
$PY residual_stream.py $NANOGPT
$PY probabilities.py $NANOGPT
$PY loss.py $NANOGPT
$PY backpropagation.py $NANOGPT
$PY training_loop.py $NANOGPT
$PY tiny_samples.py $NANOGPT --checkpoint $NANOGPT/out-shakespeare-char/ckpt.pt \
  --sample-output /tmp/sample.txt
$PY tiny_gpt.py $NANOGPT scaling
$PY character_frequency.py $NANOGPT
$PY batch_coverage.py $NANOGPT
$PY trained_embeddings.py $NANOGPT
$PY attention_scaling.py $NANOGPT
$PY nanochat_comparison.py ../../public/data/nanochat-master $NANOGPT/model.py
cd ../..
npx prettier --write public/site/data/nanogpt/*.json
```

`main` writes `tiny-training.json` and compares all 2,001 per-iteration losses
and the 9 evaluations with the `train.py` log to four decimals.
`tiny_samples.py` checks that the iteration-2000 snapshot equals the
`ckpt.pt` written by `train.py` and that its text equals `sample.py`'s output
(`sample.py` seeds before constructing the model, so the generator does the
same). The checkpoint after 2,000 updates is the model used by chapters 05–09.
In the reference environment (Apple M2 CPU) the `train.py` command took about
34 seconds; the scaling sweep takes roughly 35–60 minutes.

The analysis generators recompute the forward pass step by step (`trace()` in
`tiny_gpt.py`) and assert agreement with the actual modules. Fixed inputs:
validation characters 3–66 (`VAL_START = 3`, 64 inputs and 64 shifted targets),
and 200 random 64-character validation windows drawn with a separate
`torch.Generator` seed 0 for statistics.

| Artifact                    | Chapter | Contents and checks                                                                                                                                      |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `character-frequency.json`  | 01      | Character counts per split and uniform / unigram / bigram validation losses                                                                              |
| `batch-coverage.json`       | 02      | How often each `train.bin` position entered an input during the chapter 11 run; Poisson estimate; rerun checked against the loss history                 |
| `trained-embeddings.json`   | 03      | Token PCA, cosine arrays, group means, and position similarity at iterations 0 and 2000                                                                  |
| `attention-scaling.json`    | 04      | Score spread and effective positions with and without `1/√d` (random vectors); actual scaled scores of the chapter 11 model                              |
| `multi-head-attention.json` | 05      | Attention weights (per-mille) for 4 layers × 4 heads, head statistics, zero-ablation losses; concatenation and per-head `c_proj` sum checks              |
| `residual-stream.json`      | 06      | Sublayer write norms and cosine to the final stream, LayerNorm example, MLP pre-activation histograms; stream decomposition and position-wise MLP checks |
| `probabilities.json`        | 07      | Final logits and logit-lens top-5 per stage; weight tying, `logits = h @ wteᵀ`, and one `generate()` step reproduced                                     |
| `loss.json`                 | 08      | Per-character loss and top-5 at iterations 0, 250, 2000; mean −log p and `ignore_index` checks                                                           |
| `backpropagation.json`      | 09      | Logit gradient, float64 finite differences, tied-weight gradient split, embedding-gradient norms per loss position                                       |
| `training-loop.json`        | 10      | Optimizer groups, gradient accumulation equivalence, one AdamW step, clipping statistics; `get_lr()` vs recorded rates                                   |
| `tiny-training.json`        | 09–11   | Configuration, per-iteration history, evaluations, gradient norms, snapshot hashes                                                                       |
| `tiny-samples.json`         | 00, 11  | `sample.py`-equivalent text at iterations 0, 50, 100, 250, 500, 1000, 2000                                                                               |
| `scaling.json`              | 12      | 28 runs (model size, training length, context length, dropout) with `estimate_loss()` curves and a fixed 200-window evaluation per split                 |
| `nanochat-comparison.json`  | 13      | RoPE example computed with nanochat's own functions (offset-only dependence checked) and parameter counts at matching sizes                              |

Components render initial states at build time and recompute only selections
or browser-side formulas (softmax with temperature/top-k, `get_lr()`, LayerNorm
under shift/scale). Values computed in the browser are labelled as such in the
articles. The cross-entropy toy in chapters 08–09 is a hand-set conceptual
example. Exact values can vary across PyTorch versions and hardware.

The nanochat snapshot in `public/data/nanochat-master/` matches all 53 files of
nanochat commit `92d63d4e8bb4df75c3b71618f31ddde2378b2bcd` (verified by Git
blob hashes); `nanochat_comparison.py` checks the SHA-256 of `nanochat/gpt.py`.

## Sitemaps

The existing `@astrojs/sitemap` integration generates `dist/sitemap-index.xml`
and `dist/sitemap-0.xml` during `npm run build`. Published URLs include the
`/decoding-gpt/` base path and trailing slashes. The language landing page,
Japanese and English home/series pages, and non-draft articles are included.
Draft articles have no generated route and are not included. New published
article routes are picked up automatically; do not edit generated XML.

Search Console uses the host-wide `https://d1ssk.github.io/` URL-prefix property.
Its root `sitemap-index.xml` references `/decoding-gpt/sitemap-0.xml` directly,
not this project's index, to avoid nesting indexes. If the output grows into
multiple `sitemap-N.xml` files, add all of them to the host index. There is no
need to submit this project's sitemap separately.
