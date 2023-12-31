# emporium

_a place for plates_

Simple reviews and scores for license plates

### development

- clone repo
- install dependencies
  - `cd emporium`
  - `npm install`
  - redis
- set config variables
  - copy `.env.example` as `.env` and change values
- update database
  - `npm run db:migrate` to get the latest database scheme
  - `npm run db:seed` to create initial data in the database
  - `npm run db:reset` to clear all database schema/data (not necessary) and reseed
- run server
  - `npm run dev`

words from:

- https://github.com/hugsy/stuff/random-word
- https://github.com/janester/mad_libs
- https://github.com/dominictarr/random-name
