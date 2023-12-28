# utensils

a set of svelte components

## install

```sh
pnpm add -D @pierogis/utensils
```

## usage

```svelte title="src/+page.ts"
<script lang="ts">
	import {
		Card,
		CardsGrid,
		Divider,
		ImageDisplay,
		Layout,
		Section,
		ThemeToggle
	} from '@pierogis/utensils';
</script>

...

<style>
	@import '@pierogis/utensils/styles/pierogis.css';
</style>
```

## release

```sh
pnpm publish --access public
```
