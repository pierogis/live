<script context="module" lang="ts">
	import type { Load } from './__types/account';
	export const load: Load = async ({ session }) => {
		let redirect = '/login';
		if (session.user) {
			redirect = `/users/${session.user.serial}`;
		}
		return {
			status: 301,
			redirect
		};
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	let redirect = '/login';
	if ($session.user) {
		redirect = `/users/${$session.user.serial}`;
	}
	goto(redirect);
</script>
