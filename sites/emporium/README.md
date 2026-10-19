# emporium

_a place for plates_

Simple reviews and scores for license plates

### development

- install dependencies from the repo root with `pnpm install`
- set config variables
  - copy `.env.example` as `.env` and change values
- run the dev server with `pnpm -F emporium dev` (port 5175)
  - the cloudflare adapter emulates the `DB` (D1) and `KV` bindings locally in `.wrangler/state`
- update the local database
  - `pnpm -F emporium db:migrate:local` to apply the migrations
  - `pnpm -F emporium db:seed:local` to create initial data
- after a change to `src/db/schema.ts`, `pnpm -F emporium db:generate` writes a new migration
- `pnpm -F emporium db:migrate:prod` applies the migrations to the production database

words from:

- https://github.com/hugsy/stuff/random-word
- https://github.com/janester/mad_libs
- https://github.com/dominictarr/random-name
