<script lang="ts">
	import type { Score } from '$lib/models';

	// export let fullScoreSymbol = '★';
	// export let halfScoreSymbol = '½';
	// export let emptyScoreSymbol = '☆';

	export let score: Score;

	enum PointStatus {
		full = '●',
		half = '◐',
		empty = '○'
	}

	$: fullScores = Math.floor(score.value);
	$: halfScores = Math.round((score.value - fullScores) / 0.5) % 2;
	$: emptyScores = 5 - (fullScores + halfScores);

	let pointStatuses: PointStatus[];
	$: pointStatuses = Array(fullScores)
		.fill(PointStatus.full)
		.concat(Array(halfScores).fill(PointStatus.half))
		.concat(Array(emptyScores).fill(PointStatus.empty));

	function changeScoreAction(
		element: HTMLElement,
		params: { pointStatus: PointStatus; i: number }
	) {
		function handlePointerDown(event) {
			if (Math.ceil(score.value) == params.i + 1) {
				if (score.value == params.i + 1) {
					score.value = params.i + 0.5;
				} else if (score.value == params.i + 0.5) {
					score.value = params.i;
				} else {
					score.value = params.i + 1;
				}
			} else {
				score.value = params.i + 1;
			}
		}

		element.addEventListener('pointerdown', handlePointerDown);

		return {
			update(newParams: { pointStatus: PointStatus; i: number }) {
				params = newParams;
			},
			destroy() {
				element.removeEventListener('click', handlePointerDown);
			}
		};
	}
</script>

<div class="scores-container">
	{#each pointStatuses as pointStatus, i (i)}
		<span class="score" use:changeScoreAction={{ pointStatus, i }}>{pointStatus} </span>
	{/each}
</div>

<style>
	.score {
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
	}

	.scores-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 2;
		gap: 12px;
	}
</style>
