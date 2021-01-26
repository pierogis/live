from flask import request, jsonify

from pierogis_live import db
from pierogis_live.models import Project
from . import api


@api.route('/projects', methods=['POST'])
def post_project():
    body = request.json

    project = Project(**body)

    # set title to file name if not in body
    if not project.title:
        project.title = project.codename

    db.session.add(project)
    db.session.commit()

    return project.to_dict()


@api.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id: str):
    project = Project.query.get(project_id)

    return project.to_dict()


@api.route('/projects', methods=['GET'])
@api.route('/projects/', methods=['GET'])
def get_projects():
    projects = Project.query.all()

    return jsonify([project.to_dict() for project in projects])


@api.route('/projects/<project_id>', methods=['PATCH'])
def patch_project(project_id: str):
    body = request.json

    project = Project.query.get(project_id)
    project.update(**body)
    db.session.commit()

    return project.to_dict()
