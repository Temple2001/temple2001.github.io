// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";
import remarkToc from "remark-toc";
import remarkBreaks from "remark-breaks";

// https://astro.build/config
export default defineConfig({
	site: "https://blog.templ.es",
	integrations: [sitemap()],
	server: {
		port: 3000,
	},

	vite: {
		plugins: [tailwindcss()],
	},

	markdown: {
		remarkPlugins: [
			[remarkToc, { heading: "목차", maxDepth: 2 }],
			[remarkBreaks, {}],
		],
	},
});
