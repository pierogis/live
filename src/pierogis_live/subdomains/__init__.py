"""Register the subdomain blueprints to the flask app
"""

from flask import Flask

from .api import register_apis

def register_subdomains(app: Flask):
    register_apis(app)

    # from .admin import admin
    # app.register_blueprint(admin, subdomain='admin')



