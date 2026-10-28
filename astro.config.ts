import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

export default defineConfig({
  site: 'https://d1ssk.github.io',
  base: '/decoding-gpt',
  publicDir: './public/site',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), react(), sitemap()],
  vite: {
    plugins: [
      {
        name: 'separate-mode-cache',
        // Content sync during a build also optimizes dependencies. Keep it
        // from replacing the React development runtime of a running server.
        config: (_config, { mode }) => ({
          cacheDir: `node_modules/.vite/${mode}`,
        }),
      },
    ],
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-light',
      wrap: false,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
