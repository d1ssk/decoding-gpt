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
`TokenInspector.astro` renders the initial IDs at build time and encodes edited
input in the browser with that fixed vocabulary. Unknown characters produce an
error. No network or Python runtime is needed to use the demo.

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
