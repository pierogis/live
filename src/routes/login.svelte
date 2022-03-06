<script lang="ts">
	import Card from '$lib/components/Card.svelte';

	let email = '';
	let password = '';

	export let sampleEmail: string;
	export let samplePhrase: string;
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

<Card>
	<div class="login">
		<form action="/login" method="post">
			<div class="input-container">
				<label for="email">email</label>
				<input
					class="input border shadow"
					id="email"
					type="text"
					name="email"
					placeholder={sampleEmail}
					bind:value={email}
				/>
			</div>
			<div class="input-container">
				<label for="password">password</label>
				<input
					class="input border shadow"
					id="password"
					type="text"
					name="password"
					placeholder={samplePhrase}
					bind:value={password}
				/>
			</div>
			<button class="submit border shadow" type="submit">
				{password != '' ? 'login' : 'generate'}
			</button>
		</form>
	</div>
</Card>

<style>
	.login {
		width: 100%;
		max-width: var(--column-width);
	}
	form {
		width: 32rem;

		display: flex;
		flex-direction: column;
		align-items: center;
	}
	label {
		display: block;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}
	.input-container {
		width: 24rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.input {
		margin-bottom: 0.75rem;
		width: 100%;
		padding: 0.5rem 0.5rem;
	}
	.submit {
		font-family: monospace;
		width: 20%;
		padding: 12px;
		background-color: var(--primary-color);
		color: var(--text-color);
		font-weight: bold;

		cursor: pointer;
	}
</style>
