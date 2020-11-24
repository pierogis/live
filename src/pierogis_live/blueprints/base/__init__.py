from flask import Blueprint
from flask import request
from flask import render_template
from flask import current_app

import requests

base = Blueprint('base', __name__,
                 template_folder='templates', static_folder='static',
                 static_url_path='/base/static')


@base.route('/')
def index():
    return render_template('index.html')


@base.route('/upload', methods=['GET'])
def upload_form():
    """Upload a file to the content store
    """

    return render_template('base/upload.html')


@base.route('/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']

    api_address = current_app.config['API_ADDRESS']

    body = {
        'content_type': uploaded_file.content_type.split('/')[0][0]
    }

    requests.post('http://' + api_address + '/content', data=uploaded_file, json=body)
    return True
