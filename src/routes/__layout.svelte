<script lang="ts">
	import { session } from '$app/stores';
	import type { User } from '@prisma/client';

	import Layout from '@pierogis/utensils/Layout.svelte';

	let user: User = $session.user;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Layout title="karl's plate emporium">
	<nav slot="nav">
		<a href="/jurisdictions"><h3 class="link-box border inset shadow">jurisdictions</h3></a>
		{#if user?.isAdmin}
			<a href="/plates/create"><h3 class="link-box border inset shadow">create</h3></a>
		{/if}
		<a href="/account">
			<h3 class="link-box border inset shadow" class:good={!user}>
				{user ? user.serial : 'login'}
			</h3>
		</a>
	</nav>

	<slot />

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="/plates/faq">faq</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/emporium">github</a>
	</footer>
</Layout>

<style global>
	/* default styles */
	:root {
		--primary-color: rgba(255, 240, 220, 1);
		--accent-color: rgba(225, 140, 150, 1);
		--secondary-color: rgb(140, 205, 225);
		--text-color: rgb(58, 96, 106);
		--input-color: rgba(235, 245, 245, 1);

		--primary-color-st: rgba(255, 240, 220, 0.4);
		--accent-color-st: rgba(225, 140, 150, 0.4);
		--secondary-color-st: rgba(140, 205, 225, 0.4);
		--text-color-st: rgba(58, 96, 106, 0.4);

		--primary-color-t: rgba(255, 240, 220, 0);
		--accent-color-t: rgba(225, 140, 150, 0);
		--secondary-color-t: rgba(140, 205, 225, 0);
		--text-color-t: rgba(58, 96, 106, 0);

		--divider-size: 0.4rem;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--primary-color: rgb(58, 96, 106);
			--accent-color: rgba(225, 140, 150, 1);
			--secondary-color: rgb(140, 205, 225);
			--text-color: rgba(255, 240, 220, 1);
			--input-color: rgba(100, 120, 120, 0.8);

			--primary-color-st: rgba(58, 96, 106, 0.3);
			--accent-color-st: rgba(225, 140, 150, 0.3);
			--secondary-color-st: rgba(140, 205, 225, 0.3);
			--text-color-st: rgba(255, 240, 220, 0.3);

			--primary-color-t: rgba(58, 96, 106, 0);
			--accent-color-t: rgba(225, 140, 150, 0);
			--secondary-color-t: rgba(140, 205, 225, 0);
			--text-color-t: rgba(255, 240, 220, 0);
		}
	}
</style>
