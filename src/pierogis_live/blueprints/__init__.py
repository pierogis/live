from flask import Flask


def register_blueprints(app: Flask):
    from .base import base
    app.register_blueprint(base)

    from .code import code
    app.register_blueprint(code)

    from .music import music
    app.register_blueprint(music)

    from .art import art
    app.register_blueprint(art)

    from .content import content
    app.register_blueprint(content)
