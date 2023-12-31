<script lang="ts">
	import { page } from '$app/stores';

	import { FlowCode, flowStatuses } from './_flow';

	import { Card, Interactable } from '@pierogis/utensils';

	export let data;
	$: ({ sampleEmail, samplePhrase } = data);

	export let form;

	$: redirectUrl = form?.redirectUrl || $page.url.searchParams.get('redirectUrl');

	let email = form?.originalEmail;
	let passphrase = '';

	const flowStatus = flowStatuses[form?.flowCode || FlowCode.Default];

	const loginFormId = 'login';
	$: actionName = form?.generated ? 'login' : 'generate';
</script>

<form id={loginFormId} action="/login?/{actionName}" method="POST" />
<Card>
	<input type="hidden" name="redirectUrl" form={loginFormId} value={redirectUrl} />
	<input type="hidden" name="generated" form={loginFormId} value={!form?.generated} />
	<label>
		<span>email</span>
		<input
			readonly={form?.generated && flowStatus && flowStatus.emailState}
			class="border inset"
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
				class="border inset"
				class:good={flowStatus && flowStatus.passphraseState === true}
				class:bad={flowStatus && flowStatus.passphraseState === false}
				type="text"
				name="passphrase"
				id="passphrase"
				form={loginFormId}
				placeholder={samplePhrase}
				bind:value={passphrase}
			/>
		</label>
	{/if}

	<Interactable>
		<button
			class="border inset good no-select"
			type="submit"
			form={loginFormId}
			title={form?.generated ? '' : 'email a temporary passphrase'}
		>
			{form?.generated ? 'login' : 'generate'}
		</button>
	</Interactable>

	{#if form?.generated}
		<Interactable>
			<!-- svelte-ignore a11y-accesskey -->
			<button
				type="submit"
				form={loginFormId}
				formaction={'/login?/need'}
				class="border inset no-select"
				accesskey="g"
			>
				need a new passphrase?
			</button>
		</Interactable>
	{:else}
		<Interactable>
			<!-- svelte-ignore a11y-accesskey -->
			<button
				type="submit"
				form={loginFormId}
				formaction={'/login?/already'}
				class="border inset no-select"
				accesskey="r"
			>
				already have a passphrase?
			</button>
		</Interactable>
	{/if}
</Card>
<br />
{#if flowStatus}
	<div
		class="border inset no-select alert"
		class:good={flowStatus.alertState == true}
		class:bad={flowStatus.alertState == false}
	>
		<u>{flowStatus.message}</u>
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
