from flask import Flask


def register_blueprints(app: Flask):
    from .base import base
    app.register_blueprint(base)

    from .content import content
    app.register_blueprint(content)

    from .trial import trial
    app.register_blueprint(trial)
