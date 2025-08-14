<script lang="ts">
	import { page } from '$app/state';
</script>

{page.status}: {page.error?.message}
