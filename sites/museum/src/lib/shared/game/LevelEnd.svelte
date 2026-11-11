<!--
	How a level ended, shown in place, not as a pop-up: a cleared picture offers the
	next one, or the murals page when it finished a mural; a stuck game offers undo or
	starting over.
-->
<script lang="ts">
	interface Props {
		state: 'won' | 'stuck';
		/** A short line, like "Heart cleared." */
		text: string;
		/** The next level's page; without one, `onnext` moves on in place. */
		nextHref?: string;
		onnext?: () => void;
		muralsHref?: string;
		/** This win finished a mural, so the way on is back to the murals. */
		finished?: boolean;
		onundo: () => void;
		onrestart: () => void;
	}

	let { state, text, nextHref, onnext, muralsHref, finished, onundo, onrestart }: Props = $props();
</script>

<div class="end" role="status">
	<p>{text}</p>
	<div class="row">
		{#if state === 'won'}
			{#if finished && muralsHref}
				<a class="border inset link-box" href={muralsHref}>see the mural →</a>
			{:else}
				{#if nextHref}
					<a class="border inset link-box" href={nextHref}>next →</a>
				{:else if onnext}
					<button class="border inset link-box" onclick={onnext}>next →</button>
				{/if}
				{#if muralsHref}
					<a class="border inset link-box" href={muralsHref}>all murals</a>
				{/if}
			{/if}
		{:else}
			<button class="border inset link-box" onclick={onundo}>undo</button>
			<button class="border inset link-box" onclick={onrestart}>start over</button>
		{/if}
	</div>
</div>

<style>
	/* Drawn inside another piece (like a game's tray), so it has no frame of its own. */
	.end {
		width: 100%;
		align-self: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 4px;
		text-align: center;
	}
	p {
		font-family: Courier, monospace;
		font-weight: 700;
	}
	.row {
		display: flex;
		justify-content: center;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
