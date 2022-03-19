<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	import type { Score } from '@prisma/client';

	export let scoreChangeUrl: string;
	export let editorialScore: Pick<Score, 'value' | 'explanation'>;
	export let userScore: Pick<Score, 'value' | 'explanation'>;
	let placeholderScore = { value: 0, description: '' };

	$: user = userScore.value != null;
	$: placeholder = !user && editorialScore == null;
	$: displayScore = user ? userScore : editorialScore ? editorialScore : placeholderScore;

	$: halfScores = displayScore.value % 2;
	$: fullScores = (displayScore.value - halfScores) / 2;
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

	function changeScoreAction(
		element: HTMLElement,
		params: { pointStatus: PointStatus; i: number }
	) {
		async function handlePointerDown(event) {
			if (!$session.user) {
				goto('/login');
			} else {
				if (userScore.value == 2 * params.i + 2) {
					userScore.value = 2 * params.i + 1;
				} else if (userScore.value == 2 * params.i + 1) {
					userScore.value = 2 * params.i;
				} else {
					userScore.value = 2 * params.i + 2;
				}

				let formData = new FormData();
				formData.append('value', userScore.value.toString());
				const res = fetch(scoreChangeUrl, {
					method: 'PUT',
					body: formData
				});
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
		<span class="score" class:user class:placeholder use:changeScoreAction={{ pointStatus, i }}>
			{pointStatus}
		</span>
	{/each}
</div>

<style>
	.score {
		font-size: 1.2rem;

		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
	}

	.user {
		color: var(--accent-color);
	}

	.placeholder {
		color: var(--text-color-st);
	}

	.scores-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 2;
		gap: 0.6rem;
	}
</style>
