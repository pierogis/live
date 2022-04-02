<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	export let categoryScoreUrl: string = null;
	export let editorialScore: number;
	export let userScore: number = null;
	let placeholderScore = 0;

	$: interactive = categoryScoreUrl != null;
	$: user = userScore != null;
	$: placeholder = !user && editorialScore == null;
	$: displayScore = user ? userScore : editorialScore ? editorialScore : placeholderScore;

	$: halfScores = displayScore % 2;
	$: fullScores = (displayScore - halfScores) / 2;
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
		async function handlePointerDown(event: PointerEvent) {
			if (event.button == 0) {
				if (!$session.user) {
					goto('/login');
				} else {
					if (userScore == 2 * params.i + 2) {
						userScore = 2 * params.i + 1;
					} else if (userScore == 2 * params.i + 1) {
						userScore = 2 * params.i;
					} else {
						userScore = 2 * params.i + 2;
					}

					let formData = new FormData();
					formData.append('value', userScore.toString());
					const res = fetch(categoryScoreUrl, {
						method: 'PUT',
						body: formData
					});
				}
			}
		}

		if (categoryScoreUrl) {
			element.addEventListener('pointerdown', handlePointerDown);
		}

		return {
			update(newParams: { pointStatus: PointStatus; i: number }) {
				params = newParams;
			},
			destroy() {
				if (categoryScoreUrl) {
					element.removeEventListener('pointerdown', handlePointerDown);
				}
			}
		};
	}
</script>

<div class="scores-container">
	{#each pointStatuses as pointStatus, i (i)}
		<span
			class="score"
			class:user
			class:placeholder
			class:interactive
			use:changeScoreAction={{ pointStatus, i }}
		>
			{pointStatus}
		</span>
	{/each}
</div>

<style>
	.score {
		font-size: 1.2rem;

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
		gap: 0.6rem;
	}
</style>
