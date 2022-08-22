<script lang="ts">
	export let title: string;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<header>
	<a href="/"><h3 class="link-box border inset shadow">{title}</h3></a>
</header>

<slot name="nav" />

<div class="content"><slot /></div>

<slot name="footer" />

<style global>
	/* css reset 
	   http://meyerweb.com/eric/tools/css/reset/ 
	   v2.0 | 20110126
	*/

	html,
	body,
	div,
	span,
	applet,
	object,
	iframe,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	p,
	blockquote,
	pre,
	a,
	abbr,
	acronym,
	address,
	big,
	cite,
	code,
	del,
	dfn,
	em,
	img,
	ins,
	kbd,
	q,
	s,
	samp,
	small,
	strike,
	strong,
	sub,
	sup,
	tt,
	var,
	b,
	u,
	i,
	center,
	dl,
	dt,
	dd,
	ol,
	ul,
	li,
	fieldset,
	form,
	label,
	legend,
	table,
	caption,
	tbody,
	tfoot,
	thead,
	tr,
	th,
	td,
	article,
	aside,
	canvas,
	details,
	embed,
	figure,
	figcaption,
	footer,
	header,
	hgroup,
	menu,
	nav,
	output,
	ruby,
	section,
	summary,
	time,
	mark,
	audio,
	video {
		margin: 0;
		padding: 0;
		border: 0;
		font-size: 100%;
		vertical-align: baseline;
	}
	/* HTML5 display-role reset for older browsers */
	article,
	aside,
	details,
	figcaption,
	figure,
	footer,
	header,
	hgroup,
	menu,
	nav,
	section {
		display: block;
	}
	ol,
	ul {
		list-style: none;
	}
	blockquote,
	q {
		quotes: none;
	}
	blockquote:before,
	blockquote:after,
	q:before,
	q:after {
		content: '';
		content: none;
	}
	table {
		border-collapse: collapse;
		border-spacing: 0;
	}

	/* default styles */
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

		--divider-size: 0.4rem;
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
	/* end default styles */

	/* global css class/element style */
	input[type='text'],
	input[type='email'],
	input[type='password'],
	input[type='url'],
	input[type='number'],
	textarea {
		background-color: var(--input-color);
		padding: 0.1rem 0.2rem;
	}

	textarea[readonly] {
		background-color: transparent;
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
	input[type='number']:disabled,
	textarea:disabled {
		background-color: var(--primary-color);
		color: var(--text-color);
		text-align: center;
		text-decoration: none;
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
		gap: 1rem;
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

		padding-bottom: 6rem;
		padding-top: 0;
	}

	footer {
		position: absolute;
		bottom: 0;

		width: 100%;

		padding-top: 1rem;
		padding-bottom: 1rem;

		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;

		text-align: center;
		border-top: 2px dashed var(--text-color-st);
	}
</style>
