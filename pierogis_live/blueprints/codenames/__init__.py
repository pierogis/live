"""Codenames blueprint
"""

from flask import Blueprint
from flask import render_template

codenames = Blueprint('codenames', __name__, url_prefix='/codenames',
                  template_folder='templates', static_folder='static',
                  static_url_path='/static')


@codenames.route('', methods=['GET'])
def index():
    return "These are my projects"

@codenames.route('/<codename>', methods=['GET'])
def codename(codename: str):
    return render_template('codenames/codename.html')