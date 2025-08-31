import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	poweredByHeader: false,
	images: {
		formats: ["image/avif", "image/webp"],
		minimumCacheTTL: 60,
	},
	// Ignore TypeScript and ESLint errors during build
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(nextConfig);
