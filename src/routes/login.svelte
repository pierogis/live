<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/Card.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let email = $page.url.searchParams.get('email') || '';
	$: generated = $page.url.searchParams.get('generated') != null;

	let passphrase = '';

	export let sampleEmail: string;
	export let samplePhrase: string;

	export let good: boolean = null;
	export let message: string = null;
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

{#if message}<Alert {message} {good} />{/if}

<Card>
	<form action="/login?email={email}&generated" method="post">
		<div class="input-container">
			<label for="email">email</label>
			<input
				class="input border inset shadow"
				id="email"
				type="email"
				name="email"
				placeholder={sampleEmail}
				bind:value={email}
			/>
		</div>
		{#if generated}
			<div class="input-container">
				<label for="passphrase">temporary passphrase</label>
				<input
					class="input border inset shadow"
					id="passphrase"
					type="text"
					name="passphrase"
					placeholder={samplePhrase}
					bind:value={passphrase}
				/>
			</div>
			<button
				type="button"
				class="border inset shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}`);
				}}
			>
				need a new passphrase?
			</button>
		{:else}
			<button
				type="button"
				class=" border inset shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}&generated`);
				}}
			>
				already have a passphrase?
			</button>
		{/if}

		<button class="border inset shadow" type="submit">{generated ? 'login' : 'generate'}</button>
	</form>
</Card>

<style>
	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	label {
		display: block;
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
		background-color: var(--primary-color);
		color: var(--text-color);

		cursor: pointer;
	}

	button[type='submit'] {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
