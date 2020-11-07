from mongoengine import Document
from mongoengine import StringField
from mongoengine import URLField
from mongoengine import ImageField


class FileDocument(Document):
    """Mongoengine document for a file
    """

    codename = StringField(max_length=4)
    code_type = StringField(choices=['m', 'c', 'a', 'b'])
    extension = StringField(max_length=3, min_length=3)
    description = StringField()
    image = ImageField()
    

class MusicFileDocument(FileDocument):
    music_file_url = URLField()
