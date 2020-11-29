from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text

from pierogis_live import db


class FileType(Enum):
    video = 'v'
    audio = 'a'
    image = 'i'
    text = 't'


class Content(db.Model):
    id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)

    codename = db.Column(db.String(4), nullable=False)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('content.id'))
    subcontent = db.relationship('Content', backref=db.backref('project', remote_side=[id]))

    content_type = db.Column(db.Enum(FileType), index=True, nullable=False)
    created = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    uploaded = db.Column(db.Boolean, index=True, default=False)

    title = db.Column(db.String(80))
    file_name = db.Column(db.String(120))

    palette_id = db.Column(UUID(as_uuid=True), db.ForeignKey('palette.id'))
    palette = db.relationship('Palette')

    __table_args__ = (
        db.UniqueConstraint('codename', 'project_id'),
    )

    def __repr__(self):
        return "<Content {}-{}>".format(str(self.id), self.codename)

    @property
    def project(self):
        return self.query(id=self.project_id).first()

    @property
    def path(self):
        # get path of parent project and append own codename
        project = self.project
        if project is not None:
            parent_path = self.project.path + '/'
        else:
            parent_path = '/'

        return parent_path + self.codename

    @property
    def file_path(self):
        return "{}/{}".format(self.path, self.file_name)

    # @classmethod
    # def from_json(cls, json: dict, file):
    #     return cls(**json)
    #
    # def to_json(self):
    #     # upload file to s3 to be served with cloudfront
    #     # get cloudfront address back
    #
    #     return self.__dict__
