from flask import url_for


class Tab:
    def __init__(self, name: str = None):
        self.path = url_for(name + ".index")
        self.name = name
