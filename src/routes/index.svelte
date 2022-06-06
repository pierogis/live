<script context="module" lang="ts">
	import type { Load } from './__types';
	export const load: Load = async () => {
		let redirect = '/plates';
		return {
			status: 301,
			redirect
		};
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';

	goto('/plates');
</script>
