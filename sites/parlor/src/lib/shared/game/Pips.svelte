<!--
	A level's difficulty from 1 to 5 as filled and empty dots. With `label`, the
	difficulty's name follows them (the game bar); without, the name is a tooltip.
-->
<script lang="ts">
	import { LABELS } from '../difficulty';

	interface Props {
		/** 1 (easy) to 5 (very hard). */
		difficulty: number;
		label?: boolean;
	}

	let { difficulty, label = false }: Props = $props();

	const dots = $derived('●'.repeat(difficulty) + '○'.repeat(5 - difficulty));
</script>

{#if label}
	<span title="Difficulty {difficulty} of 5">
		<span class="pips" aria-hidden="true">{dots}</span>
		{LABELS[difficulty - 1].toLowerCase()}
	</span>
{:else}
	<span class="pips" title="{LABELS[difficulty - 1]}: difficulty {difficulty} of 5">{dots}</span>
{/if}

<style>
	.pips {
		letter-spacing: 1px;
		font-size: 11px;
		color: var(--accent-color);
	}
</style>
