from setuptools import setup
from setuptools import find_packages

setup(
    name='pierogis-live',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    version='0.1.0',
    include_package_data=True,
    install_requires=[
        'flask',
        'ffmpeg',
        'python-dotenv',
        'flask-cors',
        'flask-sqlalchemy',
        'flask-migrate',
        'py-postgresql',
        'requests'
    ],
)
