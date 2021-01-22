import os


class base:
    # flask
    SEND_FILE_MAX_AGE_DEFAULT = 0
    SERVER_NAME = os.getenv('SERVER_NAME')
    SECRET_KEY = os.getenv('SECRET_KEY')

    # jwt
    JWT_TOKEN_LOCATION = os.getenv('JWT_TOKEN_LOCATION').split(" ")
    JWT_SESSION_COOKIE = False
    JWT_CSRF_CHECK_FORM = True

    # db
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 24 * 1024 * 1024 * 1024

    # s3
    CONTENT_HOME = os.getenv('CONTENT_HOME')
    BOOTSTRAP_HOME = os.getenv('BOOTSTRAP_HOME')
    DIST_HOME = os.getenv('DIST_HOME')

    # cdn
    CDN_URL = os.getenv('CDN_URL')

    # aws
    AWS_REGION = os.getenv('AWS_REGION')
    AWS_VPC_ID = os.getenv('AWS_VPC_ID')
    AWS_SUBNET_ID = os.getenv('AWS_SUBNET_ID')


class local(base):
    FLASK_ENV = 'development'
    # db
    SQLALCHEMY_DATABASE_URI = os.path.join(os.getenv('DATABASE_SERVER_URL'), "local")


class dev(base):
    # db
    SQLALCHEMY_DATABASE_URI = os.path.join(os.getenv('DATABASE_SERVER_URL'), 'dev')


class live(base):
    FLASK_ENV = 'production'
    # db
    SQLALCHEMY_DATABASE_URI = os.path.join(os.getenv('DATABASE_SERVER_URL'), 'live')
