<script>
	import { Card, CardsGrid, ImageDisplay, Layout } from '@pierogis/utensils';
</script>

<Layout title="pierogis">
	<nav slot="nav" />

	<p>pierogis live multimedia experiences</p>
	<br />
	<CardsGrid>
		<Card>
			<a href="https://emporium.pierogis.live">
				<ImageDisplay
					small={false}
					urls={['https://emporium.pierogis.live/logo.svg']}
					alt="emporium"
				/>
			</a>
			<a href="https://emporium.pierogis.live">emporium</a>
		</Card>
		<Card>
			<a href="https://kitchen.pierogis.live">
				<ImageDisplay
					small={false}
					urls={['https://kitchen.pierogis.live/logo.svg']}
					alt="kitchen"
				/>
			</a>
			<a href="https://kitchen.pierogis.live">kitchen</a>
		</Card>
		<Card>
			<a href="https://colors.pierogis.live">
				<ImageDisplay small={false} urls={['https://colors.pierogis.live/logo.svg']} alt="colors" />
			</a>
			<a href="https://colors.pierogis.live">colors</a>
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
