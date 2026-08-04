import type { CollectionEntry } from 'astro:content';

export declare function getVisiblePosts(
	posts: CollectionEntry<'post'>[],
	includeBlind?: boolean,
): CollectionEntry<'post'>[];

export declare function getFirstMarkdownImage(
	body?: string,
): { src: string; alt: string } | null;
