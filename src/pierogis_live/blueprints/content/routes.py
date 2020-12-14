import os

from flask import current_app
from flask import render_template

from . import content
from pierogis_live.models import Content
from pierogis_live.models import Project
from pierogis_live.common import Tab


@content.route('/<path:path>', methods=['GET'])
def codename_project(path: str = None):
    """Render a template for all of the content under the given path
    """
    codenames = path.split('/')

    # dict with codename as key and path as value
    breadcrumbs = {}

    project_id = None
    for codename in codenames:
        project = Project.query.filter_by(codename=codename, project_id=project_id).first()
        breadcrumbs['codename'] = project.path
        project_id = project.project_id

    # tabs = [Tab('/c', 'content')]
    # tabs.extend([Tab(codename) for codename in project.path.lower().split('/')])


    return render_template(
        'content/codename.html',
        cdn=current_app.config['CDN_URL'],
        contents=project.contents,
        projects=project.subprojects,
        path=project.path,
        title=project.title,
        breadcrumbs=breadcrumbs
    )


@content.route('/', methods=['GET'])
def projects_base():
    projects = Project.query.filter_by(project_id=None).all()

    tabs = [Tab('/', 'home'), Tab('/c', 'content')]
    breadcrumbs = {'content': '/'}
    return render_template('content/codename.html',
                           cdn=current_app.config['CDN_URL'],
                           content=None,
                           projects=projects,
                           tabs=tabs,
                           path='/c',
                           title='content',
                           breadcrumbs=breadcrumbs
                           )
