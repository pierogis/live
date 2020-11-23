"""Function to create an app instance
"""

from flask import Flask
from flask import render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .blueprints import register_blueprints
from .subdomains import register_subdomains

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Create a flask app and configure it
    """

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')

    CORS(app, resources={r'/*': {'origins': '*'}})
    db.init_app(app)
    migrate.init_app(app, db)

    register_blueprints(app)
    # register_subdomains(app)

    # print(app.url_map)

    from pierogis_live import models

    @app.route('/')
    def index():
        return render_template('index.html')

    return app
