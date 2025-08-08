<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		canonical: string;
		title: string;
		description: string;
		type: string | undefined;
		og?:
			| {
					/* should url to a 1200x600 image */
					image: string;
					alt: string;
			  }
			| undefined;
		twitter?:
			| {
					/* `summary` should be url to a 600x600 square, `summary_large_image` should be a url to 1200x600 */
					card: 'summary' | 'summary_large_image';
					/* path to the card image */
					image: string;
					/* alt text */
					alt: string;
					/* `a twitter handle for the site */
					site?: string;
					/* a twitter handle for the content creator */
					handle?: string;
			  }
			| undefined;
		children?: Snippet;
	}

	let {
		canonical,
		title,
		description,
		type,
		og = undefined,
		twitter = undefined,
		children
	}: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<link rel="canonical" href={canonical} />
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow" />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	{#if og}
		<meta property="og:image" content={og.image} />
		<meta property="og:image:alt" content={og.alt} />
	{/if}
	{#if twitter}
		<meta property="twitter:url" content={canonical} />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:card" content={twitter.card} />
		<meta name="twitter:image" content={twitter.image} />
		<meta name="twitter:image:alt" content={twitter.alt} />
		{#if twitter.site}
			<meta name="twitter:site" content={twitter.site} />
		{/if}
		{#if twitter.handle}
			<meta name="twitter:creator" content={twitter.handle} />
		{/if}
	{/if}
</svelte:head>

{@render children?.()}
