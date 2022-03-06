<script lang="ts">
	let email = '';
	let password = '';
</script>

<svelte:head>
	<title>login</title>
</svelte:head>

<div class="login">
	<form action="/login" method="post">
		<label for="email">email</label>
		<input class="border" id="email" type="text" name="email" bind:value={email} />
		<label for="password">password</label>
		<input class="border" id="password" type="text" name="password" bind:value={password} />
		<button class="border" type="submit">{password != '' ? 'login' : 'generate'}</button>
	</form>
</div>

<style>
	.login {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
	}
	form {
		width: 28rem;
		margin: auto;
		font-size: 1.5rem;

		display: flex;
		flex-direction: column;
		align-items: center;
	}
	label {
		display: block;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}
	input {
		margin-bottom: 0.75rem;
		width: 100%;
		padding: 0 0.5rem;
		box-sizing: border-box;
		height: 2.5rem;
	}
	button {
		width: 50%;
		background-color: var(--accent-color);
		color: white;
		height: 2.5rem;
		font-weight: bold;
		transition: background-color 0.2s ease-in-out;
		cursor: pointer;
	}
	button:hover {
		background-color: var(--accent-color-st);
	}
</style>
