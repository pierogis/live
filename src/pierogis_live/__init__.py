"""Function to create an app instance
"""

from flask import Flask
from flask import render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .services import S3Service
from .blueprints import register_blueprints
from .subdomains import register_subdomains

db = SQLAlchemy()
migrate = Migrate()
s3 = S3Service()

def create_app():
    """Create a flask app and configure it
    """

    app = Flask(__name__)
    app.config.from_pyfile('config.py')

    cors = CORS(app, resources={r'/*': {'origins': "http://localhost:port"}})
    db.init_app(app)
    migrate.init_app(app, db)
    s3.init_app(app)

    register_blueprints(app)
    register_subdomains(app)

    from . import models
    from . import routes

    # print(app.url_map)

    return app
