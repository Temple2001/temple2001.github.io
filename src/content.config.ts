import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const post = defineCollection({
	// Load Markdown files and their co-located assets from the content directory.
	loader: glob({ base: "./src/content/post", pattern: "**/*.md" }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			tags: z.array(z.string()),
			blind: z.boolean().optional(),
			cover: z.union([image(), z.string().url()]).optional(),
			coverAlt: z.string().optional(),
		}),
});

export const collections = { post };
