"""Codenames blueprint
"""

from flask import Blueprint
from flask import render_template

from pierogis_live.models import Video

codenames = Blueprint('codenames', __name__, url_prefix='/codenames',
                      template_folder='templates', static_folder='static',
                      static_url_path='/static')


@codenames.route('', methods=['GET'])
def index():
    return "These are my projects"


@codenames.route('/<codename>', methods=['GET'])
def codename(codename: str):
    C
    video = Video('http://d3ds4cnxj62erj.cloudfront.net/oh~no!/ono.mp4')
    return render_template('codenames/codename.html', video=video)
