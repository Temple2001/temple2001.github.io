import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const pretendardRegularFont = readFileSync(
	require.resolve('pretendard/dist/public/static/Pretendard-Regular.otf'),
);
const pretendardBoldFont = readFileSync(
	require.resolve('pretendard/dist/public/static/Pretendard-Bold.otf'),
);
const orbitronFont = readFileSync(
	require.resolve('@fontsource/orbitron/files/orbitron-latin-600-normal.woff'),
);

const WIDTH = 1200;
const HEIGHT = 630;
const DIAGONAL_TOP = 500;
const DIAGONAL_BOTTOM = 300;

export type OgImageType = 'home' | 'list' | 'post';

export interface OgImageData {
	title: string;
	description: string;
	type?: OgImageType;
	date?: Date;
	tags?: string[];
}

type SatoriNode = {
	type: string;
	props: Record<string, unknown>;
};

function node(type: string, props: Record<string, unknown>): SatoriNode {
	return { type, props };
}

export function getOgImagePath(type: OgImageType, id?: string): string {
	if (type === 'home') return '/og/home.png';
	return `/og/${type}/${id}.png`;
}

function shorten(value: string, maxLength: number): string {
	return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function text(type: string, style: Record<string, string | number>, content: string) {
	return node(type, { style, children: content });
}

export async function createOgImage({
	title,
	description,
	type = 'post',
	date,
	tags = [],
}: OgImageData): Promise<Uint8Array> {
	const metadata = [
		type === 'post' && date ? `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}` : '',
		tags.slice(0, 3).join(' · '),
	].filter(Boolean).join('  /  ');

	const element = node(
		'div',
		{
			style: {
				position: 'relative',
				display: 'flex',
				width: WIDTH,
				height: HEIGHT,
				backgroundColor: '#ffffff',
				color: '#111111',
				fontFamily: 'Pretendard',
			},
			children: [
				node('svg', {
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						width: DIAGONAL_TOP,
						height: HEIGHT,
					},
					viewBox: `0 0 ${DIAGONAL_TOP} ${HEIGHT}`,
					children: [
						node('polygon', {
							points: `0,0 ${DIAGONAL_TOP},0 ${DIAGONAL_BOTTOM},${HEIGHT} 0,${HEIGHT}`,
							fill: '#000000',
						}),
					],
				}),
				text('div', {
					position: 'absolute',
					left: 56,
					top: 48,
					color: '#ffffff',
					fontFamily: 'Orbitron',
					fontSize: 38,
					fontWeight: 600,
				}, "Temple's Hideout"),
				node('div', {
					style: {
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						marginLeft: 480,
						width: 680,
						height: HEIGHT,
						padding: '48px 32px 48px 0',
					},
					children: [
						text('div', {
							color: '#777777',
							fontSize: 24,
							fontWeight: 600,
							letterSpacing: 3,
							marginBottom: 24,
							textAlign: 'right',
						}, type === 'post' ? 'DEVELOPMENT NOTE' : 'TEMPLE\'S HIDEOUT'),
						text('div', {
							color: '#111111',
							fontSize: 60,
							fontWeight: 700,
							lineHeight: 1.12,
							marginBottom: 24,
							textAlign: 'right',
							wordBreak: 'keep-all',
						}, shorten(title, 72)),
						text('div', {
							color: '#555555',
							fontSize: 30,
							lineHeight: 1.3,
							marginBottom: 32,
							textAlign: 'right',
							wordBreak: 'keep-all',
						}, shorten(description, 130)),
						node('div', {
							style: {
								borderTop: '2px solid #dddddd',
								paddingTop: 16,
								color: '#888888',
								fontSize: 23,
								textAlign: 'right',
							},
							children: metadata || 'Temple\'s Hideout',
						}),
					],
				}),
			],
		},
	);

	const svg = await satori(element as Parameters<typeof satori>[0], {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Pretendard', data: pretendardRegularFont, weight: 400, style: 'normal' },
			{ name: 'Pretendard', data: pretendardBoldFont, weight: 600, style: 'normal' },
			{ name: 'Pretendard', data: pretendardBoldFont, weight: 700, style: 'normal' },
			{ name: 'Orbitron', data: orbitronFont, weight: 600, style: 'normal' },
		],
	});

	return new Resvg(svg).render().asPng();
}
