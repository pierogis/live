import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  site: "https://stale.pierogis.live",
  output: "server",
  adapter: vercel({ speedInsights: { enabled: true } }),
});
