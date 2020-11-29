from flask import Flask


def register_apis(app: Flask):
    from .v0_1 import api as api_v0_1

    app.register_blueprint(api_v0_1, url_prefix='/0.1', subdomain='api')
    # app.register_blueprint(api_v0_1, url_prefix='/0.1')
