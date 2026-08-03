import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getVisiblePosts } from '../../lib/post-utils.mjs';
import { createOgImage, type OgImageData } from '../../lib/og-image';

const PAGE_SIZE = 10;

export const prerender = true;

export const getStaticPaths = (async () => {
	const posts = getVisiblePosts(await getCollection('post'));
	const pageCount = Math.ceil(posts.length / PAGE_SIZE);

	const postPaths = posts.map((post) => ({
		params: { slug: `post/${post.id}` },
		props: {
			title: post.data.title,
			description: post.data.description,
			type: 'post',
			date: post.data.pubDate,
			tags: post.data.tags,
		} satisfies OgImageData,
	}));

	const listPaths = Array.from({ length: pageCount }, (_, index) => {
		const page = index + 1;
		return {
			params: { slug: `list/${page}` },
			props: {
				title: `전체 게시글 ${page}페이지`,
				description: 'Temple의 개발 관련 블로그 게시물 목록입니다.',
				type: 'list',
			} satisfies OgImageData,
		};
	});

	return [
		{
			params: { slug: 'home' },
			props: {
				title: "Temple's Hideout",
				description: 'Temple의 개발 관련 블로그입니다.',
				type: 'home',
			} satisfies OgImageData,
		},
		...listPaths,
		...postPaths,
	];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const image = await createOgImage(props as OgImageData);
	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
