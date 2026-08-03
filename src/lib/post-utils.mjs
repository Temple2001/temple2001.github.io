export function getVisiblePosts(posts, includeBlind = false) {
	return posts
		.filter((post) => includeBlind || post.data.blind !== true)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
