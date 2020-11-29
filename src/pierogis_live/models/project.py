from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text

from pierogis_live import db

class Project(db.Model):
    id = db.Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)

    codename = db.Column(db.String(4), nullable=False)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('project.id'))
    content = db.relationship('Content', backref=db.backref('project', remote_side=[id]))
    subprojects = db.relationship('Project', backref=db.backref('project', remote_side=[id]))

    created = db.Column(db.DateTime, index=True, default=datetime.utcnow)

    title = db.Column(db.String(80))

    palette_id = db.Column(UUID(as_uuid=True), db.ForeignKey('palette.id'))
    palette = db.relationship('Palette')

    __table_args__ = (
        db.Index(
            'uix_project_codename_project_id',
            'codename',
            'project_id',
            unique=True,
            postgresql_where=project_id.isnot(None)
        ),
        db.Index(
            'uix_project_codename',
            'codename',
            unique=True,
            postgresql_where=project_id.is_(None)
        )
    )

    def __repr__(self):
        return "<Project {}-{}>".format(str(self.id), self.codename)

    @property
    def path(self):
        # get path of parent project and append own codename
        project = self.project
        if project is not None:
            parent_path = self.project.path + '/'
        else:
            parent_path = '/'

        return parent_path + self.codename

    def to_dict(self):
        return {
            'id': self.id,
            'codename': self.codename,
            'project_id': self.project_id,
            'created': self.created,
            'title': self.title,
            'palette_id': self.palette_id,
        }