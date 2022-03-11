<script lang="ts" context="module">
	/** @type {import('./login').Load} */
	export async function load({ url, props }) {
		const email = props.email || url.searchParams.get('email') || '';
		const generated = props.generated || url.searchParams.get('generated') == 'true' || false;

		return {
			status: 200,
			props: { ...props, email, generated }
		};
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/components/Card.svelte';
	import Alert from '$lib/components/Alert.svelte';

	export let email: string;
	export let generated: boolean;

	export let sampleEmail: string;
	export let samplePhrase: string;

	export let good: boolean = null;
	export let message: string = null;

	let passphrase = '';
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

{#if message}<Alert {message} {good} />{/if}

<Card>
	<form action="/login" method="post">
		<input type="hidden" name="generated" value={!generated} />
		<div class="input-container">
			<label for="email">email</label>
			<input
				readonly={generated}
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
		{/if}

		<button class="submit border inset shadow" type="submit"
			>{generated ? 'login' : 'generate'}</button
		>

		{#if generated}
			<!-- svelte-ignore a11y-accesskey -->
			<button
				type="submit"
				formmethod="get"
				class="border inset shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}`);
				}}
				accesskey="g"
			>
				need a new passphrase?
			</button>
		{:else}
			<!-- svelte-ignore a11y-accesskey -->
			<button
				type="submit"
				formmethod="get"
				class="border inset shadow"
				on:click|preventDefault={() => {
					goto(`/login?email=${email}&generated=true`);
				}}
				accesskey="r"
			>
				already have a passphrase?
			</button>
		{/if}
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

	.submit {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
