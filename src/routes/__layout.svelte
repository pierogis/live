<script lang="ts">
	import { session } from '$app/stores';
	import type { User } from '$lib/database/models';

	let user: User = $session.user;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header class="header">
	<div>
		<a href="/"> <h3 class="title nav-box border inset shadow">karl's plate emporium</h3></a>
	</div>
</header>

<nav class="nav">
	<a href="/jurisdictions" class="nav-box border inset shadow">jurisdictions</a>
	<a href="/account" class="nav-box account border inset shadow"
		>{user && user.name ? user.name : 'login'}</a
	>
</nav>

<div class="content"><slot /></div>

<style global>
	:root {
		--primary-color: rgba(255, 240, 220, 1);
		--accent-color: rgba(225, 140, 150, 1);
		--secondary-color: rgb(140, 205, 225);
		--text-color: rgb(58, 96, 106);

		--primary-color-st: rgba(255, 240, 220, 0.2);
		--accent-color-st: rgba(225, 140, 150, 0.2);
		--secondary-color-st: rgba(140, 205, 225, 0.2);
		--text-color-st: rgba(58, 96, 106, 0.2);

		--primary-color-t: rgba(255, 240, 220, 0);
		--accent-color-t: rgba(225, 140, 150, 0);
		--secondary-color-t: rgba(140, 205, 225, 0);
		--text-color-t: rgba(58, 96, 106, 0);

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
		border-top: solid 8px var(--secondary-color);
		border-left: solid 8px var(--secondary-color);
		border-bottom: solid 8px var(--accent-color);
		border-right: solid 8px var(--accent-color);
		border-radius: 12px;
	}

	.inset {
		box-shadow: inset 2px 2px 0px var(--text-color-st), inset -2px -2px 0px var(--text-color-st);
	}

	.shadow {
		box-shadow: 0px 0px 4px 0px var(--text-color-st);
	}

	.inset.shadow {
		box-shadow: inset 2px 2px 0px var(--text-color-st), inset -2px -2px 0px var(--text-color-st),
			0px 0px 8px 0px var(--text-color-st);
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
