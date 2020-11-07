from flask import Blueprint

code = Blueprint('code', __name__, url_prefix='/code')

@code.route('/', methods=['GET'])
def index():
    return "Thsi is all my Code!"