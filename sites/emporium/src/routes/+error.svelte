<script lang="ts">
	import { page } from '$app/stores';
</script>

{$page.status}: {$page.error?.message}
