from setuptools import setup

setup(
    name='pierogis-live',
    packages=['pierogis_live'],
    include_package_data=True,
    install_requires=[
        'flask',
        'ffmpeg'
    ],
)