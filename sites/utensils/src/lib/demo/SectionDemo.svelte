<script lang="ts">
	import { Card, Section } from '@pierogis/utensils';

	let columnGap = $state(2);
	let columnGapUnit = $state('rem');
	let rowGap = $state(1);
	let rowGapUnit = $state('rem');
	let sectionColumn = $state(true);
</script>

<Card>
	<span>a <code>Section</code></span>
	<Section
		columnGap={columnGap + columnGapUnit}
		rowGap={rowGap + rowGapUnit}
		column={sectionColumn}
	>
		{#snippet title()}
			<h3>section title</h3>
		{/snippet}
		<span class="padded inset">doesn't really do much</span>

		<div class="inputs padded inset">
			<div class="size-group">
				<label>
					<span>columnGap</span>
					<input class="inset" type="number" bind:value={columnGap} />
				</label>

				<div class="radio-group">
					<label>
						<input type="radio" bind:group={columnGapUnit} name="columnGapUnit" value="rem" />
						<span>rem</span>
					</label>

					<label>
						<input type="radio" bind:group={columnGapUnit} name="columnGapUnit" value="px" />
						<span>px</span>
					</label>
				</div>
			</div>

			<div class="size-group">
				<label>
					<span>rowGap</span>
					<input class="inset" type="number" bind:value={rowGap} />
				</label>

				<div class="radio-group">
					<label>
						<input type="radio" bind:group={rowGapUnit} name="rowGapUnit" value="rem" />
						<span>rem</span>
					</label>

					<label>
						<input type="radio" bind:group={rowGapUnit} name="rowGapUnit" value="px" />
						<span>px</span>
					</label>
				</div>
			</div>

			<div class="radio-group">
				<label>
					<input type="radio" bind:group={sectionColumn} name="column" value={true} />
					<span>column</span>
				</label>

				<label>
					<input type="radio" bind:group={sectionColumn} name="column" value={false} />
					<span>row</span>
				</label>
			</div>
		</div>
	</Section>
</Card>

<style>
	h3 {
		margin: 0;
	}
	.inputs {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 90%;
	}
	.padded {
		padding: 0.4rem;
	}

	input[type='number'] {
		width: 3em;
	}
	label:has(:global(input)) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.size-group {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
	}
	.radio-group {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
</style>
