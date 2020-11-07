"""Function to create an app instance
"""

from flask import Flask

def create_app():
    """Create a flask app and configure it
    """

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')

    register(app)

    @app.route('/')
    def index():
        return 'Welcome child'

    return app

def register(app):
    from .music import music
    from .code import code

    app.register_blueprint(code)
    app.register_blueprint(music)