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
	import { FlowCode, flowStatuses } from './_flow';

	export let email: string;
	export let generated: boolean;

	export let sampleEmail: string;
	export let samplePhrase: string;

	export let flowCode: FlowCode = null;

	let passphrase = '';
	const flowStatus = flowStatuses[flowCode];
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

{#if flowStatus}<Alert
		message={flowStatus.message}
		good={flowStatus.alertState === true}
		bad={flowStatus.alertState === false}
	/>{/if}

<Card>
	<form action="/login" method="post">
		<input type="hidden" name="generated" value={!generated} />
		<div class="input-container">
			<label for="email">email</label>
			<input
				readonly={generated && flowStatus && flowStatus.emailState}
				class="border inset shadow"
				class:good={flowStatus && flowStatus.emailState === true}
				class:bad={flowStatus && flowStatus.emailState === false}
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
					class="border inset shadow"
					class:good={flowStatus && flowStatus.passphraseState === true}
					class:bad={flowStatus && flowStatus.passphraseState === false}
					id="passphrase"
					type="text"
					name="passphrase"
					placeholder={samplePhrase}
					bind:value={passphrase}
				/>
			</div>
		{/if}

		<button
			class="border inset shadow good"
			type="submit"
			title={generated ? '' : 'email a temporary passphrase'}
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
	input {
		width: 16rem;
	}
</style>
