# AGENTS.md

## Project

**GPTを読み解く / Decoding GPT**

> nanoGPT / nanochat をコード・実験・可視化から理解する
> Understanding nanoGPT / nanochat through code, experiments, and visualization

Repository: `decoding-gpt`

This is a bilingual educational website for learning how GPT-style language models work by reading real source code, running experiments, and visualizing internal computations.

The site will begin with **nanoGPT** and later expand to **nanochat**.

## Core principles

* Prefer understanding through **code + experiment + visualization**, not prose alone.
* Explain concepts by following actual tensors, computations, training behavior, and model outputs.
* Keep conceptual diagrams, real-model visualizations, and experiment results clearly distinguished.
* Articles should be readable sequentially but also useful independently.
* Do not turn articles into line-by-line source-code commentary. Organize around questions and concepts.
* Prefer simple, inspectable implementations over unnecessary abstractions.

## Languages

The site is bilingual:

* Japanese: `/ja/...`
* English: `/en/...`

Japanese and English pages should have equivalent structure and content.

Do not mix UI-language strings directly into components when they should be localized.

## Technical direction

* Static site suitable for **GitHub Pages**
* Astro
* MDX for articles
* KaTeX for mathematics
* Syntax highlighting through Astro/Shiki
* Interactive visualizations may use lightweight React components and/or Plotly/D3/SVG where appropriate
* Avoid unnecessary client-side JavaScript
* The site must work correctly under the GitHub Pages repository base path `/decoding-gpt/`

## Content structure

Top level:

* nanoGPT
* nanochat

Each section contains ordered articles beginning with an overview.

Article pages should generally support this conceptual flow when appropriate:

1. Question / goal
2. Where this appears in the source
3. Concept
4. Tensor shapes / computation
5. Run an experiment
6. Visualize the result
7. Observations
8. Takeaways

Do not force every article to use all headings mechanically.

Avoid decorative lead sentences, taglines, and redundant summaries next to headings. Prefer headings followed directly by substantive content; do not automatically display metadata descriptions below article titles. Use standard, concrete wording instead of metaphors such as a codebase “map.” In Japanese articles and navigation, use `self attention` and `multi-head attention`, not `自己注意` or `マルチヘッド注意`.

## Experiments and generated data

Model execution and training happen outside GitHub Pages.

Generated lightweight artifacts may be committed for visualization, for example:

* JSON
* CSV
* SVG
* PNG/WebP
* small binary assets when justified

Do not commit:

* model checkpoints
* large datasets
* large generated artifacts

Keep experiment code separate from site rendering code.

`lab/` is the developer's private, local workspace for free-form experiments. Keep it gitignored; do not commit, deploy, or link to its files as public resources. Public notebook distribution is undecided: notebooks may later be organized separately, or selected code and execution results may be incorporated into articles. Do not promise a downloadable companion notebook until it is actually published.

Prefer a structure conceptually like:

```text
lab/
  nanogpt/
  nanochat/

public/data/
  nanogpt/
  nanochat/
```

A visualization should preferably consume reproducible generated data rather than contain unexplained hard-coded results.

## Upstream source references

nanoGPT and nanochat are external upstream projects.

When articles depend on upstream source code:

* record the repository and commit hash
* refer to specific files/functions where useful
* do not silently assume current upstream `master`
* do not copy large portions of upstream source into this repository

Short excerpts used for explanation are acceptable when necessary.

## Design

Aim for a clean technical/editorial style.

Prioritize:

* typography
* mathematics
* code
* diagrams
* plots
* whitespace
* clear navigation

Avoid excessive cards, gradients, decorative effects, or dashboard-like visual clutter.

Visualizations should function as **instruments for inspecting the model**, not merely decoration.

Support desktop and mobile layouts.

## Code quality

* Keep components small and reusable.
* Use TypeScript where practical.
* Avoid premature abstractions.
* Prefer semantic HTML and accessible controls.
* Keep visualization logic separate from article prose where reasonable.
* Do not introduce dependencies unless they provide clear value.
* Run formatting, type checks, and builds before considering a task complete.

## Development

Typical commands should remain simple:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The production build must succeed without external runtime services.

## Scope discipline

When implementing a requested feature:

* make the smallest coherent change that completes it
* do not redesign unrelated parts of the site
* do not invent scientific results or experiment outputs
* use placeholders only when clearly marked as placeholders
* preserve bilingual routing and GitHub Pages compatibility
