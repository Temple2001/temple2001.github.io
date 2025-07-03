import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const post = defineCollection({
	// Load Markdown and MDX files in the `src/content/post/` directory.
	loader: glob({ base: './src/content/post', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()),
		blind: z.boolean().optional(),
		imageUrl: z.string().optional(),
	}),
});

export const collections = { post };
