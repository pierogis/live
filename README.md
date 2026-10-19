# live

all things related to [pierogis.live](https://pierogis.live)

## sites and packages

- sites
  - [`careers`](https://careers.pierogis.live): start working
  - [`colors`](https://colors.pierogis.live): palettes
  - [`emporium`](https://emporium.pierogis.live): plates
  - [`live`](https://pierogis.live): base camp
  - [`stale`](https://stale.pierogis.live): blog
  - [`utensils`](https://utensils.pierogis.live): table manners
- packages
  - `@pierogis/utensils`: component library
  - `ui`: component recipes

## develop

Needs node 24.21 (`.node-version`) and pnpm 12. Install the workspace from the root:

```sh
pnpm install
```

Start a dev server for one site:

```sh
pnpm -F careers dev   # 5173
pnpm -F colors dev    # 5174
pnpm -F emporium dev  # 5175, see sites/emporium/README.md for the database
pnpm -F live dev      # 5176
pnpm -F utensils dev  # 5177
pnpm -F stale dev     # 5178
```

The sites resolve `@pierogis/utensils` and `ui` from source, so edits to the packages reach a running dev server without a build.

Before a push:

```sh
pnpm lint    # prettier and eslint
pnpm check   # svelte-check and astro check
pnpm build
```

Shared dependency versions live in the `catalog` of `pnpm-workspace.yaml`.

## deploy

A push to `main` deploys each affected site to Cloudflare with `wrangler deploy` (`.github/workflows/deploy.yml`). A manual run of the `deploy` workflow deploys the checked sites at a ref.

The workflow needs the `CLOUDFLARE_ACCOUNT_ID` repository variable and the `CLOUDFLARE_API_TOKEN` secret. To deploy a site by hand:

```sh
pnpm -F stale build && pnpm -C sites/stale exec wrangler deploy
```

## release

`@pierogis/utensils` is published to npm with changesets. The sites are not versioned.

- push with necessary changesets (`pnpm changeset`)
- the `release` workflow makes a version PR
- merge the version PR, and the `release` workflow publishes the package

To publish a prerelease by hand:

```sh
pnpm changeset pre enter next
pnpm changeset version
pnpm changeset publish
```
