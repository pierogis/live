<script lang="ts">
	import { Card, Section } from '$lib';

	let sectionTitle = 'section title';
	let columnGap = 2;
	let columnGapUnit = 'rem';
	let rowGap = 1;
	let rowGapUnit = 'rem';
	let sectionColumn = true;
</script>

<Card>
	<span>a <code>Section</code></span>
	<Section
		title={sectionTitle}
		columnGap={columnGap + columnGapUnit}
		rowGap={rowGap + rowGapUnit}
		column={sectionColumn}
	>
		<span class="padded inset">doesn't really do much</span>

		<div class="inputs padded inset">
			<div>
				<label>
					title
					<br />
					<input class="inset" type="text" bind:value={sectionTitle} />
				</label>
			</div>

			<div class="size-group">
				<label>
					columnGap
					<input class="inset" type="number" bind:value={columnGap} />
				</label>

				<div class="radio-group">
					<label>
						<input type="radio" bind:group={columnGapUnit} name="columnGapUnit" value="rem" />
						rem
					</label>

					<label>
						<input type="radio" bind:group={columnGapUnit} name="columnGapUnit" value="px" />
						px
					</label>
				</div>
			</div>

			<div class="size-group">
				<label>
					rowGap
					<input class="inset" type="number" bind:value={rowGap} />
				</label>

				<div class="radio-group">
					<label>
						<input type="radio" bind:group={rowGapUnit} name="rowGapUnit" value="rem" />
						rem
					</label>

					<label>
						<input type="radio" bind:group={rowGapUnit} name="rowGapUnit" value="px" />
						px
					</label>
				</div>
			</div>

			<div class="radio-group">
				<label>
					<input type="radio" bind:group={sectionColumn} name="column" value={true} />
					column
				</label>

				<label>
					<input type="radio" bind:group={sectionColumn} name="column" value={false} />
					row
				</label>
			</div>
		</div>
	</Section>
</Card>

<style>
	.inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.padded {
		padding: 0.4rem;
	}
	input[type='text'] {
		width: 10rem;
	}

	input[type='number'] {
		width: 4rem;
	}
	label:has(input[type='number']) {
		display: flex;
		justify-content: right;
		align-items: center;
		gap: 10px;
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
		justify-content: center;
		gap: 10px;
	}
</style>
