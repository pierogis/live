import os
from setuptools import sandbox

import click
import flask


@click.command()
@flask.cli.with_appcontext
def build():
    # sandbox.run_setup('setup.py', ['clean', 'build_sass', 'sdist'])
    sandbox.run_setup('setup.py', ['clean', 'sdist'])
