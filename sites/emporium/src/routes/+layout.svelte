<script lang="ts">
	import { Interactable } from '@pierogis/utensils';
	import { Layout } from 'ui';

	import './style.css';

	export let data;
	$: ({ sessionUser } = data);
</script>

<Layout
	title="karl's plate emporium"
	github="https://github.com/pierogis/live/tree/main/sites/emporium"
>
	<nav slot="nav">
		<Interactable>
			<a href="/jurisdictions" class="link-box border inset">jurisdictions</a>
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
			<a href="/account" class="link-box border inset" class:good={sessionUser === null}>
				{sessionUser !== null ? sessionUser.serial : 'login'}
			</a>
		</Interactable>
	</nav>

	<slot />
</Layout>
