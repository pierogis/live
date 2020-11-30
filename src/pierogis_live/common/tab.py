class Tab:
    def __init__(self, path: str, name: str = None):
        if not name:
            name = path

        self.path = path
        self.name = name
