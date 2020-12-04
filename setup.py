from setuptools import setup
from setuptools import find_packages

setup(
    name='pierogis-live',
    url='pierogis.live',
    author='Kyle Moore',
    author_email='moore.kyle39@gmail.com',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    version='0.1.0',
    include_package_data=True,
    install_requires=[
        'setuptools'
        'flask',
        'ffmpeg',
        'python-dotenv',
        'flask-cors',
        'flask-sqlalchemy',
        'flask-migrate',
        'psycopg2',
        'requests'
    ],
    entry_points={
        'console_scripts': [
            'pierogis-live=pierogis_live:cli',
        ]
    }
)
