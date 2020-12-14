import datetime
import json

from flask import request

from pierogis_live import db, storage
from pierogis_live.models import Project, Content
from . import api


@api.route('/content', methods=['POST'])
def post_content():
    form = request.form.to_dict()
    body = json.loads(form['json'])

    file = request.files.get('file')

    content = Content(media_type=file.content_type.split('/')[0], **body)

    # set title to file name if not in body
    if not content.title:
        content.title = file.filename

    content.extension = file.filename.split('.')[-1]

    db.session.add(content)
    db.session.commit()

    storage.upload_content(file, content.file_path)

    content.uploaded = datetime.utcnow()
    db.session.commit()

    return content.to_dict()
