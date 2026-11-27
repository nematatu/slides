import { defineConfig } from "void/config";

export default defineConfig({
	output: "static",
	inference: {
		appType: "void",
		// decks/ の PDF からサムネイル等を作ってからビルドする
		build: "npm run build",
	},
	routing: {
		typedRoutes: true,
		trailingSlash: true,
		isr: false,
	},
	head: {
		titleTemplate: "%s | amatatu slides",
		htmlAttrs: { lang: "ja" },
		meta: [
			{ charset: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
		],
		link: [{ rel: "icon", href: "/favicon.ico" }],
	},
	worker: {
		compatibility_date: "2026-11-01",
	},
	cloudflare: {
		name: "amatatu-slides",
		account_id: "b55858b0d5c41b055859b1e758ddf3a2",
		workers_dev: false,
		routes: [{ pattern: "slides.amatatu.com", custom_domain: true }],
	},
});
