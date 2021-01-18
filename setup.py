from setuptools import setup
from setuptools import find_packages

setup(
    name='pierogis-live',
    author='Kyle Moore',
    version='',
    author_email='moore.kyle39@gmail.com',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    include_package_data=True,
    install_requires=[
        'setuptools',
        'flask',
        'ffmpeg',
        'python-dotenv',
        'flask-cors',
        'flask-sqlalchemy',
        'flask-migrate',
        'requests'
    ],
    entry_points={
        'console_scripts': [
            'pierogis-live=pierogis_live:cli',
        ]
    },
    sass_manifests={
        'pierogis_live': ('static/sass', 'static/css', '/static/css'),
        'pierogis_live.blueprints.content': ('static/sass', 'static/css', '/c/static/css')
    },
    zip_safe=False
)
