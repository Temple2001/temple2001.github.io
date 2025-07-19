import { visit } from "unist-util-visit";

export default function firstImageToFrontmatter() {
	return (tree, file) => {
		console.log(file.data.astro.frontmatter);
		// frontmatter가 이미 imageUrl을 갖고 있으면 건너뜁니다.
		if (file.data.astro.frontmatter.imageUrl) {
			return;
		}
		console.log(file.data.astro.frontmatter);

		let firstImageUrl = null;

		visit(tree, "image", (node) => {
			if (!firstImageUrl) {
				firstImageUrl = node.url;
			}
		});

		if (firstImageUrl) {
			// Astro/Remark frontmatter에 삽입
			file.data.astro.frontmatter.imageUrl = firstImageUrl;
		}
	};
}
