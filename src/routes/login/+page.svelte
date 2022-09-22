<script lang="ts">
	import { page } from '$app/stores';

	import { FlowCode, flowStatuses } from './_flow';

	import type { PageData, ActionData } from './$types';

	import { Card } from '@pierogis/utensils';

	export let data: PageData;
	$: ({ sampleEmail, samplePhrase } = data);

	export let form: ActionData;

	$: redirectUrl = form?.redirectUrl || $page.url.searchParams.get('redirectUrl');

	let email = form?.originalEmail;
	let passphrase = '';

	const flowStatus = flowStatuses[form?.flowCode || FlowCode.Default];

	const loginFormId = 'login';
	$: actionName = form?.generated ? 'login' : 'generate';
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

<form id={loginFormId} action="/login?/{actionName}" method="post" />
<Card>
	<input type="hidden" name="redirectUrl" form={loginFormId} value={redirectUrl} />
	<input type="hidden" name="generated" form={loginFormId} value={!form?.generated} />
	<label>
		<span>email</span>
		<input
			readonly={form?.generated && flowStatus && flowStatus.emailState}
			class="border inset shadow"
			class:good={flowStatus && flowStatus.emailState === true}
			class:bad={flowStatus && flowStatus.emailState === false}
			type="email"
			name="email"
			form={loginFormId}
			placeholder={sampleEmail}
			bind:value={email}
		/>
	</label>

	{#if form?.generated}
		<label>
			<span>temporary passphrase</span>
			<input
				class="border inset shadow"
				class:good={flowStatus && flowStatus.passphraseState === true}
				class:bad={flowStatus && flowStatus.passphraseState === false}
				type="text"
				name="passphrase"
				form={loginFormId}
				placeholder={samplePhrase}
				bind:value={passphrase}
			/>
		</label>
	{/if}

	<button
		class="border inset shadow good no-select"
		type="submit"
		form={loginFormId}
		title={form?.generated ? '' : 'email a temporary passphrase'}
	>
		{form?.generated ? 'login' : 'generate'}
	</button>

	{#if form?.generated}
		<!-- svelte-ignore a11y-accesskey -->
		<button
			type="submit"
			form={loginFormId}
			formaction={'/login?/need'}
			class="border inset shadow no-select"
			accesskey="g"
		>
			need a new passphrase?
		</button>
	{:else}
		<!-- svelte-ignore a11y-accesskey -->
		<button
			type="submit"
			form={loginFormId}
			formaction={'/login?/already'}
			class="border inset shadow no-select"
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
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	label > span {
		text-decoration: underline;
	}

	input {
		width: 20rem;
		max-width: 90%;

		text-decoration: none;
	}
</style>
