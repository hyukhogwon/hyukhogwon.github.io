import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		kicker: z.string(),
		summary: z.string(),
		period: z.string(),
		role: z.string(),
		order: z.number(),
		stack: z.array(z.string()),
		impact: z.array(z.string()),
	}),
});

export const collections = { projects };
