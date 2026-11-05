<script lang="ts">
	import { untrack } from 'svelte';

	import Pictures from '#lib/shared/Pictures.svelte';
	import { PACKS } from '#lib/mosaic/levels/index.js';
	import { persist } from '#lib/mosaic/save.js';

	let { data } = $props();
	// The toggle starts from your saved setting and saves straight to your cookie.
	let relaxed = $state(untrack(() => data.save.relaxed));
</script>

<Pictures game="mosaic" packs={PACKS} gameHref="/mosaic" save={data.save}>
	{#snippet extra()}
		<label class="relaxed inset">
			<input
				type="checkbox"
				checked={relaxed}
				onchange={(e) => {
					relaxed = e.currentTarget.checked;
					persist({ ...data.save, relaxed });
				}}
			/>
			<span
				><b>relaxed mode</b><br /><small>a much bigger tray, so you can lift dots freely</small
				></span
			>
		</label>
	{/snippet}
</Pictures>

<style>
	.relaxed {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 12px;
		border-radius: 10px;
		cursor: pointer;
	}
	.relaxed input {
		margin-top: 3px;
		width: 18px;
		height: 18px;
		accent-color: var(--accent-color);
	}
	.relaxed small {
		color: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
	}
</style>
