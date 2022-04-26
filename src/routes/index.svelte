<script lang="ts">
	import { Card, Layout } from '$lib';
</script>

<Layout title={'utensils'}>
	<nav slot="nav" />

	<Card>
		<span>Hi!</span>
		<span>This is a card</span>
		<span>Part of a svelte UI library called <u>utensils</u></span>
		<textarea class="inset">npm install @pierogis/utensils</textarea>
	</Card>

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/utensils">github</a>
	</footer>
</Layout>

<style>
	textarea {
		width: 20rem;
	}
</style>
