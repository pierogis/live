<script lang="ts">
	import { userIdInputName } from '$lib/forms/user';

	import { Card } from '@pierogis/utensils';

	export let data;

	export let form;
</script>

<svelte:head>
	<title>{'delete user: ' + data.user.serial.toUpperCase()}</title>
</svelte:head>

{#if data.isUser || data.isAdmin}
	<Card>
		<span>Are you sure you want to delete this account?</span>
		<b>{data.user.email}</b>
		<div class="buttons">
			<a href={`/users/${data.user.serial}`}>
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
