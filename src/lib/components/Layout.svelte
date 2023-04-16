<script lang="ts">
	export let title: string;
</script>

<svelte:head>
	<title>{title}</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header>
	<a href="/"><h4 class="link-box border inset shadow">{title}</h4></a>
</header>

<slot name="nav" />

<div class="content"><slot /></div>

<slot name="footer" />

<style>
	@import 'style';
</style>
