<script lang="ts">
	export let editorialScore: number;
	export let userScore: number = null;
	let placeholderScore = 0;

	export let handleChangeScore: (value: number) => void = null;

	$: interactive = handleChangeScore != null;
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

	async function handlePointerDown(event: PointerEvent, i: number) {
		if (event.button == 0) {
			if (userScore == 2 * i + 2) {
				userScore = 2 * i + 1;
			} else if (userScore == 2 * i + 1) {
				userScore = 2 * i;
			} else {
				userScore = 2 * i + 2;
			}

			handleChangeScore(userScore);
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
