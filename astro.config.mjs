import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://slides.amatatu.com",
	trailingSlash: "ignore",
	build: { format: "directory" },
});
