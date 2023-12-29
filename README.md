# live

all things related to [pierogis.live](https://pierogis.live)

## sites and packages

- sites
  - [`utensils`](https://utensils.pierogis.live): utensils demo app
  - [`live`](https://pierogis.live): base camp
  - [`stale`](https://stale.pierogis.live): blog
- packages
  - `@pierogis/utensils`: component library
- misc
  - `eslint-config-custom`: `eslint` configurations

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