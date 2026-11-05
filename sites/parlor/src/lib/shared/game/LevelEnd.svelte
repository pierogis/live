<!--
	How a level ended, shown in place, not as a pop-up: a cleared picture offers the
	next one; a stuck game offers undo or starting over.
-->
<script lang="ts">
	interface Props {
		state: 'won' | 'stuck';
		/** A short line, like "cleared in 42 moves". */
		text: string;
		/** The next level's page; without one, `onnext` moves on in place. */
		nextHref?: string;
		onnext?: () => void;
		picturesHref?: string;
		onundo: () => void;
		onrestart: () => void;
		/** Drawn inside another piece (like a game's tray), so it has no frame of its own. */
		plain?: boolean;
	}

	let {
		state,
		text,
		nextHref,
		onnext,
		picturesHref,
		onundo,
		onrestart,
		plain = false
	}: Props = $props();
</script>

<div class="end" class:inset={!plain} class:plain class:won={state === 'won'} role="status">
	<p>{text}</p>
	<div class="row">
		{#if state === 'won'}
			{#if nextHref}
				<a class="border inset link-box" href={nextHref}>next →</a>
			{:else if onnext}
				<button class="border inset link-box" onclick={onnext}>next →</button>
			{/if}
			{#if picturesHref}<a class="border inset link-box" href={picturesHref}>all pictures</a>{/if}
		{:else}
			<button class="border inset link-box" onclick={onundo}>undo</button>
			<button class="border inset link-box" onclick={onrestart}>start over</button>
		{/if}
	</div>
</div>

<style>
	.end {
		width: 100%;
		max-width: 520px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 10px;
	}
	.end.plain {
		max-width: none;
		align-self: center;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		padding: 4px;
	}
	.plain .row {
		justify-content: center;
	}
	.end.won:not(.plain) {
		box-shadow:
			var(--inset),
			0 0 0 2px var(--secondary-color);
	}
	p {
		font-family: Courier, monospace;
		font-weight: 700;
	}
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
