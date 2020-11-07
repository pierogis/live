from flask import Flask

from .code import code

def register_blueprints(app: Flask):
    app.register_blueprint(code)