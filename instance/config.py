import os

from dotenv import load_dotenv
from dotenv import find_dotenv

load_dotenv(find_dotenv())

CONTENT_HOME = os.getenv('CONTENT_HOME')
FLASK_ENV = 'development'