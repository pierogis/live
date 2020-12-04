"""Function to create an app instance
"""

import click

from flask import Flask
from flask import render_template
from flask.cli import FlaskGroup
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .services import StorageService
from .blueprints import register_blueprints
from .subdomains import register_subdomains
from .commands import register_commands

db = SQLAlchemy()
migrate = Migrate(compare_type=True)
storage = StorageService()

def create_app():
    """Create a flask app and configure it
    """

    app = Flask(__name__, subdomain_matching=True)
    app.config.from_pyfile('config.py')

    cors = CORS(app, resources={r'/*': {'origins': "http://*.{}".format(app.config['SERVER_NAME'])}})
    db.init_app(app)
    migrate.init_app(app, db)
    storage.init_app(app)

    register_blueprints(app)
    register_subdomains(app)

    from . import routes

    # print(app.url_map)

    from .models import Content, Project, Palette
    @app.shell_context_processor
    def make_shell_context():
        return {'db': db, 'Content': Content, 'Project': Project, 'Palette': Palette}

    return app

cli = FlaskGroup(create_app=create_app)

register_commands(cli)

if __name__ == '__main__':
    cli()