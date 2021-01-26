import time

from flask import request, url_for, redirect, session, make_response, current_app
from flask import render_template
import requests
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, jwt_optional, \
    get_csrf_token, get_raw_jwt, get_current_user
from flask_jwt_extended.tokens import encode_access_token
from flask_jwt_extended.view_decorators import _decode_jwt_from_request
from sqlalchemy import func

from pierogis_live.models import Trivia
from . import trial


# main landing page for trial blueprint
@trial.route('/', methods=['GET'])
def index():
    return render_template('trial/index.html')


# route for filling out a claim (banner subtitle)
# the chicken was raw!
@trial.route('/claim', methods=['GET'])
@jwt_optional
def input_claim():
    claim = request.args.get('claim')

    if claim:
        session['claim'] = claim
    else:
        claim = session.get('claim')

    csrf_token = (get_raw_jwt() or {}).get("csrf")
    return render_template(
        'trial/claim.html', claim=claim, csrf_token=csrf_token,
        pierogi_url=url_for('trial.static', filename='pierogi_master.png'),
    )


# post a claim form input
@trial.route('/claim', methods=['POST'])
@jwt_required
def review_claim():
    # get claim from the form
    claim = request.form.get('claim')

    if 'fuck' in claim:
        return redirect(url_for('trial.dungeon'))

    _decode_jwt_from_request('access')

    access_token = request.cookies['access_token_cookie']
    requests.post(url_for('atlas.post_claim'), json={'claim': claim}, headers={'Authentication': access_token})

    return redirect(url_for('trial.index'), 302)


@trial.route('/dungeon')
def dungeon():
    return render_template('trial/dungeon.html', pierogi_url='static/pierogi_master.png')

# @trial.route('/dungeon_monologue')
# def dungeon_monologue():
#     def generate():
#         yield "i will not harm you"
#         time.sleep(5)
#         yield "I will harm you"
#     return Response(generate())
