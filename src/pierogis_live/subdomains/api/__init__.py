from flask import Flask


def register_apis(app: Flask):
    from .atlas import api as api_atlas

    app.register_blueprint(api_atlas, url_prefix='/atlas', subdomain='api')
    app.register_blueprint(api_atlas, url_prefix='/latest', subdomain='api')
    # app.register_blueprint(api_v0_1, url_prefix='/0.1')
