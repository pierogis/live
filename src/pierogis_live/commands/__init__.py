from flask import Flask
from flask.cli import FlaskGroup


def register_commands(cli: FlaskGroup):
    from .build import build
    from .upload import upload
    from .launch import launch

    cli.add_command(build)
    cli.add_command(upload)
    cli.add_command(launch)
