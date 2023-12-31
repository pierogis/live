<script lang="ts">
  import { Interactable, Layout, ThemeToggle } from "@pierogis/utensils";
  import "@pierogis/utensils/styles/pierogis.css";

  export let title: string;
  export let github: string;
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Layout>
  <Interactable slot="title">
    <div class="link-box border inset">{title}</div>
  </Interactable>

  <slot name="nav" />

  <slot />

  <footer slot="footer">
    <Interactable>
      <a class="border inset link-box" href="https://pierogis.live">live</a>
    </Interactable>
    <Interactable>
      <a class="border inset link-box" href={github}>github</a>
    </Interactable>
    <Interactable>
      <a class="border inset link-box" href="https://twitter.com/pierogis_live">
        @pierogis_live
      </a>
    </Interactable>

    <slot name="theme">
      <ThemeToggle />
    </slot>
  </footer>
</Layout>
