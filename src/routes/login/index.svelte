<script lang="ts" context="module">
	import type { Load } from './__types';
	export const load: Load = async ({ url, props }) => {
		const email = props.email || url.searchParams.get('email') || '';
		const generated = props.generated || url.searchParams.get('generated') == 'true' || false;

		const redirectUrl = props.redirectUrl || url.searchParams.get('redirectUrl');

		return {
			status: 200,
			props: { ...props, email, generated, redirectUrl }
		};
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';

	import { FlowCode, flowStatuses } from './_flow';
	import { Card } from '@pierogis/utensils';

	export let email: string;
	export let generated: boolean;
	export let redirectUrl: string;

	export let sampleEmail: string;
	export let samplePhrase: string;

	export let flowCode: FlowCode = null;

	let passphrase = '';
	const flowStatus = flowStatuses[flowCode];

	const loginFormId = 'login';
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

<form id={loginFormId} action="/login" method="post" />
<Card>
	<input type="hidden" name="redirectUrl" form={loginFormId} value={redirectUrl} />
	<input type="hidden" name="generated" form={loginFormId} value={!generated} />
	<label for="email">email</label>
	<input
		readonly={generated && flowStatus && flowStatus.emailState}
		class="border inset shadow"
		class:good={flowStatus && flowStatus.emailState === true}
		class:bad={flowStatus && flowStatus.emailState === false}
		id="email"
		type="email"
		name="email"
		form={loginFormId}
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
			form={loginFormId}
			placeholder={samplePhrase}
			bind:value={passphrase}
		/>
	{/if}

	<button
		class="border inset shadow good no-select"
		type="submit"
		form={loginFormId}
		title={generated ? '' : 'email a temporary passphrase'}
		>{generated ? 'login' : 'generate'}
	</button>

	{#if generated}
		<!-- svelte-ignore a11y-accesskey -->
		<button
			type="submit"
			formmethod="get"
			form={loginFormId}
			class="border inset shadow no-select"
			on:click|preventDefault={() => {
				goto(`/login?email=${email}&redirectUrl=${redirectUrl}`);
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
			form={loginFormId}
			class="border inset shadow no-select"
			on:click|preventDefault={() => {
				goto(`/login?email=${email}&generated=true&redirectUrl=${redirectUrl}`);
			}}
			accesskey="r"
		>
			already have a passphrase?
		</button>
	{/if}
</Card>
<br />
{#if flowStatus}
	<div
		class="border inset shadow no-select alert"
		class:good={flowStatus.alertState == true}
		class:bad={flowStatus.alertState == false}
	>
		{flowStatus.message}
	</div>
{/if}

<style>
	label {
		display: block;
		margin-bottom: 0.25rem;

		text-decoration: underline;
	}

	input {
		width: 20rem;
		max-width: 90%;
	}

	.alert {
		padding: 1rem;
	}
</style>
