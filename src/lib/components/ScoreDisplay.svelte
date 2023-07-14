<script lang="ts">
	import type { Readable, Writable } from 'svelte/store';
	import type { Score } from '$db/schema';

	export let editorialScore: Readable<Score> = null;
	export let userScore: Writable<Score> = null;
	$: displayScore = userScore || editorialScore;

	$: interactive = userScore != null;
	$: user = userScore != null;
	$: placeholder = $displayScore?.value == null;

	$: displayValue = $displayScore?.value || 0;

	$: halfScores = displayValue % 2;
	$: fullScores = (displayValue - halfScores) / 2;
	$: emptyScores = 5 - (fullScores + halfScores);

	enum PointStatus {
		full = '●',
		half = '◐',
		empty = '○'
	}
	let pointStatuses: PointStatus[];
	$: pointStatuses = Array(fullScores)
		.fill(PointStatus.full)
		.concat(Array(halfScores).fill(PointStatus.half))
		.concat(Array(emptyScores).fill(PointStatus.empty));

	function handlePointerDown(event: PointerEvent, i: number) {
		if (event.button == 0) {
			if (interactive) {
				userScore.update((score) => {
					if (score.value == 2 * i + 2) {
						score.value = 2 * i + 1;
					} else if (score.value == 2 * i + 1) {
						score.value = 2 * i;
					} else {
						score.value = 2 * i + 2;
					}
					return score;
				});
			}
		}
	}
</script>

<div class="scores-container">
	{#each pointStatuses as pointStatus, i (i)}
		<span
			class="score"
			class:user
			class:placeholder
			class:interactive
			on:pointerdown|preventDefault={(e) => handlePointerDown(e, i)}
		>
			{pointStatus}
		</span>
	{/each}
</div>

<style>
	.score {
		font-family: Courier, monospace;
		font-size: 1.4rem;

		cursor: default;
	}

	.user {
		color: var(--accent-color);
	}

	.interactive {
		cursor: pointer;
	}

	.placeholder {
		color: var(--text-color-st);
	}

	.scores-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 2;
		gap: 0.7rem;
	}
</style>
