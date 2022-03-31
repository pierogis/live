<script lang="ts">
	import type { Review, Score, User } from '@prisma/client';
	import ScoreSheet from './ScoreSheet.svelte';

	export let review: Review & { user: User };
	export let scores: Score[];
</script>

<div>
	<span class="serial border inset shadow">{review.user.serial}</span>
	<span class="review">{review.description}</span>
	<ScoreSheet {scores} />
</div>

<style>
	.review {
		font-family: 'Lora';
		font-weight: normal;
	}

	.serial {
		padding: 0.2rem;
	}
</style>
