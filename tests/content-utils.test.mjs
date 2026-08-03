import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisiblePosts } from '../src/lib/post-utils.mjs';

function post(title, pubDate, blind = false) {
	return {
		data: {
			title,
			pubDate: new Date(pubDate),
			blind,
		},
	};
}

test('getVisiblePosts hides blind posts and sorts by publication date', () => {
	const posts = [
		post('Older post', '2024-01-01'),
		post('Hidden post', '2025-02-01', true),
		post('Newest post', '2025-03-01'),
	];

	assert.deepEqual(
		getVisiblePosts(posts).map(({ data }) => data.title),
		['Newest post', 'Older post'],
	);
	assert.equal(getVisiblePosts(posts, true).length, 3);
});
