<script lang="ts">
	import { Layout } from '@pierogis/utensils';

	import type { LayoutData } from './$types';
	export let data: LayoutData;
	$: ({ user } = data);
</script>

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

	<slot {user} />

	<footer slot="footer">
		<a class="border shadow inset link-box" href="/plates/faq">faq</a>
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/emporium">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
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

	@font-face {
		font-family: 'Lora';
		font-style: normal;
		font-weight: 400;
		src: url('/fonts/lora/Lora-Regular.ttf') format('truetype'),
			url('/fonts/lora/Lora-Italic.ttf') format('truetype'),
			url('/fonts/lora/Lora-Medium.ttf') format('truetype'),
			url('/fonts/lora/Lora-MediumItalic.ttf') format('truetype');
		unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
			U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
	}
</style>
