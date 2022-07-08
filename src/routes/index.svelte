<script>
	import { Card, CardsGrid, ImageDisplay, Layout } from '@pierogis/utensils';
</script>

<Layout title="pierogis">
	<nav slot="nav" />

	<p>pierogis live multimedia experiences</p>
	<br />
	<CardsGrid>
		<Card>
			<iframe title="emporium" src="https://emporium.pierogis.live" />
			<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		</Card>
		<Card>
			<iframe title="kitchen" src="https://kitchen.pierogis.live" />
			<a class="border shadow inset link-box" href="https://kitchen.pierogis.live">kitchen</a>
		</Card>
		<Card>
			<iframe title="colors" src="https://colors.pierogis.live" />
			<a class="border shadow inset link-box" href="https://colors.pierogis.live">colors</a>
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
