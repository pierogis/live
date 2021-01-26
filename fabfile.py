import os
import time

import boto3
import dotenv
from fabric import Connection, task, SerialGroup
# the servers where the commands are executed
from fabric.exceptions import GroupException
from paramiko.ssh_exception import NoValidConnectionsError
from setuptools import sandbox

dotenv.load_dotenv()

LAUNCH_TEMPLATE = {
    'LaunchTemplateName': 'pierogis-live',
    'Version': '17',
}


def get_stage_addresses(client, stage: str, allocated=False):
    """
    get the elastic ip addresses that are tagged with stage
    """
    # find the elastic ip for the desired stage
    elastic_ip_filters = [
        {'Name': 'domain', 'Values': ['vpc']},
        {'Name': 'tag-key', 'Values': ['pierogis-' + stage]},
    ]
    if allocated:
        elastic_ip_filters.append({'Name': 'instance-id', 'Values': ['*']})

    return client.describe_addresses(Filters=elastic_ip_filters)['Addresses']


def get_connect_kwargs(key):
    """
    get a dict from the key filename
    """
    return {
        'key_filename': [key]
    }


@task
def build(context):
    # build the package
    sandbox.run_setup('setup.py', ['clean', 'sdist'])


@task(optional=['aws_region'])
def launch(context, stage, aws_region=None):
    aws_region = aws_region or os.getenv('AWS_REGION')

    ec2_res = boto3.resource('ec2', aws_region)
    ec2_client = boto3.client('ec2', aws_region)

    allocated_elastic_ips = get_stage_addresses(ec2_client, stage, allocated=True)
    if len(allocated_elastic_ips) != 0:
        ec2_client.terminate_instances(InstanceIds=[address.get('InstanceId') for address in allocated_elastic_ips])

    elastic_ips = get_stage_addresses(ec2_client, stage, allocated=False)
    elastic_ip_count = len(elastic_ips)

    # create an instance for as many elastic ips as are tagged with this stage
    instances = ec2_res.create_instances(
        MaxCount=elastic_ip_count,
        LaunchTemplate=LAUNCH_TEMPLATE,
        MinCount=elastic_ip_count
    )

    for elastic_ip in elastic_ips:
        instance = instances.pop()
        instance.wait_until_running()
        ec2_client.associate_address(AllocationId=elastic_ip['AllocationId'],
                                     InstanceId=instance.instance_id)


def get_allocated_group(aws_region, stage, key):
    client = boto3.client('ec2', aws_region)

    allocated_elastic_ips = get_stage_addresses(client, stage, allocated=True)
    ips = [address.get('PublicIp') for address in allocated_elastic_ips]

    return SerialGroup(*ips, user='ec2-user', connect_kwargs=get_connect_kwargs(key))


@task(optional=['aws_region'])
def bootstrap(context, stage, key, aws_region=None):
    aws_region = aws_region or os.getenv('AWS_REGION')
    group = get_allocated_group(aws_region, stage, key)

    # install nginx
    group.run("sudo amazon-linux-extras install -y nginx1")

    # install python3
    group.run("sudo yum install -y python3 python3-devel gcc postgresql-devel")

    # add service executing user
    group.run("sudo useradd pierogis-live")
    group.run("sudo passwd -f -u pierogis-live")

    print("~~installing python dependencies~~")
    # create the python environment for the deployment
    group.run("sudo python3 -m venv /home/pierogis-live/venv")
    group.run("sudo /home/pierogis-live/venv/bin/pip install gunicorn")
    group.run("sudo /home/pierogis-live/venv/bin/pip install psycopg2")

    print("~~making gunicorn log files~~")
    # create gunicorn log files
    group.run("sudo mkdir /home/pierogis-live/log")
    group.run("sudo mkdir /home/pierogis-live/conf")
    group.run("sudo touch /home/pierogis-live/log/gunicorn.access.log")
    group.run("sudo touch /home/pierogis-live/log/gunicorn.error.log")

    print("~~giving nginx access to pierogis-live home~~")
    # make pierogis-live owner of their home folder
    group.run("sudo chown -R pierogis-live:pierogis-live /home/pierogis-live")

    # and give nginx service access to pierogis-live home folder
    group.run("sudo chmod 733 /home/pierogis-live/")
    group.run("sudo usermod -a -G pierogis-live nginx")

    print("~~creating dirs for nginx and gunicorn service configs~~")
    # create dir for nginx and system d config
    group.run('sudo mkdir /usr/local/lib/systemd')
    group.run('sudo mkdir /usr/local/lib/systemd/system')

    # add certificate
    group.run('python3 -m pip install --user certbot certbot-dns-cloudflare')
    group.run('mkdir certbot && mkdir certbot/config && mkdir certbot/work && mkdir certbot/logs')

    for connection in group:
        # copy service configs
        connection.put('bootstrap/certbot-{}.sh'.format(stage), 'certbot/certbot.sh')

    # certbot uses dns to validate, certbot-dns-cloudflare plugin allows using a cloudflare api token
    cloudflare_token = os.environ['CLOUDFLARE_TOKEN']
    group.run('echo dns_cloudflare_api_token = {} | tee -a certbot/cloudflare.ini'.format(cloudflare_token))
    group.run('chmod 600 certbot/cloudflare.ini')
    group.run('chmod 733 certbot/certbot.sh')

    group.run('cd certbot && ./certbot.sh')
    group.run('sudo rm -rf certbot')


