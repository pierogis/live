from flask import request
import boto3

from pierogis_live.models import Content
from pierogis_live.models import Palette
from pierogis_live.services import S3Service

from . import api


@api.route('/content', methods=['POST'])
def post_content():
    body = request.json
    file = request.files['file']

    content = Content.from_json(body, file)

    parent_id = content.parent_id
    path = ''
    while parent_id is not '':
        path += parent_id + '/'

    s3 = S3Service()
    s3.upload_content(file, path, content)
