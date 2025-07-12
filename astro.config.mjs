// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), sitemap()],
	server: {
		port: 3000,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	markdown: {
		remarkPlugins: [
			["remark-toc", { heading: "목차", maxDepth: 2 }],
			["remark-breaks", {}],
		],
	},
});
