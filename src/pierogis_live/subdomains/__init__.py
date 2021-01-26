"""Register the subdomain blueprints to the flask app
"""

from flask import Flask

def register_subdomains(app: Flask):
    from api import api
    app.register_blueprint(api, subdomain='api')

    # from .admin import admin
    # app.register_blueprint(admin, subdomain='admin')

    from .kitchen import kitchen
    app.register_blueprint(kitchen, subdomain='kitchen')
