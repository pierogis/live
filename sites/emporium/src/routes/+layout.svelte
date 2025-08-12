<script lang="ts">
	import { page } from '$app/state';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';
	import './style.css';

	let { data, children } = $props();

	let title = $derived(page.data.title || "karl's plate emporium");
	let description = $derived(page.data.description || 'a place for plates');
	let canonical = $derived(new URL(page.url.pathname, 'https://emporium.pierogis.live').toString());
	let og = $derived({
		image: new URL(`pierogis-live-og.webp`, page.url.origin).toString(),
		alt: 'pierogis live'
	});
	let twitter = $derived({
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, page.url.origin).toString(),
		alt: 'pierogis live'
	});
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter} />

<ThemeProvider>
	<Layout
		title="karl's plate emporium"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/emporium' }}
	>
		{#snippet nav()}
			<nav>
				<Interactable>
					<a href="/jurisdictions" class="link-box border inset">jurisdictions</a>
				</Interactable>

				<Interactable>
					<a href="/plates/faq" class="border inset link-box">faq</a>
				</Interactable>
				{#if data.sessionUser?.isAdmin}
					<Interactable>
						<a href="/plates/create" class="link-box border inset good">create</a>
					</Interactable>
				{/if}

				<Interactable>
					<a href="/account" class="link-box border inset" class:good={data.sessionUser === null}>
						{data.sessionUser !== null ? data.sessionUser.serial : 'login'}
					</a>
				</Interactable>
			</nav>
		{/snippet}

		{@render children?.()}
	</Layout>
</ThemeProvider>
