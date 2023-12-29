<script lang="ts">
	export let columnGap = '2rem';
	export let rowGap = '1rem';
	export let column = false;
</script>

<section class:column style:--row-gap={rowGap} style:--column-gap={columnGap}>
	<slot name="title" />
	<slot />
</section>

<style>
	section {
		display: flex;
		flex-flow: wrap;

		justify-content: center;
		align-items: center;
		column-gap: var(--column-gap);
		row-gap: var(--row-gap);
	}

	section.column {
		flex-direction: column;
	}

	@media only screen and (min-width: 70rem) {
		section {
			flex-direction: row;
		}
	}
</style>
