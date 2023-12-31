<script lang="ts">
	import { userIdInputName } from '$lib/forms/user';

	import { Card, Interactable } from '@pierogis/utensils';

	export let data;

	export let form;
</script>

<svelte:head>
	<title>{'delete user: ' + data.user.serial.toUpperCase()}</title>
</svelte:head>

{#if data.isUser || data.isAdmin}
	<Card>
		<span>Are you sure you want to delete this account?</span>
		<b>{data.user.serial}</b>
		<div class="buttons">
			<Interactable>
				<a class="link-box border inset no-select" href={`/users/${data.user.serial}`}>cancel</a>
			</Interactable>

			<Interactable>
				<button class="bad border inset no-select" form="delete" type="submit">delete</button>
			</Interactable>
		</div>
	</Card>
{/if}

{#if form?.message}
	<div class="border inset no-select bad alert">
		{form?.message}
	</div>
{/if}

<form id="delete" method="post">
	<input hidden name={userIdInputName} value={data.user.id} />
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
