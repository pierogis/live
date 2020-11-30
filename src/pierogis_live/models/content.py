from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy.dialects.postgresql import UUID

from pierogis_live import db

from .update_mixin import UpdateMixin

class MediaType(Enum):
    video = 'video'
    audio = 'audio'
    image = 'image'
    text = 'text'


class Content(db.Model, UpdateMixin):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    codename = db.Column(db.String(4), nullable=False)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('project.id'), nullable=False)

    created = db.Column(db.DateTime, index=True, nullable=False, default=datetime.utcnow)
    uploaded = db.Column(db.DateTime, index=True)

    media_type = db.Column(db.Enum(MediaType), index=True, nullable=False)
    extension = db.Column(db.String(10), nullable=False)
    title = db.Column(db.String(80))

    palette_id = db.Column(UUID(as_uuid=True), db.ForeignKey('palette.id'))
    palette = db.relationship('Palette')

    __table_args__ = (
        db.UniqueConstraint('codename', 'project_id'),
    )

    def __repr__(self):
        return "<Content {}-{}>".format(str(self.id), self.codename)

    # @property
    # def project(self):
    #     return self.query(id=self.project_id).first()

    @property
    def path(self):
        # get path of parent project and append own codename
        return self.project.path + '/'

    @property
    def file_name(self):
        return self.codename + '.' + self.extension

    @property
    def file_path(self):
        return self.path + self.file_name

    def to_dict(self):
        return {
            'id': self.id,
            'codename': self.codename,
            'project_id': self.project_id,
            'created': self.created,
            'media_type': str(self.media_type.name),
            'extension': self.extension,
            'title': self.title,
            'palette_id': self.palette_id
        }
