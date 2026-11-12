<script lang="ts">
	import Pips from './Pips.svelte';

	interface Props {
		game: string;
		label: string;
		difficulty?: number | null;
		done?: boolean;
		canUndo: boolean;
		muted: boolean;
		muralsHref?: string;
		onundo: () => void;
		onrestart: () => void;
		onsound: () => void;
	}

	let {
		game,
		label,
		difficulty = null,
		done = false,
		canUndo,
		muted,
		muralsHref,
		onundo,
		onrestart,
		onsound
	}: Props = $props();
</script>

<div class="bar">
	<div class="titles">
		<h2 class="brand">{game}</h2>
		<div class="label">
			<span class="name">{label}</span>
			{#if difficulty}<Pips {difficulty} label />{/if}
			{#if done}<span class="done">✓ done</span>{/if}
		</div>
	</div>
	<nav class="tools" aria-label="Game controls">
		<button
			class="tool border inset link-box"
			title="Undo (Z)"
			aria-label="Undo"
			disabled={!canUndo}
			onclick={onundo}
		>
			<svg viewBox="0 0 24 24"
				><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg
			>
		</button>
		<button
			class="tool border inset link-box"
			title="Restart (R)"
			aria-label="Restart level"
			onclick={onrestart}
		>
			<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></svg>
		</button>
		<button
			class="tool border inset link-box"
			title="Sound"
			aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
			onclick={onsound}
		>
			{#if muted}
				<svg viewBox="0 0 24 24"
					><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m16 9 6 6M22 9l-6 6" /></svg
				>
			{:else}
				<svg viewBox="0 0 24 24">
					<path d="M11 5 6 9H3v6h3l5 4z" />
					<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
				</svg>
			{/if}
		</button>
		{#if muralsHref}
			<a
				class="tool border inset link-box"
				title="Murals"
				aria-label="All murals"
				href={muralsHref}
			>
				<svg viewBox="0 0 24 24">
					<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
					<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
					<rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
					<rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
				</svg>
			</a>
		{/if}
	</nav>
</div>

<style>
	.bar {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.titles {
		flex: 1;
		min-width: 0;
	}
	.brand {
		margin: 0;
		font-size: 20px;
	}
	.label {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 8px;
		color: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
		font-size: 13px;
		white-space: nowrap;
	}
	.name {
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.done {
		color: var(--link-color);
		font-weight: 800;
	}
	.tools {
		display: flex;
		gap: 6px;
		padding: 0;
	}
	.tool {
		width: 40px;
		height: 40px;
		padding: 0;
		display: grid;
		place-items: center;
	}
	.tool:disabled {
		opacity: 0.4;
		cursor: default;
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
