import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/articles',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/i, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int().nonnegative(),
    series: z.enum(['nanogpt', 'nanochat']),
    lang: z.enum(['ja', 'en']),
    translationKey: z.string(),
    slug: z.string(),
    draft: z.boolean().default(false),
    upstream: z
      .object({
        repository: z.string().optional(),
        commit: z.string().optional(),
        sourceFiles: z.array(z.string()).optional(),
      })
      .optional(),
    experimentId: z.string().optional(),
  }),
});

export const collections = { articles };
