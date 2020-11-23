from flask import Response
from PIL import Image

from pierogis import Pierogi

from . import api

@api.route('/image')
def process_image():
    image = Image.new('RGB', (250, 250), 'black')
    pierogi = Pierogi(image)

    return Response((str(i) for i in pierogi.cook()))