from flask import Blueprint

admin = Blueprint('mainframe', __name__,
                  template_folder='templates', static_folder='static',
                  static_url_path='/mainframe/static')

from .routes import *
