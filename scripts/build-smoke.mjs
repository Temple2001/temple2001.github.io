import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const dist = resolve('dist');

assert.ok(existsSync(dist), 'dist 디렉터리가 없습니다. 먼저 npm run build를 실행하세요.');

function getFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const file = join(directory, entry.name);
		return entry.isDirectory() ? getFiles(file) : [file];
	});
}

const files = getFiles(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const sourceFiles = files.filter((file) => /\.(md|mdx)$/i.test(file));

assert.ok(htmlFiles.length > 0, '생성된 HTML 페이지가 없습니다.');
assert.deepEqual(sourceFiles, [], 'Markdown 원본이 배포 산출물에 포함되면 안 됩니다.');
assert.ok(existsSync(join(dist, 'og/home.png')), '홈 OG 이미지가 없습니다.');
assert.ok(existsSync(join(dist, 'rss.xml')), 'RSS 피드가 없습니다.');

for (const file of htmlFiles) {
	const html = readFileSync(file, 'utf8');
	const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1];
	const requiredMeta = [
		'property="og:site_name"',
		'property="og:image:type"',
		'property="og:image:secure_url"',
	];

	assert.ok(ogImage, `${relative(dist, file)}에 og:image가 없습니다.`);
	for (const meta of requiredMeta) {
		assert.ok(html.includes(meta), `${relative(dist, file)}에 ${meta} 메타데이터가 없습니다.`);
	}

	const imageUrl = new URL(ogImage, 'https://temple.example/');
	assert.ok(imageUrl.pathname.startsWith('/og/'), `${relative(dist, file)}의 OG 이미지 경로가 올바르지 않습니다.`);
	assert.ok(
		existsSync(join(dist, imageUrl.pathname.slice(1))),
		`${relative(dist, file)}가 참조하는 OG 이미지가 없습니다: ${imageUrl.pathname}`,
	);
}

const rss = readFileSync(join(dist, 'rss.xml'), 'utf8');
assert.ok(!rss.includes('/post/first-post'), 'blind 게시물이 RSS에 포함되면 안 됩니다.');

console.log(`Build smoke test passed: ${htmlFiles.length} HTML pages, ${files.length} files.`);
