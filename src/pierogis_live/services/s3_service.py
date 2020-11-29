import boto3
from flask import Flask

from pierogis_live.exceptions import FileSizeError


class S3Service:

    def __init__(self, app: Flask=None, storage_client=boto3.client('s3')):
        if app is not None:
            self.init_app(app)
        self.storage_client = storage_client

    def init_app(self, app: Flask):
        self.content_home = app.config.get('CONTENT_HOME')

    def upload_content(self, file, path: str, callback=None):
        max_size = 10 ** 6
        # if file.size >= max_size:
        #     raise FileSizeError('File must be less than ' + max_size)

        self.storage_client.upload_fileobj(file, self.content_home, 'content' + path, Callback=callback)

    # @staticmethod
    # def check_progress(complete, total):
    #     print(complete / total)
