import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getVisiblePosts } from '../lib/post-utils.mjs';

export async function GET(context) {
	const posts = getVisiblePosts(await getCollection('post'), import.meta.env.DEV);
		
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/post/${post.id}/`,
		})),
	});
}
