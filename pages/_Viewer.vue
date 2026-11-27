<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const props = defineProps<{ slug: string; title: string; pages: number; aspect: number }>();

const root = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const current = ref(1);
const rendered = ref(false);

let ready: Promise<PDFDocumentProxy> | undefined;
let token = 0;
let shown: HTMLCanvasElement | null = null;

async function show(n: number) {
	current.value = Math.min(Math.max(n, 1), props.pages);
	if (!ready || !stage.value) return;
	const my = ++token;
	const el = stage.value;

	const page = await (await ready).getPage(current.value);
	const base = page.getViewport({ scale: 1 });
	const fitW = Math.min(el.clientWidth, el.clientHeight * (base.width / base.height));
	const viewport = page.getViewport({ scale: (fitW * devicePixelRatio) / base.width });
	const canvas = document.createElement("canvas");
	canvas.width = Math.floor(viewport.width);
	canvas.height = Math.floor(viewport.height);
	canvas.style.width = `${Math.floor(fitW)}px`;
	await page.render({ canvas, viewport }).promise;

	if (my !== token) return;
	shown?.remove();
	el.insertBefore(canvas, el.firstChild);
	shown = canvas;
	rendered.value = true;
}

function onStageClick(e: MouseEvent) {
	const rect = stage.value!.getBoundingClientRect();
	show(current.value + (e.clientX - rect.left < rect.width / 3 ? -1 : 1));
}

function onKey(e: KeyboardEvent) {
	if (e.key === "ArrowRight") show(current.value + 1);
	else if (e.key === "ArrowLeft") show(current.value - 1);
}

function toggleFullscreen() {
	if (document.fullscreenElement) document.exitFullscreen();
	else root.value?.requestFullscreen?.();
}

let observer: ResizeObserver | undefined;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
	document.addEventListener("keydown", onKey);
	const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
	GlobalWorkerOptions.workerSrc = workerSrc;
	ready = getDocument({
		url: `/pdf/${props.slug}.pdf`,
		cMapUrl: "/pdfjs/cmaps/",
		cMapPacked: true,
		standardFontDataUrl: "/pdfjs/standard_fonts/",
	}).promise;
	observer = new ResizeObserver(() => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => show(current.value), 120);
	});
	observer.observe(stage.value!);
});

onBeforeUnmount(() => {
	document.removeEventListener("keydown", onKey);
	observer?.disconnect();
	clearTimeout(resizeTimer);
});
</script>

<template>
	<div ref="root" class="viewer" :style="{ '--aspect': aspect }">
		<div ref="stage" class="stage" @click="onStageClick">
			<img class="placeholder" :src="`/thumbs/${slug}.png`" :alt="title" :hidden="rendered" />
		</div>
		<div class="controls">
			<button type="button" aria-label="前へ" @click="show(current - 1)">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
			</button>
			<span class="counter">{{ current }} / {{ pages }}</span>
			<button type="button" aria-label="次へ" @click="show(current + 1)">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
			</button>
			<button type="button" aria-label="全画面" class="fs" @click="toggleFullscreen">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
			</button>
		</div>
	</div>
</template>
