<script lang="ts">
	import { Card } from '@pierogis/utensils';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ user, isUser, isAdmin } = data);
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
