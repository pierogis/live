<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { browser } from '$app/environment';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';
	import './style.css';
	import { page } from '$app/stores';

	export let data;
	$: ({ sessionUser } = data);

	if (browser) {
		injectSpeedInsights();
	}

	$: title = $page.data.title || "karl's plate emporium";
	$: description = $page.data.description || 'a place for plates';
	$: canonical = new URL($page.url.pathname, 'https://emporium.pierogis.live').toString();
	$: og = {
		image: new URL(`pierogis-live-og.webp`, $page.url.origin).toString(),
		alt: 'pierogis live'
	};
	$: twitter = {
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, $page.url.origin).toString(),
		alt: 'pierogis live'
	};
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter} />

<ThemeProvider>
	<Layout
		title="karl's plate emporium"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/emporium' }}
	>
		<nav slot="nav">
			<Interactable>
				<a href="/jurisdictions" class="link-box border inset">jurisdictions</a>
			</Interactable>

			<Interactable>
				<a href="/plates/faq" class="border inset link-box">faq</a>
			</Interactable>
			{#if sessionUser?.isAdmin}
				<Interactable>
					<a href="/plates/create" class="link-box border inset good">create</a>
				</Interactable>
			{/if}

			<Interactable>
				<a href="/account" class="link-box border inset" class:good={sessionUser === null}>
					{sessionUser !== null ? sessionUser.serial : 'login'}
				</a>
			</Interactable>
		</nav>

		<slot />
	</Layout>
</ThemeProvider>
