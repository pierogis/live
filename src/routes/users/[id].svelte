<script lang="ts" context="module">
	/** @type {import('./users/[id]').Load} */
	export async function load({ props, session }) {
		if (!props.user) {
			return { status: 404, error: "user doesn't exist" };
		}
		const isUser = session.user && session.user.id == props.user.id;
		const isAdmin = session.user && session.user.isAdmin;

		return {
			props: { ...props, isUser, isAdmin }
		};
	}
</script>

<script lang="ts">
	import type { User } from '@prisma/client';
	import Card from '$lib/components/Card.svelte';
	import Alert from '$lib/components/Alert.svelte';

	export let user: User;
	export let isUser: boolean;
	export let isAdmin: boolean;

	const originalUser: User = user;
	export let error: string = null;
</script>

<svelte:head>
	<title>{'user: ' + user.serial.toUpperCase()}</title>
</svelte:head>

{#if error}
	<Alert message={error} bad={true} good={false} />
{/if}

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
				<button class="border inset shadow no-select" type="submit">update</button>

				{#if isUser}
					<!-- svelte-ignore a11y-accesskey -->
					<button
						class="bad border inset shadow no-select"
						type="submit"
						form="logout"
						accesskey="l"
					>
						logout
					</button>
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
