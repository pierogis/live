<script lang="ts">
	let numberOfWashes = $state(100);

	type Sock = 'left' | 'right';

	function simulateSockSelection(socks: Sock[], k: number) {
		// Randomly select 6 socks
		const pairs: [Sock, Sock][] = [];
		for (let i = 0; i < k; i++) {
			const firstDrawIndex = Math.floor(Math.random() * socks.length);
			const firstDraw = socks.splice(firstDrawIndex, 1)[0];
			const secondDrawIndex = Math.floor(Math.random() * socks.length);
			const secondDraw = socks.splice(secondDrawIndex, 1)[0];

			const pair: [Sock, Sock] = [firstDraw, secondDraw];

			pairs.push(pair);
		}

		return pairs;
	}

	const getNumberOfSameFootedPairs = (pairs: [Sock, Sock][]) => {
		let numberOfSameFootedPairs = 0;
		for (const pair of pairs) {
			if (pair[0] === pair[1]) {
				numberOfSameFootedPairs += 1;
			}
		}
		return numberOfSameFootedPairs;
	};

	let left = $state(3);
	let right = $state(3);

	let pairsPerWash = $derived(Math.floor((left + right) / 2));

	// Run the simulation
	const washes = $derived(
		[...Array(numberOfWashes)].map(() =>
			simulateSockSelection(
				[
					...[...Array(left)].map(() => 'left' as const),
					...[...Array(right)].map(() => 'right' as const)
				],
				pairsPerWash
			)
		)
	);

	const xBars = 75;

	const runningFrequency = $derived(
		[...Array(xBars)].map((_, i) => {
			return (
				getNumberOfSameFootedPairs(
					washes.slice(0, (i + 1) * (numberOfWashes / xBars)).flatMap((w) => w)
				) /
				((i + 1) * (numberOfWashes / xBars) * pairsPerWash)
			);
		})
	);
	const sameFootedPairFrequency = $derived(
		getNumberOfSameFootedPairs(washes.flatMap((w) => w)) / (numberOfWashes * pairsPerWash)
	);
</script>

<div class="sock-simulation">
	<div class="parameters">
		<div>
			Washes:
			<input type="number" bind:value={numberOfWashes} min="100" max="1500" step={100} />
		</div>

		<div>
			Left:
			<input type="number" bind:value={left} min="1" max="20" step={1} />
		</div>

		<div>
			Right:
			<input type="number" bind:value={right} min="1" max="20" step={1} />
		</div>

		<div>Pairs per Wash: {pairsPerWash}</div>

		<div>
			Same-footed pair frequency (y–axis): {sameFootedPairFrequency.toFixed(2)}
		</div>
	</div>

	{#snippet yAxisLabels()}
		<span>1</span>
		<span>0.9</span>
		<span>0.8</span>
		<span>0.7</span>
		<span>0.6</span>
		<span>0.5</span>
		<span>0.4</span>
		<span>0.3</span>
		<span>0.2</span>
		<span>0.1</span>
		<span>0</span>
	{/snippet}
	{#snippet yAxisMarkers()}
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
		<div class="axis-marker y"></div>
	{/snippet}

	<div class="wrapper">
		<div class="chart" style:--chart-height="200px">
			<div class="axis y left">
				<div class="axis-labels y left">
					{@render yAxisLabels()}
				</div>
			</div>

			<div>
				<div class="bars">
					<div class="axis-markers y left">
						{@render yAxisMarkers()}
					</div>
					{#each runningFrequency as frequency}
						<div class="bar" style:--frequency={frequency}></div>
					{/each}
					<div class="axis-markers y right">
						{@render yAxisMarkers()}
					</div>

					<div class="axis-markers x">
						<div class="axis-marker x"></div>
						<div class="axis-marker x"></div>
						<div class="axis-marker x"></div>
						<div class="axis-marker x"></div>
					</div>
				</div>
			</div>

			<div class="axis y right">
				<div class="axis-labels y right">
					{@render yAxisLabels()}
				</div>
			</div>
		</div>

		<span>Cumulative Washes</span>
	</div>
</div>

<style>
	.sock-simulation {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 16px;
	}
	.parameters {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.wrapper {
		overflow-x: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.chart {
		height: calc(var(--chart-height) + 1em);
		position: relative;
		display: flex;
		align-items: center;
	}

	.axis-labels {
		height: calc(var(--chart-height) + 1em);
		display: flex;
		&.y {
			flex-direction: column;
			justify-content: space-between;
			&.left {
				padding-right: 4px;
				align-items: end;
			}
			&.right {
				padding-left: 4px;
				align-items: start;
			}
		}
	}
	.axis-markers {
		position: absolute;
		display: flex;

		&.x {
			width: 100%;
			flex-direction: row;
			justify-content: space-evenly;
			bottom: 0;
		}
		&.y {
			height: 100%;
			flex-direction: column;
			justify-content: space-between;
			&.left {
				left: 0;
			}
			&.right {
				right: 0;
			}
		}
	}
	.axis-marker {
		background-color: var(--accent-color);
		&.x {
			min-height: 3px;
			height: 3px;
			width: 2px;
		}
		&.y {
			min-width: 3px;
			width: 3px;
			height: 2px;
		}
	}
	.axis-labels.y > span {
		display: flex;
		align-items: end;
		line-height: 1rem;
	}

	.bars {
		position: relative;
		height: calc(var(--chart-height));
		display: flex;
		align-items: end;
		gap: 1px;
		padding: 0 3px;
		background-color: var(--text-color);
		outline: 2px solid var(--secondary-color);
	}
	.bar {
		height: calc(var(--frequency) * (var(--chart-height)));
		border-top: 2px solid var(--primary-color);
		min-width: 2px;
		width: 2px;
	}
</style>
