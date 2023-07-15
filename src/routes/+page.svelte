<script lang="ts">
	import { Card, CardsGrid, Divider, ImageDisplay, Section } from '$lib';

	import {
		CardDemo,
		CardsGridDemo,
		DividerDemo,
		ImageDisplayDemo,
		InteractableDemo,
		SectionDemo,
		ThemeToggleDemo
	} from '$lib/demo';
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

	<span>
		this is a simple svelte ui/style package called
		<a style:text-decoration="underline" href="https://github.com/pierogis/utensils"> utensils </a>
	</span>
	<Divider size="4px" horizontal={true} margin="0" />
	<span>install with</span>
	<textarea class="inset" rows="1" cols="35">npm i --save-dev @pierogis/utensils</textarea>
	<span>and include</span>
	<textarea class="inset" rows="1" cols="50"
		>{`@import '@pierogis/utensils/styles/pierogis.css';`}</textarea
	>
	<span>in a top level style</span>
</Card>

<br />

<Divider horizontal size={'4px'} />

<Section title="components">
	<CardsGrid>
		<CardDemo />
		<CardsGridDemo />
		<DividerDemo />
		<SectionDemo />
		<ImageDisplayDemo />
		<ThemeToggleDemo />
		<InteractableDemo />
	</CardsGrid>
</Section>

<br />

<Divider horizontal size={'4px'} />

<Section title="styles">
	<CardsGrid>
		<Card>
			<h4>.border</h4>
			<div class="border">wraps anything with this cheesy two tone border</div>
		</Card>
		<Card>
			<h4>.inset</h4>
			<div class="inset">applies an inner box shadow</div>
		</Card>
		<Card>
			<h4>.shadow</h4>
			<div class="shadow">applies an outer box shadow</div>
		</Card>
		<Card>
			<h4>.link-box</h4>
			<div>
				<div class="link-box">
					useful for making normal text (<code>span</code>, <code>a</code>)
				</div>
				<div class="link-box">appear like button/link box</div>
			</div>
		</Card>
		<Card>
			<h4>.border.inset.shadow.link-box</h4>
			<div class="link-box border inset shadow">they work well when combined</div>
		</Card>
		<Card>
			<h4>.good / .bad</h4>
			<div class="good">used for affirmative</div>
			<div class="bad">and negative signals</div>
		</Card>
	</CardsGrid>
</Section>

<br />

<style global>
	span {
		text-align: center;
	}

	textarea {
		font-family: 'Courier', monospace;
		font-weight: bold;
	}
</style>
