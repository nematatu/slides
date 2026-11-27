import { defineHandler, defineHead } from "void";
import { allDecks, type Deck } from "../src/decks";

export interface Props {
	decks: Deck[];
}

export const loader = defineHandler<Props>(() => ({ decks: allDecks }));

export const head = defineHead<Props>(() => ({
	title: "amatatu slides",
	titleTemplate: "",
	meta: [{ property: "og:title", content: "amatatu slides" }],
}));
