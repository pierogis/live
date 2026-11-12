<script lang="ts">
	import { LABELS } from '../difficulty';

	interface Props {
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
