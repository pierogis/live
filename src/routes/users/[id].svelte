<script lang="ts">
	import { session } from '$app/stores';

	import type { User } from '$lib/database/models';
	import Card from '$lib/components/Card.svelte';

	export let user: User;
	const originalUser: User = user;

	$: user.serial = user.serial.toUpperCase();

	$: isUser = $session.user ? $session.user.id == user.id : false;
	$: isAdmin = $session.user ? $session.user.id == 1 : false;
</script>

<svelte:head>
	<title>{'user: ' + user.serial}</title>
</svelte:head>

{#if !isUser}
	<Card>
		{#if isAdmin}
			<span>#{user.id}</span>
		{/if}
		<span>{user.serial}</span>
	</Card>
{/if}

{#if isUser || isAdmin}
	<form action="/users/{user.id}?_method=PUT" method="post">
		<Card>
			{#if isAdmin}
				<span>#{user.id}</span>
			{/if}
			<input
				class="serial border inset shadow"
				type="text"
				name="serial"
				bind:value={user.serial}
				placeholder={originalUser.serial}
				maxlength="7"
				autocomplete="off"
			/>
			<input
				class="email border inset shadow"
				type="text"
				name="email"
				bind:value={user.email}
				placeholder={originalUser.email}
			/>
			<div class="buttons">
				<button class="border inset shadow" type="submit">update</button>

				{#if isUser}
					<!-- svelte-ignore a11y-accesskey -->
					<button class="logout border inset shadow" type="submit" form="logout" accesskey="l"
						>logout</button
					>
				{/if}
			</div>
		</Card>
	</form>
{/if}

<form id="logout" action="/logout" method="post" />

<style>
	form {
		display: flex;
		flex-direction: column;
	}
	input.serial {
		width: 4.25rem;
	}
	input.email {
		width: 16rem;
		max-width: 90%;
	}
	.buttons {
		display: flex;
		gap: 1rem;
	}
	.logout {
		background-color: var(--accent-color);
		color: var(--primary-color);
	}
</style>
