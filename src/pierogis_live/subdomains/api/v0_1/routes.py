import json
import uuid

from flask import request

from pierogis_live import s3
from pierogis_live import db
from pierogis_live.models import Content
from pierogis_live.models import Palette

from . import api


@api.route('/palette', methods=['POST'])
def post_palette():
    form = request.form.to_dict()
    body = json.loads(form['json'])

    palette_id = uuid.uuid4()
    palette = Palette(id=palette_id, **body)

    db.session.add(palette)
    db.session.commit()



@api.route('/content', methods=['POST'])
def post_content():
    form = request.form.to_dict()
    body = json.loads(form['json'])

    file = request.files.get('file')

    content = Content(content_type=file.content_type.split('/')[0], **body)

    # set title to file name if not in body
    if not content.title:
        content.title = file.filename

    extension = file.filename.split('.')[-1]
    content.file_name = str(content.id) + '.' + extension

    db.session.add(content)
    db.session.commit()
    db.session.refresh(content)

    s3.upload_content(file, content.file_path)

    content.uploaded = True
    db.session.commit()

    return True