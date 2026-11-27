// decks/*.pdf を読み込み、
//   public/pdf/<slug>.pdf     … 配信用コピー
//   public/thumbs/<slug>.png  … 1ページ目のサムネイル (OGP にも使う)
//   src/data/decks.json       … ページ生成用メタデータ
// を生成する。`npm run build` / `npm run dev` の前に自動で走る。
import { copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decksDir = path.join(root, "decks");
const pdfOut = path.join(root, "public/pdf");
const thumbOut = path.join(root, "public/thumbs");
const dataOut = path.join(root, "src/data/decks.json");

const pdfjsDir = path.dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
const cMapUrl = `${path.join(pdfjsDir, "cmaps")}/`;
const standardFontDataUrl = `${path.join(pdfjsDir, "standard_fonts")}/`;

const THUMB_WIDTH = 1200;
// Cloudflare Workers の静的アセットは 1 ファイル 25 MiB まで
const MAX_BYTES = 25 * 1024 * 1024;
const SLUG_RE = /^[a-z0-9][a-z0-9-_]*$/;

const exists = (p) => stat(p).then(() => true, () => false);
const mtime = (p) => stat(p).then((s) => s.mtimeMs, () => 0);

async function renderThumb(doc, dest) {
	const page = await doc.getPage(1);
	const base = page.getViewport({ scale: 1 });
	const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
	const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	await page.render({ canvas: null, canvasContext: ctx, viewport }).promise;
	await writeFile(dest, canvas.toBuffer("image/png"));
}

function titleFromSlug(slug) {
	return slug.replace(/^\d{4}-\d{2}(-\d{2})?-/, "").replace(/[-_]+/g, " ");
}

function dateFromSlug(slug) {
	const m = slug.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
	return m ? `${m[1]}-${m[2]}-${m[3] ?? "01"}` : null;
}

async function main() {
	await mkdir(decksDir, { recursive: true });
	await mkdir(pdfOut, { recursive: true });
	await mkdir(thumbOut, { recursive: true });
	await mkdir(path.dirname(dataOut), { recursive: true });

	// ブラウザ側 pdf.js 用の CMap (日本語フォント等) と標準フォント
	const pdfjsPublic = path.join(root, "public/pdfjs");
	if (!(await exists(path.join(pdfjsPublic, "cmaps")))) {
		await cp(cMapUrl, path.join(pdfjsPublic, "cmaps"), { recursive: true });
		await cp(standardFontDataUrl, path.join(pdfjsPublic, "standard_fonts"), { recursive: true });
	}

	const files = (await readdir(decksDir)).filter((f) => f.toLowerCase().endsWith(".pdf"));
	const decks = [];
	let failed = false;

	for (const file of files) {
		const slug = file.slice(0, -4);
		if (!SLUG_RE.test(slug)) {
			console.error(`✗ ${file}: ファイル名は英小文字・数字・ハイフンのみ (例: 2026-11-my-talk.pdf)`);
			failed = true;
			continue;
		}
		const src = path.join(decksDir, file);
		const { size, mtimeMs } = await stat(src);
		if (size > MAX_BYTES) {
			console.error(`✗ ${file}: ${(size / 1024 / 1024).toFixed(1)} MiB は 25 MiB 制限を超えています。圧縮してください`);
			failed = true;
			continue;
		}

		let meta = {};
		for (const ext of [".yaml", ".yml"]) {
			const metaPath = path.join(decksDir, slug + ext);
			if (await exists(metaPath)) {
				meta = parseYaml(await readFile(metaPath, "utf8")) ?? {};
				break;
			}
		}
		const data = new Uint8Array(await readFile(src));
		const task = getDocument({ data, cMapUrl, cMapPacked: true, standardFontDataUrl, isEvalSupported: false, verbosity: 0 });
		const doc = await task.promise;
		const first = (await doc.getPage(1)).getViewport({ scale: 1 });

		const thumb = path.join(thumbOut, `${slug}.png`);
		if ((await mtime(thumb)) < mtimeMs) await renderThumb(doc, thumb);

		const out = path.join(pdfOut, file);
		if ((await mtime(out)) < mtimeMs) await copyFile(src, out);

		const date = meta.date ? String(meta.date instanceof Date ? meta.date.toISOString().slice(0, 10) : meta.date) : dateFromSlug(slug);
		decks.push({
			slug,
			title: meta.title ?? titleFromSlug(slug),
			event: meta.event ?? "",
			date,
			pages: doc.numPages,
			aspect: first.width / first.height,
		});
		await task.destroy();
		console.log(`✓ ${slug} (${decks.at(-1).pages}p)`);
	}

	// decks から消えたスライドの生成物を掃除
	const live = new Set(decks.map((d) => d.slug));
	for (const [dir, ext] of [[pdfOut, ".pdf"], [thumbOut, ".png"]]) {
		for (const f of await readdir(dir)) {
			if (f.endsWith(ext) && !live.has(f.slice(0, -ext.length))) await rm(path.join(dir, f));
		}
	}

	decks.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug));
	await writeFile(dataOut, `${JSON.stringify(decks, null, "\t")}\n`);
	if (failed) process.exit(1);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
