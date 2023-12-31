import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  integrations: [svelte(), mdx()],
  site: "https://stale.pierogis.live",
  adapter: vercel({
    speedInsights: { enabled: true },
  }),
});
