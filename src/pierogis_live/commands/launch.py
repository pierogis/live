import click
import flask
import boto3


@click.command()
@click.argument('version')
@click.option('--content-home')
@click.option('--bootstrap-home')
@click.option('--dist_home')
@click.option('--cdn-url')
@click.option('--database-url')
@click.option('--aws-region')
@click.option('--aws-subnet-id')
@click.option('--count', default=1)
@flask.cli.with_appcontext
def launch(version, content_home, bootstrap_home, dist_home, cdn_url, database_url, aws_region, aws_subnet_id, count):
    if bootstrap_home is None:
        bootstrap_home = flask.current_app.config['BOOTSTRAP_HOME']

    if content_home is None:
        content_home = flask.current_app.config['CONTENT_HOME']

    if dist_home is None:
        dist_home = flask.current_app.config['DIST_HOME']

    if cdn_url is None:
        cdn_url = flask.current_app.config['CDN_URL']

    if database_url is None:
        database_url = flask.current_app.config['SQLALCHEMY_DATABASE_URI']

    if aws_subnet_id is None:
        aws_subnet_id = flask.current_app.config['AWS_SUBNET_ID']

    if aws_region is None:
        aws_region = flask.current_app.config['AWS_REGION']

    ec2 = boto3.resource('ec2', aws_region)
    ssm = boto3.client('ssm', aws_region)
    elb = boto3.client('elbv2', aws_region)

    ssm.put_parameter(Name='content-home', Value=content_home, Type='String', Overwrite=True)
    ssm.put_parameter(Name='bootstrap-home', Value=bootstrap_home, Type='String', Overwrite=True)
    ssm.put_parameter(Name='dist-home', Value=dist_home, Type='String', Overwrite=True)
    ssm.put_parameter(Name='cdn-url', Value=cdn_url, Type='String', Overwrite=True)
    ssm.put_parameter(Name='database-url', Value=database_url, Type='String', Overwrite=True)
    ssm.put_parameter(Name='version', Value=version, Type='String', Overwrite=True)
    ssm.put_parameter(Name='subnet_id', Value=aws_subnet_id, Type='String', Overwrite=True)

    instances = ec2.create_instances(
        MaxCount=count,
        LaunchTemplate={
            'LaunchTemplateName': 'pierogis-live',
            'Version': '6',
        },
        MinCount=count,
        SubnetId=aws_subnet_id
    )

    response = elb.describe_target_groups(
        Names=[
            'pierogis-live',
        ],
        PageSize=1
    )

    target_group_arn = response['TargetGroups'][0]['TargetGroupArn']
    targets = [{'Id': instance.id} for instance in instances]

    # wait for the instance to be running

    elb.register_targets(TargetGroupArn=target_group_arn, Targets=targets)
