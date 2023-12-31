<script lang="ts">
  import { writable, type Writable } from "svelte/store";

  import { ThemeToggle } from "@pierogis/utensils";
  import { syncThemeAction, Theme } from "@pierogis/utensils/theme";

  const storedTheme: Writable<Theme | null> = writable();
</script>

<svelte:window use:syncThemeAction={{ storedTheme }} />
<ThemeToggle {storedTheme} />
