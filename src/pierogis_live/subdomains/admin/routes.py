from flask import current_app
from flask import request
from flask import render_template

import requests

from . import admin

@admin.route('/upload', methods=['GET'])
def upload_form():
    """Upload a file to the content store
    """

    return render_template('admin/upload.html')


@admin.route('/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']

    api_address = current_app.config['API_ADDRESS']

    body = {
        'content_type': uploaded_file.content_type.split('/')[0][0]
    }

    requests.post('http://' + api_address + '/content', data=uploaded_file, json=body)
    return True