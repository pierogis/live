<header class="states-header"><a class="states-link" href="/states">states</a></header>
<slot />

<style>
	.states-header {
		padding: 4px;

		background-color: transparent;

		text-align: center;
	}

	.states-link {
		text-decoration: none;
		display: inline;
		background-color: var(--primary-color);
		color: var(--text-color);
		box-shadow: 5px 5px 0 var(--accent-color), -5px -5px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);
		padding: 4px;
	}
</style>
