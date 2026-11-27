<script setup lang="ts">
import { formatDate, type Deck } from "../src/decks";

defineProps<{ decks: Deck[] }>();
</script>

<template>
	<main class="container">
		<ul class="grid">
			<li v-for="d in decks" :key="d.slug">
				<a :href="`/${d.slug}/`" class="card">
					<img :src="`/thumbs/${d.slug}.png`" alt="" loading="lazy" :style="{ aspectRatio: d.aspect }" />
					<h2>{{ d.title }}</h2>
					<p class="meta">
						<time v-if="d.date" :datetime="d.date">{{ formatDate(d.date) }}</time>
						<span v-if="d.event">{{ d.event }}</span>
					</p>
				</a>
			</li>
		</ul>
	</main>
</template>
