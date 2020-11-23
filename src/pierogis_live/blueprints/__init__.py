from flask import Flask


def register_blueprints(app: Flask):
    from .code import code
    app.register_blueprint(code)

    from .music import music
    app.register_blueprint(music)

    from .art import art
    app.register_blueprint(art)

    from .codenames import codenames
    app.register_blueprint(codenames)
