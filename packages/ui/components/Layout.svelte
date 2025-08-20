<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Interactable, Layout, ThemeToggle } from '@pierogis/utensils';
	import '@pierogis/utensils/styles/pierogis.css';

	interface Props {
		title: string;
		github: { repo: string };
		nav?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		theme?: Snippet;
	}

	let { title, github, nav: nav_render, children, footer: footer_render, theme }: Props = $props();
</script>

{#snippet title_snippet()}
	<Interactable>
		<div class="link-box border inset">{title}</div>
	</Interactable>
{/snippet}

<Layout title={title_snippet}>
	{#snippet nav()}
		{@render nav_render?.()}
	{/snippet}

	{@render children?.()}

	{#snippet footer()}
		<footer>
			{#if footer_render}
				{@render footer_render()}
			{:else}
				<Interactable>
					<a class="border inset link-box" href="https://pierogis.live">live</a>
				</Interactable>
			{/if}
			<Interactable>
				<a class="border inset link-box" href={github.repo}>github</a>
			</Interactable>
			<Interactable>
				<a class="border inset link-box" href="https://twitter.com/pierogis_live">
					@pierogis_live
				</a>
			</Interactable>

			{#if theme}
				{@render theme()}
			{:else}
				<ThemeToggle />
			{/if}
		</footer>
	{/snippet}
</Layout>
