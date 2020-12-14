import uuid
from sqlalchemy.dialects.postgresql import UUID

from pierogis_live import db


class Claim(db.Model):
    id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)
    text = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return "<Claim {}>".format(str(self.id))

    def to_json(self):
        return {
            'id': self.id,
            'text': self.text
        }