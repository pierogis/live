import json
import uuid

from flask import request

from pierogis_live import db
from pierogis_live.models import Palette

from . import api


@api.route('/palette', methods=['POST'])
def post_palette():
    form = request.form.to_dict()
    body = json.loads(form['json'])

    palette_id = uuid.uuid4()
    palette = Palette(id=palette_id, **body)

    db.session.add(palette)
    db.session.commit()


from . import content
from . import projects
from . import trivia
from . import claims
from . import pierogis
