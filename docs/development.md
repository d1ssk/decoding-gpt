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
public/site/data/ Lightweight generated artifacts for visualizations
```

Model checkpoints and large datasets are not stored in this repository.

`lab/` is the developer's private workspace for freely running experiments, not a public resource. It is excluded from Git and deployment; articles must not link to it. How notebooks will be published remains undecided: they may be organized separately, or selected code and execution results may be included directly in articles.

## Deployment

The site is statically built with Astro and deployed by `.github/workflows/deploy.yml`. Production URLs use the repository base path `/decoding-gpt/`; keep internal links base-path aware. Astro serves deployable assets from `public/site/` so local upstream source snapshots can remain outside the published site.

## Source references

Upstream source references used in articles should be tied to specific commits where appropriate.

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
