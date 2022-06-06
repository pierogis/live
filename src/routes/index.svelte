<script>
	import { Card, CardsGrid, ImageDisplay, Layout } from '@pierogis/utensils';
</script>

<Layout title="pierogis">
	<nav slot="nav" />

	<CardsGrid>
		<Card>
			<a href="https://emporium.pierogis.live/logo.svg">
				<ImageDisplay small={false} urls={[]} alt="emporium" />
			</a>
			<span>emporium</span>
		</Card>
		<Card>
			<a href="https://kitchen.pierogis.live/logo.svg">
				<ImageDisplay small={false} urls={[]} alt="kitchen" />
			</a>
			<span>kitchen</span>
		</Card>
	</CardsGrid>

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/live">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
	</footer>
</Layout>
