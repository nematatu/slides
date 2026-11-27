import { defineHandler, defineHead } from "void";
import type { PageParams } from "void/routes";
import { allDecks, SITE, type Deck } from "../src/decks";

export interface Props {
	deck: Deck;
}

export async function getPrerenderPaths(): Promise<PageParams<"/[slug]/">[]> {
	return allDecks.map((d) => ({ slug: d.slug }));
}

export const loader = defineHandler<Props>((c) => {
	const { slug } = c.req.param() as PageParams<"/[slug]/">;
	const deck = allDecks.find((d) => d.slug === slug);
	if (!deck) return c.notFound();
	return { deck };
});

export const head = defineHead<Props>((_c, { deck }) => ({
	title: deck.title,
	meta: [
		{ property: "og:title", content: deck.title },
		{ property: "og:image", content: `${SITE}/thumbs/${deck.slug}.png` },
		{ name: "twitter:card", content: "summary_large_image" },
	],
}));
