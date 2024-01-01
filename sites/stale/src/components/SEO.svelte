<script lang="ts">
  export let canonical: string;
  export let title: string;
  export let description: string;
  export let type: string | undefined;
  export let og:
    | {
        image: string;
        alt: string;
      }
    | undefined = undefined;
  export let twitter:
    | {
        card: "summary" | "summary_large_image";
        domain: string;
        image: string;
        alt: string;
        site: string;
        handle?: string;
      }
    | undefined = undefined;
</script>

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
  <meta property="twitter:domain" content={twitter.domain} />
  <meta property="twitter:url" content={canonical} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:card" content={twitter.card} />
  <meta name="twitter:image" content={twitter.image} />
  <meta name="twitter:image:alt" content={twitter.alt} />
  <meta name="twitter:site" content={twitter.site} />
  {#if twitter.handle}
    <meta name="twitter:creator" content={twitter.handle} />
  {/if}
{/if}
