import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getFirstMarkdownImage,
	getVisiblePosts,
} from '../src/lib/post-utils.mjs';

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

test('getFirstMarkdownImage returns the first image outside code fences', () => {
	assert.deepEqual(
		getFirstMarkdownImage(
			'```md\n![Example](ignored.png)\n```\n\n![첫 이미지](./first.png)\n![두 번째 이미지](second.png)',
		),
		{ src: './first.png', alt: '첫 이미지' },
	);
});

test('getFirstMarkdownImage returns null when the body has no image', () => {
	assert.equal(getFirstMarkdownImage('# 제목\n\n본문입니다.'), null);
});
