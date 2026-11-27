<script setup lang="ts">
import { formatDate, type Deck } from "../src/decks";
import Viewer from "./_Viewer.vue" with { island: "load" };

defineProps<{ deck: Deck }>();
</script>

<template>
	<main class="container narrow">
		<Viewer :slug="deck.slug" :title="deck.title" :pages="deck.pages" :aspect="deck.aspect" />
		<h1 class="deck-title">{{ deck.title }}</h1>
		<p class="meta">
			<time v-if="deck.date" :datetime="deck.date">{{ formatDate(deck.date) }}</time>
			<span v-if="deck.event">{{ deck.event }}</span>
			<a :href="`/pdf/${deck.slug}.pdf`" download>PDF</a>
		</p>
	</main>
</template>