@task(optional=['content_home', 'cdn_url', 'database_server_url', 'aws_region'])
def deploy(context, stage, key, content_home=None, cdn_url=None,
           database_server_url=None,
           aws_region=None):
    aws_region = aws_region or os.getenv('AWS_REGION')
    group = get_allocated_group(aws_region, stage, key)

    # figure out the package name and version
    # dist = subprocess.run('python setup.py --fullname', capture_output=True).strip()

    from pierogis_live import __version__

    filename = '{}-{}.tar.gz'.format('pierogis-live', __version__)

    print("~~copying gunicorn and nginx conf~~")

    for connection in group:
        # copy service configs
        connection.put('bootstrap/pierogis-live-nginx.conf', '/tmp/pierogis-live-nginx.conf')
        connection.put('bootstrap/pierogis-live.service', '/tmp/pierogis-live.service')

        # copy gunicorn config
        connection.put('bootstrap/gunicorn.conf.py', '/tmp/gunicorn.conf.py')

        # upload the package to the temporary folder on the server
        connection.put('dist/%s' % filename, '/tmp/%s' % filename)

    group.run("sudo mv /tmp/pierogis-live-nginx.conf /etc/nginx/conf.d/pierogis-live-nginx.conf")
    group.run("sudo mv /tmp/pierogis-live.service /usr/local/lib/systemd/system/pierogis-live.service")
    group.run("sudo mv /tmp/gunicorn.conf.py /home/pierogis-live/conf/gunicorn.conf.py")

    # add env var to .env
    server_name = os.environ['SERVER_NAME']
    content_home = content_home or os.environ['CONTENT_HOME']

    if database_server_url is None:
        database_server_url = os.environ['DATABASE_SERVER_URL']

    if cdn_url is None:
        cdn_url = os.environ['CDN_URL']

    jwt_token_location = os.environ['JWT_TOKEN_LOCATION']
    secret_key = os.environ['SECRET_KEY']

    print("~~adding env var to .env~~")

    group.run('echo SERVER_NAME={} | sudo tee -a /home/pierogis-live/.env'.format(server_name))
    group.run('echo SECRET_KEY={} | sudo tee -a /home/pierogis-live/.env'.format(secret_key))
    group.run('echo CONTENT_HOME={} | sudo tee -a /home/pierogis-live/.env'.format(content_home))
    group.run('echo DATABASE_SERVER_URL={} | sudo tee -a /home/pierogis-live/.env'.format(database_server_url))
    group.run('echo CDN_URL={} | sudo tee -a /home/pierogis-live/.env'.format(cdn_url))
    group.run('echo JWT_TOKEN_LOCATION={} | sudo tee -a /home/pierogis-live/.env'.format(jwt_token_location))
    group.run('echo STAGE={} | sudo tee -a /home/pierogis-live/.env'.format(stage))

    group.run('echo FLASK_APP={} | sudo tee -a /home/pierogis-live/.flaskenv'.format('pierogis_live'))

    # install the package in the application's virtualenv with pip
    group.run('sudo /home/pierogis-live/venv/bin/pip install /tmp/%s' % filename)

    # remove the uploaded package
    group.run('rm -r /tmp/%s' % filename)
    group.run("sudo chmod 733 /home/pierogis-live/")

    # perform an alembic db migration from one instance
    print("~~checking for migrations~~")
    migrate(group[0])

    print("~~starting server and nginx~~")

    # restart services
    group.run("sudo systemctl enable pierogis-live")
    group.run("sudo systemctl restart pierogis-live")
    group.run("sudo systemctl enable nginx")
    group.run("sudo systemctl restart nginx")


def migrate(connection):
    # make directories for migrations files
    connection.run("sudo rm -rf /tmp/migrations")
    connection.run('sudo mkdir -m 777 /tmp/migrations')
    connection.run('sudo mkdir -m 777 /tmp/migrations/versions')

    # get migration files and put them all in the ec2 instance
    version_files = os.listdir('migrations/versions')

    for filename in version_files:
        if filename == '__pycache__':
            continue
        connection.put('migrations/versions/' + filename, '/tmp/migrations/versions/' + filename)

    connection.put('migrations/alembic.ini', '/tmp/migrations/alembic.ini')
    connection.put('migrations/env.py', '/tmp/migrations/env.py')

    connection.run("sudo rm -rf /home/pierogis-live/migrations")
    connection.run("sudo mv /tmp/migrations /home/pierogis-live")
    connection.run("cd /home/pierogis-live && venv/bin/flask db upgrade")
