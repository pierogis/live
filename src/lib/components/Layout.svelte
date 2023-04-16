<script lang="ts">
	export let title: string;
</script>

<svelte:head>
	<title>{title}</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header>
	<a href="/"><h4 class="link-box border inset shadow">{title}</h4></a>
</header>

<slot name="nav" />

<div class="content"><slot /></div>

<slot name="footer" />

<style global>
	/* default styles */

	:root {
		--light-color: rgba(255, 240, 220, 1);
		--dark-color: rgba(58, 96, 106);

		--primary-color: var(--light-color);
		--accent-color: rgba(225, 140, 150, 1);
		--secondary-color: rgb(140, 205, 225);
		--text-color: var(--dark-color);
		--input-color: rgba(235, 245, 245, 1);

		--primary-color-st: rgba(255, 240, 220, 0.4);
		--accent-color-st: rgba(225, 140, 150, 0.4);
		--secondary-color-st: rgba(140, 205, 225, 0.4);
		--text-color-st: rgba(58, 96, 106, 0.4);

		--primary-color-t: rgba(255, 240, 220, 0);
		--accent-color-t: rgba(225, 140, 150, 0);
		--secondary-color-t: rgba(140, 205, 225, 0);
		--text-color-t: rgba(58, 96, 106, 0);

		--divider-size: 0.4rem;
	}

	:root {
		color: var(--text-color);
		background-color: var(--primary-color);
	}

	[data-theme='dark'] {
		--primary-color: var(--dark-color);
		--accent-color: rgba(225, 140, 150, 1);
		--secondary-color: rgb(140, 205, 225);
		--text-color: var(--light-color);
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

	* {
		margin: 0;
		padding: 0;
		border: 0;
		outline: 0;

		box-sizing: border-box;

		vertical-align: baseline;

		font-family: 'Lora';
		font-style: normal;
		color: var(--text-color);

		transition: color 400ms, background-color 400ms, border-color 400ms, outline-color 400ms;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-family: 'Courier', monospace;
	}

	@media only screen and (max-width: 320px) {
		* {
			font-size: 5vw;
		}
	}

	/* end default styles */

	/* global css class/element style */
	input,
	textarea {
		background-color: var(--input-color);
		padding: 0.1rem 0.2rem;

		font-size: 16px;
	}

	textarea[readonly] {
		background-color: transparent;
	}

	input[type='submit'],
	button,
	.link-box,
	code {
		background-color: var(--primary-color);
		cursor: pointer;

		font-family: 'Courier', monospace;
		font-size: 16px;
		font-weight: 600;
	}

	input[type='text'],
	input[type='email'],
	input[type='password'],
	input[type='url'],
	input[type='number'],
	input[type='submit'],
	button,
	.link-box {
		font-weight: bold;
		padding: 0.2rem 0.4rem;
	}

	input[type='text']:disabled,
	input[type='email']:disabled,
	input[type='password']:disabled,
	input[type='url']:disabled,
	input[type='number']:disabled,
	textarea:disabled {
		background-color: var(--primary-color);
		color: var(--text-color);
		text-align: center;
		text-decoration: none;
	}

	label,
	input,
	button {
		font-family: Courier, monospace;
		font-size: 16px;
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

	.border {
		border-top: solid 0.3rem var(--secondary-color);
		border-left: solid 0.3rem var(--secondary-color);
		border-bottom: solid 0.3rem var(--accent-color);
		border-right: solid 0.3rem var(--accent-color);
		border-radius: 0.6rem;
	}

	.inset {
		--inset: inset 0rem 0rem 0rem 2px var(--text-color-st);
		box-shadow: var(--inset);
	}

	.shadow {
		--shadow: 0px 0px 0.2rem 0.05rem var(--text-color-st);
		box-shadow: var(--shadow);
	}

	.inset.shadow {
		box-shadow: var(--inset), var(--shadow);
	}

	.no-select {
		-webkit-user-select: none;
		user-select: none;
	}

	.link-box {
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

	input.good::placeholder,
	input.bad::placeholder {
		color: var(--primary-color-st);
	}

	textarea {
		padding: 0.5rem;
		line-height: 1.4;

		text-align: left;

		border-radius: 0.6rem;

		font-size: 16px;
		font-weight: 400;
	}
	/* end global css class/element style */

	/* global layout style */
	body > div {
		position: relative;
		min-height: 100vh;
	}

	header {
		position: sticky;
		z-index: 2;
		top: 0;

		display: flex;
		justify-content: center;

		padding-top: 1rem;

		background-color: transparent;

		text-align: center;
	}

	nav {
		padding-top: 1rem;
		padding-bottom: 2rem;

		background-color: transparent;

		display: flex;
		gap: 0.8rem;
		justify-content: center;

		text-align: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		align-content: center;
		justify-content: center;
		flex-wrap: wrap;

		padding-top: 0;
	}

	footer {
		width: 100%;

		margin-top: 1rem;

		padding-top: 1rem;
		padding-bottom: 1rem;

		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.8rem;

		text-align: center;
		border-top: 2px dashed var(--text-color-st);
	}
</style>
