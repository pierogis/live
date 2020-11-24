"""Codenames blueprint
"""

from flask import Blueprint
from flask import render_template

# from pierogis_live.models import Content

content = Blueprint('content', __name__, url_prefix='/c',
                    template_folder='templates', static_folder='static',
                    static_url_path='/static')

from . import routes
