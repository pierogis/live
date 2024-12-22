<script lang="ts">
	export let canonical: string;
	export let title: string;
	export let description: string;
	export let type: string | undefined;
	export let og:
		| {
				/* should url to a 1200x600 image */
				image: string;
				alt: string;
		  }
		| undefined = undefined;
	export let twitter:
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
		| undefined = undefined;
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

<slot />
