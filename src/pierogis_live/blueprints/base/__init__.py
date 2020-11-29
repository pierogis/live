from flask import Blueprint
from flask import render_template

base = Blueprint('base', __name__,
                 template_folder='templates', static_folder='static',
                 static_url_path='/base/static')


@base.route('/')
def index():
    return render_template('index.html')
