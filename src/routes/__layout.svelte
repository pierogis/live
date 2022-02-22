<header class="header">
	<a href="/"> <h3 class="title">Karl's Plate Emporium</h3></a>
</header>

<slot />

<style global>
	* {
		margin: 0;
		padding: 0;
		border: 0;
		outline: 0;
		font-size: 100%;
		vertical-align: baseline;
		background: transparent;
	}

	h2 {
		font-size: 1.5em;
	}

	h3 {
		font-size: 1.17em;
	}

	:root {
		--primary-color: rgba(255, 235, 205, 1);
		--accent-color: rgba(165, 85, 85, 1);
		--secondary-color: rgba(95, 158, 160, 1);
		--text-color: rgba(48, 79, 80, 1);

		--primary-color-st: rgba(255, 235, 205, 0.5);
		--accent-color-st: rgba(165, 85, 85, 0.5);
		--secondary-color-st: rgba(95, 158, 160, 0.5);
		--text-color-st: rgba(48, 79, 80, 0.5);

		--primary-color-t: rgba(255, 235, 205, 0);
		--accent-color-t: rgba(165, 85, 85, 0);
		--secondary-color-t: rgba(95, 158, 160, 0);
		--text-color-t: rgba(48, 79, 80, 0);

		--content-width: 240px;

		font-family: 'Open Sans';
		font-weight: 600;
		font-style: normal;
		font-size: 20px;
	}

	body {
		color: var(--text-color);

		background-image: radial-gradient(circle, var(--primary-color) 1px, var(--primary-color) 2px);
	}

	.header {
		position: sticky;
		top: 0;

		padding: 20px;
		box-shadow: 4px 4px 0px 0px var(--accent-color), 0px 0px 10px 2px rgba(0, 0, 0, 0.4);

		background-color: var(--primary-color);

		text-align: center;
	}

	.title {
		display: inline;
	}
</style>
