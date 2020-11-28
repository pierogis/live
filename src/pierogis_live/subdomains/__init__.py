"""Register the subdomain blueprints to the flask app
"""

from flask import Flask

def register_subdomains(app: Flask):
    register_apis(app)

def register_apis(app: Flask):
    from .api.v0_1 import api as api_v0_1

    # app.register_blueprint(api_v0_1, url_prefix='/0.1', subdomain='api')
    app.register_blueprint(api_v0_1, url_prefix='/0.1')