<script lang="ts">
	import { Section } from '$lib';

	let sectionTitle = 'sectionTitle';
	let columnGap = '2rem';
	let rowGap = '1rem';
	let sectionColumn = true;
</script>

<span>a <code>Section</code></span>
<Section title={sectionTitle} {columnGap} {rowGap} column={sectionColumn}>
	<span>doesn't really do much</span>
	<div>
		<label for="title">title</label>
		<br />
		<input class="inset" id="title" bind:value={sectionTitle} />
	</div>
	<div>
		<label for="columnGap">columnGap</label>
		<br />
		<input class="inset" id="columnGap" bind:value={columnGap} />
	</div>
	<div>
		<label for="rowGap">rowGap</label>
		<br />
		<input class="inset" id="rowGap" bind:value={rowGap} />
	</div>
	<div>
		<label for="sectionColumn">column</label>
		<br />
		<input class="inset" id="column" type="checkbox" bind:checked={sectionColumn} />
	</div>
</Section>
