from dataclasses import dataclass

from .mongo_documents import FileDocument


@dataclass
class File:
    # ####
    # defines an overarching theme
    codename: str
    # m, c, a, b
    file_type: str
    # ##
    # two digit index
    extension: int
    description: str
    image: str
    data: dict

    @classmethod
    def get(cls):
        pass

    def post(self):
        # make a file document
        FileDocument(codename=self.codename, code_type=self.code_type,
                     extension=self.extension, description=self.description,
                     image=self.image
                     )
        pass

    @classmethod
    def from_dict(cls, **kwargs):
        return cls(
            dict['codename'],
            dict['codeType'],
            dict['description'],
            dict['image_url']
        )
