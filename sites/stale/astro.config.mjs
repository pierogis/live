import { defineConfig } from "astro/config";

import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  integrations: [svelte(), mdx(), sitemap()],
  site: "https://stale.pierogis.live",
  adapter: vercel({
    speedInsights: {
      enabled: true,
    },
  }),
});
