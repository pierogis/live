import os

from flask import current_app
from flask import render_template

from . import content
from pierogis_live.models import Content
from pierogis_live.models import Project
from pierogis_live.common import Tab


@content.route('/<path>', methods=['GET'])
def codename_project(path: str = None):
    """Render a template for all of the content under the given path
    """
    codenames = path.split('/')

    project_id = None
    for codename in codenames:
        project = Project.query.filter_by(codename=codename, project_id=project_id).first()
        project_id = project.project_id

    tabs = [Tab('/c', 'content')]
    tabs.extend([Tab(codename) for codename in project.path.lower().split('/')])
    return render_template(
        'content/codename.html',
        cdn='https://cdn.pierogis.live/',
        contents=project.contents,
        projects=project.subprojects,
        tabs=tabs,
        path=project.path,
        title=project.title
    )


@content.route('/', methods=['GET'])
def projects_base():
    projects = Project.query.filter_by(project_id=None).all()

    tabs = [Tab('/', 'home'), Tab('/c', 'content')]
    return render_template('content/codename.html',
                           cdn=current_app.config['CDN_URL'],
                           content=None,
                           projects=projects,
                           tabs=tabs,
                           path='/c',
                           title='content'
                           )
