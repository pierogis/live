from flask import Blueprint

music = Blueprint('music', __name__, url_prefix='/music')

@music.route('/', methods=['GET'])
def index():
    return "Thsi is all my Music!"