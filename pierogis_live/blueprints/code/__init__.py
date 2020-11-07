from flask import Blueprint
from flask import render_template

code = Blueprint('code', __name__, url_prefix='/code',
                 template_folder='templates', static_folder='static', static_url_path='/static')

print(code.root_path)


@code.route('/', methods=['GET'])
def index():
    return render_template('code/index.html', **{"greeting": "This is all my code!"})
