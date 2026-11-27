import decks from "./data/decks.json";

export const SITE = "https://slides.amatatu.com";

export type Deck = {
	slug: string;
	title: string;
	event: string;
	date: string | null;
	pages: number;
	aspect: number;
};

export const allDecks = decks as Deck[];

export const formatDate = (d: string | null) => (d ? d.replaceAll("-", ".") : "");
