from flask import Blueprint
from flask import request

api = Blueprint('atlas', __name__)

from . import routes
