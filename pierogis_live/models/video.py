import ffmpeg

class Video:
    def __init__(self, path: str):
        self.path = path
        # video = ffmpeg.probe(self.path)
        # self.width = video['streams'][0]['width']
        # self.height = video['streams'][0]['height']
