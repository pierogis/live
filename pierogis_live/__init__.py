"""Function to create an app instance
"""

from flask import Flask
from flask import render_template
from flask_cors import CORS

from .blueprints import register_blueprints


def create_app():
    """Create a flask app and configure it
    """

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')

    CORS(app, resources={r'/*': {'origins': '*'}})

    register_blueprints(app)

    # print(app.url_map)

    @app.route('/')
    def index():
        return render_template('index.html')

    return app
