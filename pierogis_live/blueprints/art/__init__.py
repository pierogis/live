from flask import Blueprint
from flask import render_template

art = Blueprint('art', __name__, url_prefix='/art',
                template_folder='templates', static_folder='static',
                static_url_path='/static')


@art.route('', methods=['GET'])
def index():
    return render_template('art/index.html')
