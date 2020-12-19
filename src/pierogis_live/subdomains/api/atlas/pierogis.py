import io

from PIL import Image
from flask import request, send_file

from pierogis import Pierogi

from . import api


@api.route('/pierogis', methods=['POST'])
def process_pierogi():
    image = request.files['file']

    image.seek(0)
    image = Image.open(image)

    pierogi = Pierogi(image=image)

    file_object = io.BytesIO()

    # write PNG in file-object
    image.save(file_object, 'PNG')

    return send_file(file_object, attachment_filename='output.png')
