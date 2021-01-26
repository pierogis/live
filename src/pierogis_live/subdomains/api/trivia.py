from flask import request, jsonify

from pierogis_live import db
from pierogis_live.models import Trivia
from . import api


@api.route('/trivia', methods=['POST'])
def post_question():
    question = request.json['question']
    answer = request.json['answer']

    trivia = Trivia(question=question, answer=answer)

    db.session.add(trivia)
    db.session.commit()

    return trivia.to_dict()