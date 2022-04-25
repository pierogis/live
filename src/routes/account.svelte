<script context="module">
	/** @type {import('./account').Load} */
	export async function load({ session }) {
		let redirect = '/login';
		if (session.user) {
			redirect = `/users/${session.user.serial}`;
		}
		return {
			status: 301,
			redirect
		};
	}
</script>

<script>
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	let redirect = '/login';
	if ($session.user) {
		redirect = `/users/${$session.user.serial}`;
	}
	goto(redirect);
</script>
