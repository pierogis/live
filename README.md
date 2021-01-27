# pierogis-live

this is a website

posted and hosted content, sometimes related to `pierogis`

### pages

- content
  - projects
    - every piece of content belongs to a project
    - can contain sub projects
    - identified by a codename
    - can have a 3 color palette that changes the appearance of the site
  - content
    - posted videos, images, ~~text~~, and ~~audio~~
    - can also have its own palette


### api

- models
  - content
    - codename
    - project
    - palette
    - property to media title
  - projects
    - codename
    - content
    - palette
    - subprojects
    - property to "path" (nested project structure using codenames)
  - claims
    - dubious claims that display as a subtitle
    - can be made by anyone provided they have the clout
  - palette provide three colors to be used as the color scheme of the site
- authentication
  - JWT authenticated requests that interact with dynamodb
  - tokens from the login modal

### twitter

- chef
  - tweets dishes made by authorized users to tl
    - authorized by follow or based on the number of likes theyve accumulated
    - should it be like a currency or an authorization
    - if a user gets enough likes on tags, they get a follow
- waiter
  - mentions
    - polls for mentioned images and replies with processed image
  - dms
    - get reservations to the site
    - check balance
      - every time you ask for the check you get a brand new one and the old one doesn't work
    - post to the chef account/the website
      - if the chef bot follows an account, they are authorized to upload through the waiter
    - personality
      - "i am good at writing but can only read 5 words"
      - calls you by a rank title one of which is definitely serf
      - if you say please it reacts
      - each account has a little catchphrase, eh wot?



