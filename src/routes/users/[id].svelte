<script lang="ts">
	import { session } from '$app/stores';

	import type { User } from '$lib/database/models';
	import Card from '$lib/components/Card.svelte';

	export let user: User;

	$: isUser = $session.user ? $session.user.id == user.id : false;
</script>

<svelte:head>
	<title>{'user: ' + user.id}</title>
</svelte:head>

<Card>
	<span>{user.name}</span>
	{#if isUser}
		<span>{user.email}</span>
	{/if}
</Card>

{#if isUser}
	<form action="/logout" method="post">
		<button class="logout border shadow" type="submit">logout</button>
	</form>
{/if}

<style>
	.logout {
		position: absolute;

		right: 32px;
		background-color: var(--accent-color);
		color: var(--primary-color);
	}
</style>
