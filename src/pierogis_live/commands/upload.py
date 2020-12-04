import os

import click
import flask
import boto3

from pierogis_live import storage


@click.command()
@click.argument('path')
@click.argument('version')
@flask.cli.with_appcontext
def upload(path, version):
    # upload bootstrap files
    bootstrap_filenames = ['pierogis-live.conf', 'pierogis-live.service', 'bootstrap.sh', 'gunicorn.conf.py']
    bootstrap_home = flask.current_app.config.get('BOOTSTRAP_HOME')
    for filename in bootstrap_filenames:
        storage.upload_static_file(os.path.join(path, 'bootstrap', filename), bootstrap_home, filename)

    # upload tar
    tar_filename = 'pierogis-live-{}.tar.gz'.format(version)
    dist_home = flask.current_app.config.get('DIST_HOME')
    storage.upload_static_file(os.path.join(path, 'dist', tar_filename), dist_home, tar_filename)
