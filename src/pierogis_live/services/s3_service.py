import boto3
from flask import Flask

from pierogis_live.exceptions import FileSizeError

import os
import sys
import threading

from pierogis_live.models import Content


def check_progress(complete, total):
    print(complete / total)


class S3Service:

    def __init__(self, app: Flask=None):
        if app is not None:
            self.content_bucket = app.config.content_bucket
        self.s3 = boto3.client('s3')

    def init_app(self, app: Flask):
        self.content_bucket = app.config.content_bucket

    def upload_content(self, file, path: str, content: Content):
        max_size = 10 ** 6
        if file.size >= max_size:
            raise FileSizeError('File must be less than ' + max_size)

        self.s3.upload_fileobj(file, self.content_bucket, path + content.id, cb=check_progress)
