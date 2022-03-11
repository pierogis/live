# plates

words from:
- https://github.com/hugsy/stuff/random-word
- https://github.com/janester/mad_libs
- https://github.com/dominictarr/random-name

### development

- clone repo
- install dependencies
  - `cd emporium`
  - `npm install`
- install redis
- install postgres
- set config variables
  - copy `.env.example`  as `.env` and change values
- update database
  - `npm run db:migrate` to get the latest database scheme
  - `npm run db:seed` to create initial data in the database
  - `npm run db:reset` to clear all database schema/data (not necessary)
- run server
  - `npm run dev`

