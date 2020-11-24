from flask import Blueprint
from flask import request

api = Blueprint('api_0.1', __name__)

from . import routes
