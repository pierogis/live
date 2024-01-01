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
  - `eslint-config-custom`: `eslint` configurations
  - `ui`: component recipes

## release

- push with necessary changesets
- gh action will make a version PR
- create prerelease

```
pnpm changeset pre enter next
pnpm changeset version
pnpm changeset publish
```

- merge version pr and pull
- publish release

```
pnpm changeset publish
```