features
- [ ] word reviews
- [ ] image upload/fetch
- [x] session passphrase tracking
- [ ] reauthenticate on update email

refactor
- [ ] make db interface shared by tables
    - [ ] methods
        - [ ] list
        - [ ] get all
        - [ ] get one
        - [ ] update
        - [ ] delete
    - [ ] provide the table

bugs
- [x] goto not available on server on `/account`
    - [x] add redirect "fallback" to endpoint
