"""Music blueprint
"""

from flask import Blueprint

music = Blueprint('music', __name__, url_prefix='/music',
                  template_folder='templates', static_folder='static',
                  static_url_path='/static')


@music.route('', methods=['GET'])
def index():
    return "Thsi is all my Music!"
