<script lang="ts">
	interface Props {
		index: number;
		count: number;
		href?: (index: number) => string;
		ongo: (index: number) => void;
	}

	let { index, count, href, ongo }: Props = $props();
</script>

{#snippet step(i: number, text: string, label: string)}
	{#if i < 0 || i >= count}
		<button class="step border inset link-box" aria-label={label} disabled>{text}</button>
	{:else if href}
		<a class="step border inset link-box" aria-label={label} href={href(i)}>{text}</a>
	{:else}
		<button class="step border inset link-box" aria-label={label} onclick={() => ongo(i)}
			>{text}</button
		>
	{/if}
{/snippet}

{#if count > 1}
	<nav class="level-nav" aria-label="Pictures">
		{@render step(index - 1, '← prev', 'Previous picture')}
		<span class="at">{index + 1} / {count}</span>
		{@render step(index + 1, 'next →', 'Next picture')}
	</nav>
{/if}

<style>
	.level-nav {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 8px;
		padding: 0;
	}
	.step {
		height: 34px;
		padding: 0 12px;
		display: grid;
		place-items: center;
		font-size: 13px;
	}
	.step:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.at {
		font-family: Courier, monospace;
		font-size: 12px;
		font-weight: 700;
		color: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
	}
</style>
