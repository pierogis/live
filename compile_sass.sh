#!/bin/bash

cd src/pierogis_live
../../dart-sass/sass --load-path=static/sass \
    static/sass:static/css \
    blueprints/content/static/sass:blueprints/content/static/css \
    blueprints/trial/static/sass:blueprints/trial/static/css