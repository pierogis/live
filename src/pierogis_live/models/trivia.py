import uuid
from sqlalchemy.dialects.postgresql import UUID

from pierogis_live import db


class Trivia(db.Model):
    id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)
    question = db.Column(db.String(120))
    answer = db.Column(db.String(60))

    palette_id = db.Column(UUID(as_uuid=True), db.ForeignKey('palette.id'))
    palette = db.relationship('Palette')

    def __repr__(self):
        return "<Trivia {}>".format(str(self.id))

    def to_dict(self):
        return {
            'id': self.id,
            'codename': self.question,
            'project_id': self.answer,
            'palette_id': self.palette_id
        }
