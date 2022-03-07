<script lang="ts" context="module">
	import { dev } from '$app/env';

	export function load({ error, status }) {
		console.error(error);
		return {
			props: {
				message: `${status}${dev ? `: ${error.message}` : ''}`
			}
		};
	}
</script>

<script>
	export let message;
</script>

{message}
