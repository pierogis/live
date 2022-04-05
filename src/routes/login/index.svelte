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

<form id="login" action="/login" method="post" />
<Card>
	{#if flowStatus}
		<Alert message={flowStatus.message} />
	{/if}

	<input type="hidden" name="generated" form="login" value={!generated} />
	<label for="email">email</label>
	<input
		readonly={generated && flowStatus && flowStatus.emailState}
		class="border inset shadow"
		class:good={flowStatus && flowStatus.emailState === true}
		class:bad={flowStatus && flowStatus.emailState === false}
		id="email"
		type="email"
		name="email"
		form="login"
		placeholder={sampleEmail}
		bind:value={email}
	/>
	{#if generated}
		<label for="passphrase">temporary passphrase</label>
		<input
			class="border inset shadow"
			class:good={flowStatus && flowStatus.passphraseState === true}
			class:bad={flowStatus && flowStatus.passphraseState === false}
			id="passphrase"
			type="text"
			name="passphrase"
			form="login"
			placeholder={samplePhrase}
			bind:value={passphrase}
		/>
	{/if}

	<button
		class="border inset shadow good no-select"
		type="submit"
		form="login"
		title={generated ? '' : 'email a temporary passphrase'}
		>{generated ? 'login' : 'generate'}
	</button>

	{#if generated}
		<!-- svelte-ignore a11y-accesskey -->
		<button
			type="submit"
			formmethod="get"
			form="login"
			class="shortcut border inset shadow no-select"
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
			form="login"
			class="shortcut border inset shadow no-select"
			on:click|preventDefault={() => {
				goto(`/login?email=${email}&generated=true`);
			}}
			accesskey="r"
		>
			already have a passphrase?
		</button>
	{/if}
</Card>

<style>
	label {
		display: block;
		margin-bottom: 0.25rem;
	}
	.shortcut {
		font-size: 0.8rem;
	}
	input {
		width: 20rem;
		max-width: 90%;
	}
</style>
