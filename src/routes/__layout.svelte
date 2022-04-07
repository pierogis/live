<header>
	<a href="/"><h3 class="link-box border inset shadow">careers</h3></a>
</header>

<div class="content"><slot /></div>

<footer>
	<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
		@pierogis_live
	</a>
	<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
	<a class="border shadow inset link-box" href="https://github.com/pierogis/careers">github</a>
</footer>

<style global>
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

	.link-box {
		background-color: var(--primary-color);
		color: var(--text-color);
		font-weight: bold;
		padding: 0.2rem 0.4rem;
	}

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

		padding-bottom: 10rem;
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

	footer > * {
		font-size: 0.8rem;
	}
</style>
