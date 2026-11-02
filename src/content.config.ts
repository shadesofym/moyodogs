import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import {mediaPath,blockSchema,timelineSchema} from './lib/content-schema';

const media = mediaPath;
const common = {
  title: z.string().min(1),
  seoTitle: z.string().optional(),
  description: z.string().min(1),
  historical: z.boolean().default(false),
  published: z.boolean().default(false),
  image: media.optional(),
  imageAlt: z.string().default(''),
  blocks: z.array(blockSchema).default([]),
  gallery: z.array(z.object({ image: media, alt: z.string().min(1) })).default([]),
};
export const collections = {
  dogs: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/dogs' }), schema: z.object({ ...common, order: z.number().int().default(0) }) }),
  offspring: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/offspring' }), schema: z.object({ ...common, litter: z.enum(['shades-of', 'the-gods']) }) }),
  litters: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/litters' }), schema: z.object({ ...common, timeline: timelineSchema.default([]), period: z.string().min(1), mother: z.string().optional(), father: z.string().optional(), status: z.enum(['Geplant', 'Welpen geboren', 'Abgeschlossen']), order: z.number().int().default(0) }) }),
  posts: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/posts' }), schema: z.object({ ...common, date: z.coerce.date(), category: z.string().default('Einblicke') }) }),
  pages: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/pages' }), schema: z.object({ title: z.string(), description: z.string() }) }),
};
