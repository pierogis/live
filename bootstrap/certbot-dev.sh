#!/bin/bash

~/.local/bin/certbot certonly \
    --email admin@pierogis.live \
    --server https://acme-staging-v02.api.letsencrypt.org/directory \
    --dry-run \
    --agree-tos \
    --non-interactive \
    --dns-cloudflare \
    --dns-cloudflare-credentials cloudflare.ini \
    --config-dir config \
    --work-dir work \
    --logs-dir logs \
    -d '*.pierogis.live' -d '*.pierogis.dev'
