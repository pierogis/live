"""Function to create an app instance
"""

import click

from flask import Flask
from flask import render_template
from flask.cli import FlaskGroup
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from .services import StorageService
from .blueprints import register_blueprints
from .subdomains import register_subdomains

__version__ = '0.1.1'

db = SQLAlchemy()
migrate = Migrate(compare_type=True)
storage = StorageService()
jwt = JWTManager()


def create_app(stage='Base'):
    """Create a flask app and configure it
    """

    app = Flask(__name__, subdomain_matching=True)
    # TODO: Fix this config to use the given stage
    app.config.from_object('pierogis_live.config.' + stage)

    cors = CORS(app, resources={r'/*': {'origins': "http://*.{}".format(app.config['SERVER_NAME'])}})
    db.init_app(app)
    migrate.init_app(app, db)
    storage.init_app(app)
    jwt.init_app(app)

    register_blueprints(app)
    register_subdomains(app)

    from . import routes

    # print("Config:")
    # print(app.config)

    print(app.url_map)

    from .models import Content, Project, Palette, Trivia

    @app.shell_context_processor
    def make_shell_context():
        return {'db': db, 'Content': Content, 'Project': Project, 'Palette': Palette, 'Trivia': Trivia}

    return app


if __name__ == '__main__':
    app = create_app()
    app.run()
