<script lang="ts">
	import type { Score } from '$lib/models';

	// export let fullScoreSymbol = '★';
	// export let halfScoreSymbol = '½';
	// export let emptyScoreSymbol = '☆';

	export let score: Score;

	enum ScoreStatus {
		full = '★',
		half = '½',
		empty = '☆'
	}

	let fullScores = Math.floor(score.value);
	let halfScores = Math.round((score.value - fullScores) / 0.5) % 2;
	let emptyScores = 5 - (fullScores + halfScores);

	let scoreStatuses: ScoreStatus[] = Array(fullScores)
		.fill(ScoreStatus.full)
		.concat(Array(halfScores).fill(ScoreStatus.half))
		.concat(Array(emptyScores).fill(ScoreStatus.empty));

	function changeScoreAction(
		element: HTMLElement,
		params: { scoreStatus: ScoreStatus; i: number }
	) {
		function handleClick(event) {
			event.stopPropagation();
			console.log(event);
			if (Math.ceil(score.value) == params.i + 1) {
				if (score.value == params.i) {
					score.value = params.i + 1.5;
				} else if (score.value == params.i + 0.5) {
					score.value = params.i;
				} else {
					score.value = params.i + 1;
				}
			} else {
				score.value = params.i + 1;
			}
		}

		element.addEventListener('pointerdown', handleClick);

		return {
			update(newParams: { scoreStatus: ScoreStatus; i: number }) {
				params = newParams;
			},
			destroy() {
				element.removeEventListener('click', handleClick);
			}
		};
	}
</script>

{#each scoreStatuses as scoreStatus, i (i)}
	<span class="score" use:changeScoreAction={{ scoreStatus, i }}>{scoreStatus}</span>
{/each}

<style>
	.score {
		cursor: pointer;
	}
</style>
