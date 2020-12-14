from flask import Blueprint, url_for, redirect, make_response, Response, request, session
from flask_jwt_extended import unset_jwt_cookies, unset_access_cookies

from pierogis_live import jwt

trial = Blueprint('trial', __name__, url_prefix='/trial',
                  template_folder='templates', static_folder='static',
                  static_url_path='/static')

from . import routes


# no access tokens in request
@jwt.unauthorized_loader
def unauthorized(error: str):
    # destination = request.args.get('destination')

    session['destination'] = request.endpoint

    # go to the oracle
    return redirect(url_for('trial.ask_question'))


# invalid access token in request
@jwt.invalid_token_loader
def invalid_token(error: str):
    # go to the dungeon
    resp = make_response(redirect(url_for('trial.dungeon')))
    unset_jwt_cookies(resp)
    return resp, 302


# expired but valid access token in request
@jwt.expired_token_loader
def expired_token(error: str):
    # speak to the oracle
    resp = make_response(redirect(url_for('trial.ask_question')))
    unset_access_cookies(resp)
    return resp, 302
