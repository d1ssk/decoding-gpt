# GPTを読み解く / Decoding GPT

**nanoGPT / nanochat をコード・実験・可視化から理解する**

**Understanding nanoGPT / nanochat through code, experiments, and visualization**

`decoding-gpt` is a bilingual educational project for learning how GPT-style language models work by reading real source code, running experiments, and visualizing their internal computations.

The project begins with **nanoGPT**, then extends to **nanochat**.

## Approach

```text
Code → Experiment → Visualization → Understanding
```

Content is available in Japanese and English. The first part follows **nanoGPT** from text to training; **nanochat** will extend the project to a more complete modern LLM pipeline.

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
public/site/data/ Lightweight generated artifacts for visualizations
```

Model checkpoints and large datasets are not stored in this repository.

`lab/` is the developer's private workspace for freely running experiments, not a public resource. It is excluded from Git and deployment; articles must not link to it. How notebooks will be published remains undecided: they may be organized separately, or selected code and execution results may be included directly in articles.

## Deployment

The site is statically built with Astro and deployed by `.github/workflows/deploy.yml`. Production URLs use the repository base path `/decoding-gpt/`; keep internal links base-path aware. Astro serves deployable assets from `public/site/` so local upstream source snapshots can remain outside the published site.

## Upstream projects

This project studies and refers to:

- Andrej Karpathy's `nanoGPT`
- Andrej Karpathy's `nanochat`

Upstream source references used in articles should be tied to specific commits where appropriate.

## License

MIT
