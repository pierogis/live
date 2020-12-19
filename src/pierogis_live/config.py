import os

class Base:
    # flask
    SEND_FILE_MAX_AGE_DEFAULT = 0
    SERVER_NAME = os.getenv('SERVER_NAME')
    SECRET_KEY = os.getenv('SECRET_KEY')

    # jwt
    JWT_TOKEN_LOCATION = os.getenv('JWT_TOKEN_LOCATION').split(" ")
    JWT_SESSION_COOKIE = False
    JWT_CSRF_CHECK_FORM = True

    # db
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
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

class Local(Base):
    SECRET_KEY = os.getenv('LOCAL_SECRET_KEY')
    FLASK_ENV = 'development'

    # db
    SQLALCHEMY_DATABASE_URI = os.getenv('LOCAL_DATABASE_URL')

class Dev(Base):
    SECRET_KEY = os.getenv('DEV_SECRET_KEY')

    # db
    SQLALCHEMY_DATABASE_URI = os.getenv('DEV_DATABASE_URL')

class Prod(Base):
    SECRET_KEY = os.getenv('PROD_SECRET_KEY')

    # db
    SQLALCHEMY_DATABASE_URI = os.getenv('PROD_DATABASE_URL')