<script lang="ts">
	import { derived, type Readable } from 'svelte/store';

	import type { Score } from '$db/schema';

	export let scoreStores: Readable<Score>[];

	// maximum is 10
	// minimum is 0

	// 0, 1, 2
	// 3, 4
	// 5, 6
	// 7, 8
	// 9, 10

	const quotients = derived(scoreStores, ($scores) => {
		return $scores.reduce(
			(prev, next) => {
				switch (next.value) {
					case 0:
					case 1:
					case 2:
						prev[0]++;
						break;
					case 3:
					case 4:
						prev[1]++;
						break;
					case 5:
					case 6:
						prev[2]++;
						break;
					case 7:
					case 8:
						prev[3]++;
						break;
					case 9:
					case 10:
						prev[4]++;
						break;
				}

				return prev;
			},
			{
				0: 0,
				1: 0,
				2: 0,
				3: 0,
				4: 0
			}
		);
	});

	const total = derived(quotients, ($quotients) => {
		return $quotients[0] + $quotients[1] + $quotients[2] + $quotients[3] + $quotients[4];
	});

	const barWidth = 3;
	const dividerWidth = 1;
</script>

<svg height="22px" width="20px">
	{#each Object.values($quotients) as count, i (count)}
		<g class="bar" transform={`translate(${i * (barWidth + dividerWidth)},0)`}>
			<rect
				height={1 + (count / $total || 0) * 12}
				y={19 - (count / $total || 0) * 12}
				width={barWidth}
			/>
		</g>
		{#if i < 4}
			<g class="divider" transform={`translate(${i * (barWidth + dividerWidth) + barWidth},0)`}>
				<rect height="10" y="10" width={dividerWidth} />
			</g>
		{/if}
	{/each}
</svg>

<style>
	.bar {
		fill: var(--text-color);
		transition: fill 200ms;
	}
	.divider {
		fill: transparent;
	}
	svg {
		padding-top: 2px;
	}
</style>
