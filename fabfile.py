import os
import subprocess

import boto3
import flask
from fabric import Connection, task, SerialGroup
import dotenv

# the servers where the commands are executed
from setuptools import sandbox

dotenv.load_dotenv()


@task
def build(context):
    # build the package
    sandbox.run_setup('setup.py', ['clean', 'sdist'])


@task(optional=['aws_region', 'aws_subnet_id', 'count'])
def launch(context, stage, aws_region=None, aws_subnet_id=None, count=None):
    aws_region = aws_region or os.getenv('AWS_REGION')
    aws_subnet_id = aws_subnet_id or os.getenv('AWS_SUBNET_ID')
    count = count or 1

    res = boto3.resource('ec2', aws_region)
    client = boto3.client('ec2', aws_region)

    allocated_addresses = get_stage_addresses(client, stage, allocated=True)
    if len(allocated_addresses) != 0:
        client.terminate_instances(InstanceIds=[address.get('InstanceId') for address in allocated_addresses])

    instances = res.create_instances(
        MaxCount=count,
        LaunchTemplate={
            'LaunchTemplateName': 'pierogis-live',
            'Version': '8',
        },
        MinCount=count,
        SubnetId=aws_subnet_id
    )

    addresses = get_stage_addresses(client, stage, allocated=False)

    for i in range(count):
        instance = instances[i]
        address = addresses[i]

        instance.wait_until_running()

        client.associate_address(AllocationId=address['AllocationId'],
                                 InstanceId=instance.instance_id)


@task(optional=['aws_region'])
def bootstrap(context, stage, aws_region=None):
    aws_region = aws_region or os.getenv('AWS_REGION')
    client = boto3.client('ec2', aws_region)

    allocated_addresses = get_stage_addresses(client, stage, allocated=True)
    ips = [address.get('PublicIp') for address in allocated_addresses]

    group = SerialGroup(*ips, user='ec2-user')

    # install nginx
    group.run("sudo amazon-linux-extras install -y nginx1")

    # install python3
    group.run("sudo yum install -y python3 python3-devel gcc postgresql-devel")

    # add service executing user
    group.run("sudo useradd pierogis-live")
    group.run("sudo passwd -f -u pierogis-live")

    # create the python environment for the deployment
    group.run("sudo python3 -m venv /home/pierogis-live/venv")
    group.run("sudo /home/pierogis-live/venv/bin/pip install gunicorn")
    group.run("sudo /home/pierogis-live/venv/bin/pip install psycopg2")

    # create gunicorn log files
    group.run("sudo mkdir /home/pierogis-live/log")
    group.run("sudo mkdir /home/pierogis-live/conf")
    group.run("sudo touch /home/pierogis-live/log/gunicorn.access.log")
    group.run("sudo touch /home/pierogis-live/log/gunicorn.error.log")

    # make pierogis-live owner of their home folder
    group.run("sudo chown -R pierogis-live:pierogis-live /home/pierogis-live")

    # and give nginx service access to pierogis-live home folder
    group.run("sudo chmod 710 /home/pierogis-live/")
    group.run("sudo usermod -a -G pierogis-live nginx")

    # create dir for nginx and system d config
    group.run('sudo mkdir /usr/local/nginx')
    group.run('sudo mkdir /usr/local/lib/systemd')
    group.run('sudo mkdir /usr/local/lib/systemd/system')


@task(optional=['content_home', 'bootstrap_home', 'dist_home', 'cdn_url', 'database_url', 'aws_region'])
def deploy(context, stage, version, content_home=None, bootstrap_home=None, dist_home=None, cdn_url=None,
           database_url=None,
           aws_region=None):
    aws_region = aws_region or os.getenv('AWS_REGION')

    client = boto3.client('ec2', aws_region)
    allocated_addresses = get_stage_addresses(client, stage, allocated=True)
    ips = [address.get('PublicIp') for address in allocated_addresses]

    group = SerialGroup(*ips, user='ec2-user')

    # figure out the package name and version
    # dist = subprocess.run('python setup.py --fullname', capture_output=True).strip()

    filename = '{}-{}.tar.gz'.format('pierogis-live', version)

    bootstrap_dir = os.getenv('BOOTSTRAP_DIR')

    for connection in group:
        # copy service configs
        connection.put(bootstrap_dir + 'pierogis-live.conf', '/tmp/pierogis-live.conf')
        connection.put(bootstrap_dir + 'pierogis-live.service', '/tmp/pierogis-live.service')

        # copy gunicorn config
        connection.put(bootstrap_dir + 'gunicorn.conf.py', '/tmp/gunicorn.conf.py')

        # upload the package to the temporary folder on the server
        connection.put('dist/%s' % filename, '/tmp/%s' % filename)

    group.run("sudo mv /tmp/pierogis-live.conf /usr/local/nginx/pierogis-live.conf")
    group.run("sudo mv /tmp/pierogis-live.service /usr/local/lib/systemd/system/pierogis-live.service")
    group.run("sudo mv /tmp/gunicorn.conf.py /home/pierogis-live/conf/gunicorn.conf.py")

    # add env var to .env
    SERVER_NAME = 'pierogis.live'
    CONTENT_HOME = content_home or os.getenv('CONTENT_HOME')
    BOOTSTRAP_HOME = bootstrap_home or os.getenv('BOOTSTRAP_HOME')
    # DIST_HOME = dist_home or os.getenv('DIST_HOME')

    if database_url:
        DATABASE_URL = database_url
    elif stage == 'dev':
        DATABASE_URL = os.getenv('DEV_DATABASE_URL')
    elif stage == 'prod':
        DATABASE_URL = os.getenv('PROD_DATABASE_URL')
    elif stage == 'test':
        DATABASE_URL = os.getenv('TEST_DATABASE_URL')

    CDN_URL = cdn_url or os.getenv('CDN_URL')

    group.run('echo SERVER_NAME={} | sudo tee -a /home/pierogis-live/.env'.format(SERVER_NAME))
    group.run('echo CONTENT_HOME={} | sudo tee -a /home/pierogis-live/.env'.format(CONTENT_HOME))
    group.run('echo BOOTSTRAP_HOME={} | sudo tee -a /home/pierogis-live/.env'.format(BOOTSTRAP_HOME))
    # run('echo DIST_HOME={} | sudo tee -a /home/pierogis-live/.env'.format(DIST_HOME))
    group.run('echo DATABASE_URL={} | sudo tee -a /home/pierogis-live/.env'.format(DATABASE_URL))
    group.run('echo DATABASE_URL={} | sudo tee -a /home/pierogis-live/.env'.format(CDN_URL))

    # install the package in the application's virtualenv with pip
    group.run('sudo /home/pierogis-live/venv/bin/pip install /tmp/%s' % filename)

    # remove the uploaded package
    group.run('rm -r /tmp/%s' % filename)

    # restart services
    group.run("sudo systemctl enable pierogis-live")
    group.run("sudo systemctl restart pierogis-live")
    group.run("sudo systemctl enable nginx")
    group.run("sudo systemctl restart nginx")


def get_stage_addresses(client, stage: str, allocated=False):
    # find the elastic ip for the desired stage
    elastic_ip_filters = [
        {'Name': 'domain', 'Values': ['vpc']},
        {'Name': 'tag-key', 'Values': ['pierogis-live']},
        {'Name': 'tag:stage', 'Values': [stage]}
    ]
    if allocated:
        elastic_ip_filters.append({'Name': 'instance-id', 'Values': ['*']})

    return client.describe_addresses(Filters=elastic_ip_filters)['Addresses']
