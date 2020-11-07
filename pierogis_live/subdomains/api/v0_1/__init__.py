from flask import Blueprint

from pierogis_live.models import CodenameModel
from pierogis_live.services import DbService

api = Blueprint('api', __name__, url_prefix='/0.1')

# codename defines a whole incorporated project
# like DAYT0000-mu

@api.route('/codenames')
@api.route('/codenames/<codename>')
def get_codename(codename: str):
    db = DbService()

    if code_name == None:
        code = CodenameModel.get_all()

    else:
        code = CodenameModel.get(codename)

    return code.to_json()

@api.route('/codes', method=['POST'])
def create_code():
    body = request.json

    code = Code()

    body['codename']
    body['codeType']
    body['description']
    body['image_url']