const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
	reactStrictMode: true,
	swcMinify: false,
	trailingSlash: true,
};

module.exports = withContentlayer(nextConfig);
