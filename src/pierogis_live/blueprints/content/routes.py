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
        project=project,
        tabs=tabs
    )


@content.route('/', methods=['GET'])
def projects_base():
    projects = Project.query.filter_by(project_id=None).all()

    tabs = [Tab('/', 'home'), Tab('/c', 'content')]
    return render_template('content/projects.html',
                           cdn='https://cdn.' + current_app.config['CONTENT_HOME'] + '/',
                           projects=projects,
                           tabs=tabs
                           )
