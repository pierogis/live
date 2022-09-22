<script lang="ts">
	import { userIdInputName } from '$lib/forms/user';

	import { Card } from '@pierogis/utensils';

	import type { PageData, ActionData } from './$types';
	export let data: PageData;
	$: ({ user, isUser, isAdmin } = data);

	export let form: ActionData;
</script>

<svelte:head>
	<title>{'delete user: ' + user.serial.toUpperCase()}</title>
</svelte:head>

{#if isUser || isAdmin}
	<Card>
		<span>Are you sure you want to delete this account?</span>
		<b>{user.email}</b>
		<div class="buttons">
			<a href={`/users/${user.serial}`}>
				<button class="border inset shadow no-select">cancel</button>
			</a>

			<button class="bad border inset shadow no-select" form="delete" type="submit">delete</button>
		</div>
	</Card>
{/if}

{#if form?.message}
	<div class="border inset shadow no-select bad alert">
		{form?.message}
	</div>
{/if}

<form id="delete" method="post">
	<input hidden name={userIdInputName} value={user.id} />
</form>

<style>
	span {
		text-align: center;
	}
	b {
		font-family: Courier, monospace;
		text-decoration: underline;
	}
	form {
		display: flex;
		flex-direction: column;
	}
	.buttons {
		display: flex;
		gap: 1rem;
	}
</style>
