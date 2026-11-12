<script lang="ts">
	interface Props {
		state: 'won' | 'stuck';
		text: string;
		nextHref?: string;
		onnext?: () => void;
		muralsHref?: string;
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
