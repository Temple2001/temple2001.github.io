// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";
import remarkToc from "remark-toc";
import remarkBreaks from "remark-breaks";
import firstImageToFrontmatter from "./src/plugins/remark-first-image-to-frontmatter.mjs";

// https://astro.build/config
export default defineConfig({
	site: "https://blog.templ.es",
	integrations: [mdx(), sitemap()],
	server: {
		port: 3000,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	markdown: {
		remarkPlugins: [
			firstImageToFrontmatter,
			[remarkToc, { heading: "목차", maxDepth: 2 }],
			[remarkBreaks, {}],
		],
	},
});
