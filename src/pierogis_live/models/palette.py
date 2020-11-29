import uuid

from sqlalchemy.dialects.postgresql import UUID

from pierogis_live import db


class Palette(db.Model):
    id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)
    primary = db.Column(db.String(6))
    secondary = db.Column(db.String(6))
    accent = db.Column(db.String(6))
    text = db.Column(db.String(6))
