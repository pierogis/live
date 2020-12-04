import boto3
from flask import Flask

from pierogis_live.exceptions import FileSizeError


class StorageService:
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

        content_path = self.content_home.split('/', 1)

        self.storage_client.upload_fileobj(file, content_path[0], content_path[1] + path, Callback=callback)

    def upload_static_file(self, local_path, storage_home, s3_name):
        storage_path = storage_home.split('/', 1)
        self.storage_client.upload_file(local_path, storage_path[0], storage_path[1] + s3_name)

    # @staticmethod
    # def check_progress(complete, total):
    #     print(complete / total)
