from flask import Flask


def register_blueprints(app: Flask):
    from .code import code
    app.register_blueprint(code)

    from .music import music
    app.register_blueprint(music)
