import os

from dotenv import load_dotenv
from dotenv import find_dotenv

load_dotenv(find_dotenv())

CONTENT_HOME = os.getenv('CONTENT_HOME')
FLASK_ENV = 'development'
API_ADDRESS = os.getenv('API_ADDRESS')
SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
SQLALCHEMY_TRACK_MODIFICATIONS = False
SEND_FILE_MAX_AGE_DEFAULT = 0
MAX_CONTENT_LENGTH = 16 * 1024 * 1024