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
* Explain concepts by following actual multidimensional arrays, computations, training behavior, and model outputs.
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

Use 「多次元配列」 in Japanese explanations and “multidimensional array” in English explanations for model data arrays, rather than 「テンソル」 or “tensor.” Follow this terminology in articles and conversational explanations. Preserve literal API/type names and source code such as `torch.Tensor` when referring to the implementation.

Likewise, describe model data as 「配列」 / “arrays” rather than 「行列」 / “matrices”; use 「2 次元配列」 / “two-dimensional arrays” when dimensionality matters. Apply this convention in articles and conversational explanations while preserving literal API/type names and source code.

In Japanese body text, insert a half-width space between English expressions and Japanese text, including around inline code and linked English terms.

Prefer direct, affirmative explanations in both languages. Avoid unnecessary negative contrasts such as 「〜ではない」「〜ではありません」 or “not X, but Y”; retain negation when needed for accurate constraints or errors.

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
4. Multidimensional array shapes / computation
5. Run an experiment
6. Visualize the result
7. Observations
8. Takeaways

Do not force every article to use all headings mechanically.

Avoid decorative lead sentences, taglines, and redundant summaries next to headings. Prefer headings followed directly by substantive content; do not automatically display metadata descriptions below article titles. Use standard, concrete wording instead of metaphors such as a codebase “map.” In Japanese articles and navigation, use `self-attention` and `multi-head attention`, not `自己注意` or `マルチヘッド注意`.

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

Use 「参照元リポジトリ」 in Japanese prose and “source repository” in English prose instead of “upstream.” Existing internal metadata keys such as `upstream` may remain unchanged.

## Source repository references

nanoGPT and nanochat are external source repositories.

When articles depend on code from a source repository:

* record the repository and commit hash
* refer to specific files/functions where useful
* do not silently assume the source repository’s current `master`
* do not copy large portions of code from a source repository into this repository

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


## Documentation audience

Keep public-facing READMEs focused on the project, published URL, user instructions, limitations, and licensing. Put maintainer-only setup, deployment, analytics administration, implementation details, and validation procedures in the dedicated documents below. Keep personal machine paths and temporary work notes out of committed documentation. READMEs inside developer-only directories may serve as technical indexes.

- [docs/development.md](docs/development.md)
