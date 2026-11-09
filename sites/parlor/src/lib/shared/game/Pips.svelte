<!--
	A level's difficulty from 1 to 5 as filled and empty dots. With `label`, the
	difficulty's name follows them (the game bar); without, the name is a tooltip.
	The dots are drawn, not ● and ○ characters, which fonts give different sizes.
-->
<script lang="ts">
	import { LABELS } from '../difficulty';

	interface Props {
		/** 1 (easy) to 5 (very hard). */
		difficulty: number;
		label?: boolean;
	}

	let { difficulty, label = false }: Props = $props();
</script>

{#snippet dots()}
	{#each { length: 5 }, i (i)}<span class="pip" class:on={i < difficulty}></span>{/each}
{/snippet}

{#if label}
	<span title="Difficulty {difficulty} of 5">
		<span class="pips" aria-hidden="true">{@render dots()}</span>
		{LABELS[difficulty - 1].toLowerCase()}
	</span>
{:else}
	<span class="pips" title="{LABELS[difficulty - 1]}: difficulty {difficulty} of 5"
		>{@render dots()}</span
	>
{/if}

<style>
	.pips {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: var(--accent-color);
	}
	/* Whole pixels, so every dot is the same round shape. */
	.pip {
		box-sizing: border-box;
		width: 8px;
		height: 8px;
		border: 1px solid currentColor;
		border-radius: 50%;
	}
	.pip.on {
		background: currentColor;
	}
</style>
