<script lang="ts">
	import { session } from '$app/stores';
	import type { User } from '$lib/database/models';

	let user: User = $session.user;
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<header class="header">
	<div>
		<a href="/"> <h3 class="title nav-box border shadow">karl's plate emporium</h3></a>
	</div>
</header>

<nav class="nav">
	<a href="/jurisdictions" class="nav-box border shadow">jurisdictions</a>
	<a href="/account" class="nav-box account border shadow"
		>{user && user.name ? user.name : 'login'}</a
	>
</nav>

<div class="content"><slot /></div>

<style global>
	:root {
		--primary-color: rgba(255, 235, 205, 1);
		--accent-color: rgba(165, 85, 85, 1);
		--secondary-color: rgb(59, 98, 99);
		--text-color: rgb(58, 96, 106);

		--primary-color-st: rgba(255, 235, 205, 0.5);
		--accent-color-st: rgba(165, 85, 85, 0.5);
		--secondary-color-st: rgba(75, 123, 125, 0.5);
		--text-color-st: rgba(48, 79, 80, 0.5);

		--primary-color-t: rgba(255, 235, 205, 0);
		--accent-color-t: rgba(165, 85, 85, 0);
		--secondary-color-t: rgba(95, 158, 160, 0);
		--text-color-t: rgba(48, 79, 80, 0);

		--content-width: 240px;
	}
	* {
		margin: 0;
		padding: 0;
		border: 0;
		outline: 0;

		vertical-align: baseline;

		font-family: 'Courier', monospace;
		font-weight: 600;
		font-style: normal;
		font-size: 20px;
		color: var(--text-color);

		background: transparent;
	}
	@media only screen and (max-width: 400px) {
		* {
			font-size: 5vw;
		}
	}

	body {
		color: var(--text-color);

		background-image: radial-gradient(circle, var(--primary-color) 1px, var(--primary-color) 2px);
	}

	input[type='text'],
	input[type='email'],
	input[type='password'] {
		background-color: whitesmoke;
	}
	input[type='submit'],
	button {
		background-color: var(--primary-color);
		cursor: pointer;
	}

	input[type='text'],
	input[type='email'],
	input[type='password'],
	input[type='submit'],
	button,
	.nav-box {
		font-weight: bold;
		padding: 0.2rem 0.4rem;
	}

	.header {
		position: sticky;
		top: 0;

		padding-top: 32px;

		background-color: transparent;

		text-align: center;
	}

	a {
		text-decoration: none;
	}

	.title {
		z-index: 10;
	}

	.border {
		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		border-radius: 5%;
	}

	.shadow {
		box-shadow: inset 2px 2px 0px rgba(150, 150, 150, 0.4),
			inset -2px -2px 0px rgba(150, 150, 150, 0.4);
	}

	.nav {
		padding: 1rem;
		padding-top: 1.5rem;
		padding-bottom: 1rem;

		background-color: transparent;

		display: flex;
		gap: 16px;
		justify-content: center;

		text-align: center;
	}
	@media only screen and (max-width: 320px) {
		.nav {
			flex-direction: column;
		}
	}

	.content {
		display: flex;
		justify-content: center;
	}

	.nav-box {
		display: inline;
		background-color: var(--primary-color);
		color: var(--text-color);
	}
</style>
