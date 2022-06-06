<script lang="ts">
	import { Card, Layout } from '$lib';
	import ImageDisplay from '$lib/ImageDisplay.svelte';
</script>

<Layout title={'utensils'}>
	<nav slot="nav" />

	<Card>
		<span>Hi!</span>

		<ImageDisplay
			small={false}
			urls={[
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
			]}
			alt="hello!"
		/>

		<span>This is a Card</span>
		<span
			>Part of a simple svelte ui/style library called <a
				style:text-decoration="underline"
				href="https://github.com/pierogis/utensils">utensils</a
			></span
		>
		<textarea class="inset">npm i --save-dev @pierogis/utensils</textarea>
	</Card>

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
	</footer>
</Layout>

<style>
	textarea {
		width: 24rem;
	}
</style>
