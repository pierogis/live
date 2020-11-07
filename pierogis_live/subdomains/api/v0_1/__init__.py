from flask import Blueprint
from flask import request

from pierogis_live.models import File
from pierogis_live.services import DbService

api = Blueprint('api', __name__, url_prefix='/0.1')

# codename defines a whole incorporated project
# like DAYT0000-mu

# @api.route('/codenames')


@api.route('/codenames/<codename>')
def get_codename(codename: str):
    Codename.get_all()

    else:
        code = Codename.get(codename)

    return code.to_json()


@api.route('/codenames', method=['POST'])
def create_codename():
    body = request.json

    codename = Codename.from_json(body)

# @api.route('/codenames')


@api.route('/files/<filename>')
def get_files(filename: str):
    file = File.get(filename)

    return file.to_json()


@api.route('/files', method=['POST'])
def create_file():
    body = request.json

    file = File.from_json(body)

    file.create()

    file.commit()
