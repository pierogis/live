from flask import Flask

def register_subdomains(app: Flask):
    register_apis(app)

def register_apis(app: Flask):
    from .api.v0_1 import api as api_v0_1

    app.register_blueprint(api_v0_1)