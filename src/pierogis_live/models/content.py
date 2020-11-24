from datetime import datetime
from enum import Enum

from pierogis_live import db

class ContentType(Enum):
    video = 'v'
    audio = 'a'
    image = 'i'
    text = 't'

class Content(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    codename = db.Column(db.String(4), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('content.id'))
    subcontent = db.relationship('Content', backref='project', remote_side=id)

    content_type = db.Column(db.Enum(ContentType), index=True, nullable=False)
    created = db.Column(db.DateTime, index=True, default=datetime.utcnow)

    palette = db.Column(db.Integer, db.ForeignKey('palette.id'), index=True)

    title = db.Column(db.String(80))
    url = db.Column(db.String(120))

    __table_args__ = (
        db.UniqueConstraint('codename', 'project_id'),
    )

    def __repr__(self):
        return "<Content {}-{}>".format(self.parent, self.codename)

    @classmethod
    def from_json(cls, json: dict, file):
        # upload file to s3 to be served with cloudfront
        # get cloudfront address back

        url = "cdn.pierogis.live"

        return cls(url=url, **json)

