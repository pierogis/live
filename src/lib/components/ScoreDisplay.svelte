<script lang="ts">
	import type { Score } from '$lib/database/models';

	export let editorialScore: Score;
	export let userScore: Pick<Score, 'value' | 'description'>;
	let placeholderScore = { value: 0, description: '' };

	$: user = userScore.value != null;

	$: placeholder = !user && editorialScore == null;

	$: displayScore = user ? userScore : editorialScore ? editorialScore : placeholderScore;

	enum PointStatus {
		full = '●',
		half = '◐',
		empty = '○'
	}

	$: fullScores = Math.floor(displayScore.value);
	$: halfScores = Math.round((displayScore.value - fullScores) / 0.5) % 2;
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
			if (Math.ceil(userScore.value) == params.i + 1) {
				if (userScore.value == params.i + 1) {
					userScore.value = params.i + 0.5;
				} else if (userScore.value == params.i + 0.5) {
					userScore.value = params.i;
				} else {
					userScore.value = params.i + 1;
				}
			} else {
				userScore.value = params.i + 1;
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
		<span class="score" class:user class:placeholder use:changeScoreAction={{ pointStatus, i }}
			>{pointStatus}
		</span>
	{/each}
</div>

<style>
	.score {
		padding-bottom: 2px;

		font-size: 1.2rem;

		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
	}

	.user {
		color: var(--accent-color);
	}

	.placeholder {
		color: grey;
	}

	.scores-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 2;
		gap: 0.5rem;
	}
</style>
