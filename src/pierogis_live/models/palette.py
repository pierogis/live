from pierogis_live import db

class Palette(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    primary = db.Column(db.String(6))
    secondary = db.Column(db.String(6))
    accent = db.Column(db.String(6))
