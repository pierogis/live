from flask import Blueprint
from flask import request

api = Blueprint('api', __name__)

from . import routes
