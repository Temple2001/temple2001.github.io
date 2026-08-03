import type { CollectionEntry } from 'astro:content';

export declare function getVisiblePosts(
	posts: CollectionEntry<'post'>[],
	includeBlind?: boolean,
): CollectionEntry<'post'>[];
