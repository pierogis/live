# ci/cd

uses github actions to run fabric scripts to deploy to `dev` and `live` environments

**fabric**

- build
  - build the package using `setuptools.sandbox`
- launch
  - terminate instances associated to elastic ips tagged with a given stage
  - create instances for each newly dissociated elastic ip
  - associate instance with elastic ip
- bootstrap
  - install nginx, python, postgres (drivers)
  - create the server user
  - create a python env and install packages for running the server
  - get an ssl token from certbot
- deploy
  - copy config from repo to locations on instance
  - copy sdist to instance
  - create a .env file from env variables and options on computer in charge of deploying
  - make db migration if needed
  - run nginx and the flask server, bound to a socket

**workflows**

- ci-dev.yml
   - triggered by push to dev, a github worker will orchestrate creation of several instances
   - compiles sass, builds sdist, uploads to aws s3
   - launches an ec2 instances and associates with an elastic ip for the stage
   - bootstrapped with python, nginx, other non python dependencies
   - package is deployed, running with a systemd service, proxied by nginx

- ci-live.yml
   - triggered on tag pushed to github
   - same as ci-dev, but runs on pierogis.live

### migrations

uses `flask-migrate` / `alembic` / `sqlalchemy` to track changes to db models in the repo

- `flask migrate -m ""`
  - automatically creates a version python script containing commands to update the db
- `flask upgrade`
  - updates database using sqlalchemy url in env, version scripts in repo, and version table in db