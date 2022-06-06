<script lang="ts" context="module">
	import { dev } from '$app/env';

	/** @type {import('./__error').Load} */
	export function load({ error, status, session }) {
		const message = `${status}${dev || session.user?.isAdmin ? `: ${error.message}` : ''}`;
		dev && console.error(message);
		return {
			props: {
				message
			}
		};
	}
</script>

<script lang="ts">
	export let message: string;
</script>

{message}
