import requests
from flask import Blueprint, request, url_for
from flask import render_template
from flask import redirect

from pierogis_live.common import Tab

base = Blueprint('base', __name__,
                 template_folder='templates', static_folder='static',
                 static_url_path='/base/static')


@base.route('/')
def index():
    return render_template('index.html', tabs=[Tab('home'), Tab('content'), Tab('kitchen')])
