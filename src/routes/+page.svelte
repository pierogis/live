<script lang="ts">
	import { Card, CardsGrid, Divider, ImageDisplay, Section, ThemeToggle } from '$lib';
</script>

<Card>
	<h3>hi!</h3>

	<ImageDisplay
		width={'400px'}
		height={'200px'}
		urls={[
			'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
		]}
		alt="hello!"
	/>

	<span
		>this is a simple svelte ui/style package called <a
			style:text-decoration="underline"
			href="https://github.com/pierogis/utensils">utensils</a
		></span
	>
	<textarea class="inset">npm i --save-dev @pierogis/utensils</textarea>
</Card>

<br />
<Divider horizontal size={'4px'} />
<Section title="components">
	<CardsGrid>
		<Card>
			<Card>
				<span>a <code>Card</code> within a <code>Card</code>!</span>
			</Card>
		</Card>
		<Card>
			<CardsGrid>
				<Card>
					<span>a <code>CardsGrid</code></span>
				</Card>
				<Card>
					<span>within a <code>Card</code></span>
				</Card>
				<Card>
					<span>within a <code>CardsGrid</code>!</span>
				</Card>
			</CardsGrid>
		</Card>
		<Card>
			<span>a <code>Divider</code></span>
			<Divider size={'4px'} horizontal />
			<div class="horizontal-divider-flexbox">
				<span>can separate horizontally</span>
				<br />
				<Divider size={'4px'} />
				<br />
				<span>or vertically</span>
			</div>
		</Card>
		<Card>
			<span>a <code>Section</code></span>
			<Section title="section title">
				<span>doesn't really do much</span>
			</Section>
		</Card>
		<Card>
			<span>an <code>ImageDisplay</code></span>
			<ImageDisplay
				width={'200px'}
				height={'100px'}
				urls={[
					'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
				]}
				alt="hello!"
			/>
			<span>can definitely display an image wrapped in a border</span>
		</Card>
		<Card>
			<span>a <code>ThemeToggle</code></span>
			<ThemeToggle />
			<span>can force light or dark mode</span>
			<span>(and defaults to the os setting)</span>
		</Card>
	</CardsGrid>
</Section>

<style>
	span {
		text-align: center;
		font-family: 'Lora';
	}

	code {
		font-weight: 600;
	}

	textarea {
		width: min(90%, 24rem);
		font-family: 'Courier', monospace;
		font-size: 16px;
	}

	.horizontal-divider-flexbox {
		height: 2rem;
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	.horizontal-divider-flexbox > * {
		flex: 1 1 0px;
	}
</style>
