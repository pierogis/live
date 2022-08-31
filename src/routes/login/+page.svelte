<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { flowStatuses } from './_flow';
	import { Card } from '@pierogis/utensils';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ sampleEmail, samplePhrase, flowCode } = data);

	$: originalEmail = $page.url.searchParams.get('email') || '';
	$: generated = $page.url.searchParams.get('generated') == 'true' || false;

	$: redirectUrl = $page.url.searchParams.get('redirectUrl');

	$: email = originalEmail;

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
			on:click|preventDefault={async () => {
				await goto(`/login?email=${email}&redirectUrl=${redirectUrl}`);
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
			on:click|preventDefault={async () => {
				await goto(`/login?email=${email}&generated=true&redirectUrl=${redirectUrl}`);
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

	label,
	input,
	button {
		font-family: Courier, monospace;
		font-size: 16px;
	}

	input {
		width: 20rem;
		max-width: 90%;
	}

	.alert {
		padding: 1rem;
	}
</style>
