<script lang="ts">
	import { Layout, ThemeToggle, Interactable } from '@pierogis/utensils';

	export let data;
	$: ({ sessionUser } = data);
</script>

<Layout>
	<Interactable slot="title">
		<div class="link-box border inset">karl's plate emporium</div>
	</Interactable>
	<nav slot="nav">
		<Interactable>
			<a href="/jurisdictions"><h4 class="link-box border inset">jurisdictions</h4></a>
		</Interactable>

		<Interactable>
			<a class="border inset link-box" href="/plates/faq">faq</a>
		</Interactable>
		{#if sessionUser?.isAdmin}
			<Interactable>
				<a href="/plates/create"><h4 class="link-box border inset good">create</h4></a>
			</Interactable>
		{/if}

		<Interactable>
			<a href="/account">
				<h4 class="link-box border inset" class:good={sessionUser === null}>
					{sessionUser !== null ? sessionUser.serial : 'login'}
				</h4>
			</a>
		</Interactable>
	</nav>

	<slot />

	<footer slot="footer">
		<Interactable>
			<a class="border inset link-box" href="https://pierogis.live">live</a>
		</Interactable>

		<Interactable>
			<a class="border inset link-box" href="https://github.com/pierogis/emporium">github</a>
		</Interactable>

		<Interactable>
			<a class="border inset link-box" href="https://twitter.com/pierogis_live">@pierogis_live</a>
		</Interactable>

		<ThemeToggle />
	</footer>
</Layout>

<style>
	@import 'style.css';
	@import '@pierogis/utensils/styles/pierogis.css';
</style>
