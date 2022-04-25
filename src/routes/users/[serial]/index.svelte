<!-- users/[serial]/index.svelte -->
<script lang="ts" context="module">
	/** @type {import('./users/[serial]').Load} */
	export async function load({ session, fetch, params }) {
		const userResponse = await fetch(`/api/users?serial=${params.serial}`);
		const user: User = await userResponse.json();

		if (userResponse.status == 404) {
			return { status: 404, error: "user doesn't exist" };
		}
		const isUser = session.user && session.user.id == user.id;
		const isAdmin = session.user && session.user.isAdmin;

		return {
			props: { user, isUser, isAdmin }
		};
	}
</script>

<script lang="ts">
	import type { User } from '@prisma/client';
	import Card from '$lib/components/Card.svelte';

	export let user: User;
	export let isUser: boolean;
	export let isAdmin: boolean;

	const originalUser: User = user;
</script>

<svelte:head>
	<title>{'user: ' + user.serial.toUpperCase()}</title>
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
	<form action="/users/{user.id}/edit" method="post">
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
				autocapitalize="characters"
			/>
			<input
				class="email border inset shadow"
				type="text"
				name="email"
				disabled
				bind:value={user.email}
				placeholder={originalUser.email}
			/>
			<div class="buttons">
				<button class="good border inset shadow no-select" type="submit">update</button>

				{#if isUser}
					<!-- svelte-ignore a11y-accesskey -->
					<button class="border inset shadow no-select" type="submit" form="logout" accesskey="l">
						logout
					</button>
				{/if}

				<a href={`/users/${user.id}/delete`}>
					<button class="bad border inset shadow no-select">delete</button>
				</a>
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
		text-transform: uppercase;
	}
	input.email {
		width: 16rem;
		max-width: 90%;
	}
	.buttons {
		display: flex;
		gap: 1rem;
	}
</style>
