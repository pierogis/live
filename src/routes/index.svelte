<script context="module">
	/** @type {import('./index').Load} */
	export async function load() {
		let redirect = '/plates';
		return {
			status: 301,
			redirect
		};
	}
</script>

<script>
	import { goto } from '$app/navigation';

	goto('/plates');
</script>
