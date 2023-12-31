<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	import { userIdInputName } from '$lib/forms/user';

	export let data;
	$: ({ isUser, isAdmin, user } = data);

	export let form;
</script>

{#if isUser || isAdmin}
	<Card>
		<span>Are you sure you want to delete this account?</span>
		<b>{user.serial}</b>
		<div class="buttons">
			<Interactable>
				<a class="link-box border inset no-select" href={`/users/${user.serial}`}>cancel</a>
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
