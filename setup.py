from setuptools import setup
from setuptools import find_packages

setup(
    name='pierogis-live',
    url='pierogis.live',
    author='Kyle Moore',
    author_email='moore.kyle39@gmail.com',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    version='0.1.1',
    include_package_data=True,
    setup_requires=['libsass >= 0.6.0'],
    install_requires=[
        'setuptools'
        'flask',
        'ffmpeg',
        'python-dotenv',
        'flask-cors',
        'flask-sqlalchemy',
        'flask-migrate',
        'requests',
        'pierogis'
    ],
    entry_points={
        'console_scripts': [
            'pierogis-live=pierogis_live:cli',
        ]
    },
    sass_manifests={
        'pierogis_live': ('static/sass', 'static/css', '/static/css'),
        'pierogis_live.blueprints.content': ('static/sass', 'static/css', '/c/static/css')
    }
)
