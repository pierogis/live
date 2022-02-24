<script lang="ts">
	import type { Score } from '$lib/models';

	// export let fullScoreSymbol = '★';
	// export let halfScoreSymbol = '½';
	// export let emptyScoreSymbol = '☆';

	export let score: Score;

	enum ScoreStatus {
		full = '●',
		half = '◐',
		empty = '○'
	}

	$: fullScores = Math.floor(score.value);
	$: halfScores = Math.round((score.value - fullScores) / 0.5) % 2;
	$: emptyScores = 5 - (fullScores + halfScores);

	let scoreStatuses: ScoreStatus[];
	$: scoreStatuses = Array(fullScores)
		.fill(ScoreStatus.full)
		.concat(Array(halfScores).fill(ScoreStatus.half))
		.concat(Array(emptyScores).fill(ScoreStatus.empty));

	function changeScoreAction(
		element: HTMLElement,
		params: { scoreStatus: ScoreStatus; i: number }
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
			update(newParams: { scoreStatus: ScoreStatus; i: number }) {
				params = newParams;
			},
			destroy() {
				element.removeEventListener('click', handlePointerDown);
			}
		};
	}
</script>

<div class="scores-container">
	{#each scoreStatuses as scoreStatus, i (i)}
		<span class="score" use:changeScoreAction={{ scoreStatus, i }}>{scoreStatus} </span>
	{/each}
</div>

<style>
	.score {
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;

		font-size: 1.1em;
		padding: 4px;
	}

	.scores-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 2;
	}
</style>
