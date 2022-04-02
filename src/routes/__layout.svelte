<script lang="ts">
	import { session } from '$app/stores';
	import type { User } from '@prisma/client';

	let user: User = $session.user;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
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
	<a href="/jurisdictions"><h3 class="nav-box border inset shadow">jurisdictions</h3></a>
	{#if user?.isAdmin}
		<a href="/plates/create"><h3 class="nav-box border inset shadow">create</h3></a>
	{/if}
	<a href="/account"
		><h3 class="nav-box border inset shadow">{user && user.serial ? user.serial : 'login'}</h3></a
	>
</nav>

<div class="content"><slot /></div>

<style global>
	:root {
		--primary-color: rgba(255, 240, 220, 1);
		--accent-color: rgba(225, 140, 150, 1);
		--secondary-color: rgb(140, 205, 225);
		--text-color: rgb(58, 96, 106);
		--input-color: rgba(235, 245, 245, 1);

		--primary-color-st: rgba(255, 240, 220, 0.4);
		--accent-color-st: rgba(225, 140, 150, 0.4);
		--secondary-color-st: rgba(140, 205, 225, 0.4);
		--text-color-st: rgba(58, 96, 106, 0.4);

		--primary-color-t: rgba(255, 240, 220, 0);
		--accent-color-t: rgba(225, 140, 150, 0);
		--secondary-color-t: rgba(140, 205, 225, 0);
		--text-color-t: rgba(58, 96, 106, 0);
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--primary-color: rgb(58, 96, 106);
			--accent-color: rgba(225, 140, 150, 1);
			--secondary-color: rgb(140, 205, 225);
			--text-color: rgba(255, 240, 220, 1);
			--input-color: rgba(100, 120, 120, 0.8);

			--primary-color-st: rgba(58, 96, 106, 0.3);
			--accent-color-st: rgba(225, 140, 150, 0.3);
			--secondary-color-st: rgba(140, 205, 225, 0.3);
			--text-color-st: rgba(255, 240, 220, 0.3);

			--primary-color-t: rgba(58, 96, 106, 0);
			--accent-color-t: rgba(225, 140, 150, 0);
			--secondary-color-t: rgba(140, 205, 225, 0);
			--text-color-t: rgba(255, 240, 220, 0);
		}
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
		font-size: 16px;
		color: var(--text-color);

		background: transparent;
	}
	@media only screen and (max-width: 320px) {
		* {
			font-size: 5vw;
		}
	}

	html {
		color: var(--text-color);

		background-color: var(--primary-color);
	}

	input[type='text'],
	input[type='email'],
	input[type='password'],
	input[type='url'],
	textarea {
		background-color: var(--input-color);
		padding: 0.1rem 0.2rem;
	}

	input[type='submit'],
	button {
		background-color: var(--primary-color);
		cursor: pointer;
	}

	input[type='text']:disabled,
	input[type='email']:disabled,
	input[type='password']:disabled,
	input[type='url']:disabled,
	textarea:disabled {
		background-color: var(--primary-color);
		color: var(--text-color);
		text-align: center;
		text-decoration: none;
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

		padding-top: 1.6rem;

		background-color: transparent;

		text-align: center;
	}

	a {
		text-decoration: none;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}

	a:focus,
	a:visited,
	a:active {
		outline: none;
	}

	.title {
		z-index: 10;
	}

	.border {
		border-top: solid 0.4rem var(--secondary-color);
		border-left: solid 0.4rem var(--secondary-color);
		border-bottom: solid 0.4rem var(--accent-color);
		border-right: solid 0.4rem var(--accent-color);
		border-radius: 0.6rem;
	}

	.inset {
		--inset: inset 0rem 0rem 0rem 0.1rem var(--text-color-st);
		box-shadow: var(--inset);
	}

	.shadow {
		--shadow: 0px 0px 0.2rem 0.05rem var(--text-color-st);
		box-shadow: var(--shadow);
	}

	.inset.shadow {
		box-shadow: var(--inset), var(--shadow);
	}

	.nav {
		padding: 2rem;
		padding-top: 2rem;
		padding-bottom: 2rem;

		background-color: transparent;

		display: flex;
		gap: 1rem;
		justify-content: center;

		text-align: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;

		padding: 1.6rem;
		padding-top: 0;
	}

	.no-select {
		-webkit-user-select: none;
		user-select: none;
	}

	.divider {
		width: 8px;
		border-radius: 4px;

		background-color: var(--accent-color);
	}

	@media only screen and (max-width: 40rem) {
		.divider {
			height: 8px;
			width: 100%;
		}
	}

	.nav-box {
		display: inline;
		background-color: var(--primary-color);
		color: var(--text-color);
	}

	.good,
	input.good {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
	.bad,
	input.bad {
		background-color: var(--accent-color);
		color: var(--primary-color);
	}
</style>
