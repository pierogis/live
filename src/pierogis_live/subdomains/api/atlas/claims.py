from flask import request
from flask_jwt_extended import jwt_required

from pierogis_live import db, storage
from pierogis_live.models import Claim
from . import api


@jwt_required
@api.route('/claims', methods=['POST'])
def post_claim():
    text = request.json.get('claim')
    claim = Claim(text=text)

    db.session.add(claim)
    db.session.commit()

    return claim.to_json()