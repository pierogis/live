<script lang="ts">
	import Editor from '#lib/shared/editor/Editor.svelte';

	let { data } = $props();
</script>

<Editor game={data.editor} />
