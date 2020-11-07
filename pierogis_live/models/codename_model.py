from mongoengine import Document

class Codename(Document):
    @classmethod
    def init_app(cls, app: Flask):
        pass

    def get(codename: str=None):
        if codename == None:
            try:
                self.db.query()