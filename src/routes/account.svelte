<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	let redirect = '/login';
	if ($session.user) {
		redirect = `/users/${$session.user.id}`;
	}
	goto(redirect);
</script>
