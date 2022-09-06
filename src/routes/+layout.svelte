<script lang="ts">
	import { Layout, ThemeToggle } from '@pierogis/utensils';

	import type { LayoutData } from './$types';
	export let data: LayoutData;
	$: ({ user } = data);
</script>

<Layout title="karl's plate emporium">
	<nav slot="nav">
		<a href="/jurisdictions"><h4 class="link-box border inset shadow">jurisdictions</h4></a>
		<a class="border shadow inset link-box" href="/plates/faq">faq</a>
		{#if user?.isAdmin}
			<a href="/plates/create"><h4 class="link-box border inset shadow good">create</h4></a>
		{/if}
		<a href="/account">
			<h4 class="link-box border inset shadow" class:good={!user}>
				{user ? user.serial : 'login'}
			</h4>
		</a>
	</nav>

	<slot {user} />

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://pierogis.live">live</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/emporium">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<ThemeToggle />
	</footer>
</Layout>
