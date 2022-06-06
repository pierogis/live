<!-- users/[id=integer]/delete.svelte -->
<script lang="ts" context="module">
	/** @type {import('./users/[id=integer]/delete').Load} */
	export async function load({ session, fetch, params }) {
		const response = await fetch(`/api/users/${params.id}`);
		const user = await response.json();

		if (!user) {
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

	import { Card } from '@pierogis/utensils';

	export let user: User;
	export let isUser: boolean;
	export let isAdmin: boolean;
</script>

<svelte:head>
	<title>{'delete user: ' + user.serial.toUpperCase()}</title>
</svelte:head>

{#if isUser || isAdmin}
	<Card>
		<span>are you sure you want to delete this account?</span>
		<span>-> {user.email}</span>
		<div class="buttons">
			<a href={`/users/${user.id}`}>
				<button class="border inset shadow no-select">cancel</button>
			</a>

			<button class="bad border inset shadow no-select" form="delete" type="submit">delete</button>
		</div>
	</Card>
{/if}

<form id="delete" method="post" />

<style>
	form {
		display: flex;
		flex-direction: column;
	}
	.buttons {
		display: flex;
		gap: 1rem;
	}
</style>
