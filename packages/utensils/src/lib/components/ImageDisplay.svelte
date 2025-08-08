<script lang="ts">
	interface Props {
		inset?: boolean;
		shadow?: boolean;
		width: string;
		height: string;
		urls: string[];
		alt: string;
		style?: string;
	}

	let { inset = true, shadow = false, width, height, urls, alt, style = '' }: Props = $props();
</script>

<div class:inset class:shadow>
	<img {style} {width} {height} src={urls[0] || ''} {alt} />
</div>

<style>
	div {
		display: flex;

		border: solid 3px var(--text-color);
		border-radius: 10px;
	}
	img {
		border-radius: 10px;

		transition: all 200ms;
	}
</style>
