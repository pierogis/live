<script lang="ts" context="module">
	import { dev } from '$app/env';

	/** @type {import('./__error').Load} */
	export function load({ error, status }) {
		const message = `${status}${dev ? `: ${error.message}` : ''}`;
		dev && console.error(message);
		return {
			props: {
				message
			}
		};
	}
</script>

<script>
	export let message;
</script>

{message}
