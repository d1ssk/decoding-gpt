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
