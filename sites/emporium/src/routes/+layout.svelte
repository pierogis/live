<script lang="ts">
	import { browser } from '$app/environment';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';

	import './style.css';

	export let data;
	$: ({ sessionUser } = data);
</script>

<ThemeProvider>
	<Layout
		title="karl's plate emporium"
		github="https://github.com/pierogis/live/tree/main/sites/emporium"
		inject={browser}
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
