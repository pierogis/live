<script lang="ts">
	import type { Readable, Writable } from 'svelte/store';

	import type { Score } from '$db/schema';
	import { goto } from '$app/navigation';
	import { PointStatus } from './model';

	interface Props {
		interactive?: boolean;
		editorialScore: Readable<Score> | null;
		userScore: Writable<Score> | null;
	}
	let { interactive = true, editorialScore = null, userScore = null }: Props = $props();

	let displayScore = $derived(userScore || editorialScore);

	let placeholder = $derived($displayScore == null || $displayScore.value < 0);

	let displayValue = $derived(
		$displayScore == null || $displayScore?.value < 0 ? 0 : $displayScore?.value
	);

	let halfScores = $derived(displayValue % 2);
	let fullScores = $derived((displayValue - halfScores) / 2);
	let emptyScores = $derived(5 - (fullScores + halfScores));

	let pointStatuses: PointStatus[] = $derived(
		Array(fullScores)
			.fill(PointStatus.full)
			.concat(Array(halfScores).fill(PointStatus.half))
			.concat(Array(emptyScores).fill(PointStatus.empty))
	);

	function handlePointerDown(event: PointerEvent, i: number) {
		if (event.button == 0) {
			if (userScore !== null) {
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
			} else if (interactive) {
				goto(`/login`);
			}
		}
	}
</script>

<div class="scores-container">
	{#each pointStatuses as pointStatus, i (i)}
		<span
			class="score"
			class:user={userScore !== null}
			class:placeholder
			class:interactive
			onpointerdown={(e) => {
				e.preventDefault();
				handlePointerDown(e, i);
			}}
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
