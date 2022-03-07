<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/Card.svelte';

	let email = $page.url.searchParams.get('email') || '';
	$: generated = $page.url.searchParams.get('generated') != null;

	let passphrase = '';

	export let sampleEmail: string;
	export let samplePhrase: string;
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

<Card>
	<form action="/login?email={email}&generated" method="post">
		<div class="input-container">
			<label for="email">email</label>
			<input
				class="input border shadow"
				id="email"
				type="email"
				name="email"
				placeholder={sampleEmail}
				bind:value={email}
			/>
		</div>
		{#if generated}
			<div class="input-container">
				<label for="passphrase">generated passphrase</label>
				<input
					class="input border shadow"
					id="passphrase"
					type="text"
					name="passphrase"
					placeholder={samplePhrase}
					bind:value={passphrase}
				/>
			</div>
			<button
				type="button"
				class="border shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}`);
				}}
			>
				need a new passphrase?
			</button>
		{:else}
			<button
				type="button"
				class=" border shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}&generated`);
				}}
			>
				already have a passphrase?
			</button>
		{/if}

		<button class="border shadow" type="submit">{generated ? 'login' : 'generate'}</button>
	</form>
</Card>

<style>
	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	label {
		display: block;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}
	.input-container {
		width: 20rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.input {
		width: 16rem;
	}
	button {
		font-family: monospace;
		padding: 8px;
		background-color: var(--primary-color);
		color: var(--text-color);
		font-weight: bold;

		cursor: pointer;
	}

	button[type='submit'] {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
