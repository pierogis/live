<script lang="ts">
	import {
		Card,
		CardsGrid,
		Divider,
		ImageDisplay,
		Interactable,
		Section,
		Shine
	} from '@pierogis/utensils';

	import {
		CardDemo,
		CardsGridDemo,
		DividerDemo,
		ImageDisplayDemo,
		InteractableDemo,
		SectionDemo,
		ShineDemo,
		ThemeToggleDemo
	} from '$lib/demo';

	let rotateImage = false;
</script>

<Card>
	<h3>hi!</h3>

	<Interactable on:click={() => (!rotateImage ? (rotateImage = true) : (rotateImage = false))}>
		<Shine borderRadius="10px">
			<ImageDisplay
				width={'200px'}
				height={'200px'}
				urls={[
					'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
				]}
				style={rotateImage ? 'transform: rotate(90deg);' : ''}
				alt="hello!"
			/>
		</Shine>
	</Interactable>

	<span>
		this is a simple svelte ui/style package called
		<a style:text-decoration="underline" href="https://github.com/pierogis/utensils"> utensils </a>
	</span>
	<Divider size="4px" horizontal={true} margin="0" />
	<span>install with</span>
	<textarea class="inset" rows="1" cols="35">pnpm add -D @pierogis/utensils</textarea>
	<span>and include</span>
	<textarea class="inset" rows="1" cols="50"
		>{`import '@pierogis/utensils/styles/pierogis.css';`}</textarea
	>
	<span>in a top level layout script</span>
</Card>

<Divider horizontal size={'4px'} margin="0" backgroundColor="var(--secondary-color-st)" />

<Section>
	<h3 slot="title" class="section-title">components</h3>
	<CardsGrid>
		<CardDemo />
		<CardsGridDemo />
		<DividerDemo />
		<SectionDemo />
		<ImageDisplayDemo />
		<ShineDemo />
		<ThemeToggleDemo />
		<InteractableDemo />
	</CardsGrid>
</Section>

<Divider horizontal size={'4px'} margin="0" backgroundColor="var(--secondary-color-st)" />

<Section>
	<h3 slot="title" class="section-title">classes</h3>
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
					<br />
					appear like button/link box
					<br />
					(especially when used with a border)
				</div>
			</div>
		</Card>
		<Card>
			<h4>.clickable</h4>
			<div>
				<div class="clickable">cursor and jiggle on mousedown</div>
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

<style>
	h3 {
		margin: 0;
	}
	.section-title {
		text-decoration: underline;
	}
	span {
		text-align: center;
	}

	textarea {
		font-family: 'Courier', monospace;
		font-weight: bold;
		max-width: 100%;
		white-space: nowrap;
	}
</style>
