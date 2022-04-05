<script lang="ts">
	import type { Review, Score, User } from '@prisma/client';
	import Card from './Card.svelte';
	import ScoreSheet from './ScoreSheet.svelte';

	export let review: Review & { user: User };
	export let scores: Score[];
</script>

<div class="review">
	<Card>
		<span class="serial border inset shadow">{review.user.serial}</span>
		<textarea readonly class="description border inset shadow" cols="40" rows="40"
			>{review.description}</textarea
		>
		<ScoreSheet {scores} />
	</Card>
</div>

<style>
	.description {
		font-family: 'Lora';
		font-weight: normal;

		text-align: left;

		resize: none;

		max-width: 80%;
		max-height: 10rem;
	}

	.serial {
		padding: 0.2rem;
	}
</style>
