<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { browser } from '$app/environment';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';
	import './style.css';
	import { page } from '$app/stores';

	export let data;
	$: ({ sessionUser } = data);

	$: browser && injectSpeedInsights();
</script>

<svelte:head>
	<title>{$page.data.title}</title>
	<link rel="canonical" href={$page.data.canonical} />
	<meta name="description" content={$page.data.description} />
	<meta name="robots" content="index, follow" />
</svelte:head>

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
