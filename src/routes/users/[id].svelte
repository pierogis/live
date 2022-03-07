<script lang="ts">
	import { session } from '$app/stores';

	import type { User } from '$lib/database/models';
	import Card from '$lib/components/Card.svelte';

	export let user: User;
	const originalUser: User = user;

	$: isUser = $session.user ? $session.user.id == user.id : false;
	$: isAdmin = $session.user ? $session.user.id == 1 : false;
</script>

<svelte:head>
	<title>{'user: ' + user.name}</title>
</svelte:head>

{#if !isUser}
	<Card>
		{#if isAdmin}
			<span>#{user.id}</span>
		{/if}
		<span>{user.name}</span>
	</Card>
{/if}

{#if isUser || isAdmin}
	<form action="/users/{user.id}?_method=PUT" method="post">
		<Card>
			{#if isAdmin}
				<span>#{user.id}</span>
			{/if}
			<input
				class="name border shadow"
				type="text"
				name="name"
				bind:value={user.name}
				placeholder={originalUser.name}
				maxlength="7"
			/>
			<input
				class="email border shadow"
				type="text"
				name="email"
				bind:value={user.email}
				placeholder={originalUser.email}
			/>
			<button class="border shadow" type="submit">update</button>
		</Card>
	</form>
{/if}

{#if isUser}
	<form action="/logout" method="post">
		<button class="logout border shadow" type="submit">logout</button>
	</form>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
	}
	input.name {
		width: 4.25rem;
	}
	input.email {
		width: 16rem;
	}
	.logout {
		position: absolute;

		right: 32px;
		background-color: var(--accent-color);
		color: var(--primary-color);
	}
</style>
