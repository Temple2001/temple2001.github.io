export function getVisiblePosts(posts, includeBlind = false) {
	return posts
		.filter((post) => includeBlind || post.data.blind !== true)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getFirstMarkdownImage(body = '') {
	let inCodeFence = false;

	for (const line of body.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) {
			inCodeFence = !inCodeFence;
			continue;
		}
		if (inCodeFence) {
			continue;
		}

		const match = line.match(
			/!\[([^\]]*)\]\(\s*(?:<([^>]+)>|([^\s)]+))/,
		);
		if (match) {
			return {
				src: match[2] ?? match[3],
				alt: match[1],
			};
		}
	}

	return null;
}
