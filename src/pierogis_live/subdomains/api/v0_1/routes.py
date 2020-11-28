import json
import uuid

from flask import request

from pierogis_live import s3
from pierogis_live.models import Content
from pierogis_live.models import Palette

from . import api


@api.route('/content', methods=['POST'])
def post_content():
    form = request.form.to_dict()
    body = json.loads(form['json'])
    file = request.files.get('file')

    content_id = uuid.uuid4()
    content = Content(id=content_id, **body)
    extension = file.filename.split('.')[-1]
    content.file_name = str(content.id) + '.' + extension
    s3.upload_content(file, content.file_path)

    return True