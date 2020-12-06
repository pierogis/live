#!/bin/bash

# install and start nginx
sudo amazon-linux-extras install -y nginx1
sudo aws s3 cp s3://pierogis.live/bootstrap/pierogis-live.conf /etc/nginx/conf.d/pierogis-live.conf

# install the gunicorn app as a system service
sudo aws s3 cp s3://pierogis.live/bootstrap/pierogis-live.service /etc/systemd/system/pierogis-live.service
sudo chmod 755 /etc/systemd/system/pierogis-live.service
sudo systemctl daemon-reload

# install python
sudo yum install -y python3 python3-devel gcc postgresql-devel

# add the pierogis-live user
sudo useradd pierogis-live
sudo passwd -f -u pierogis-live

# set env var from ssm parameter store
export VERSION=$(aws ssm get-parameter --name 'version' --query 'Parameter.Value' | xargs)
sudo echo VERSION=$VERSION >> /home/pierogis-live/.env
sudo echo CONTENT_HOME=$(aws ssm get-parameter --name 'content-home' --query 'Parameter.Value' | xargs) >> /home/pierogis-live/.env
sudo echo BOOTSTRAP_HOME=$(aws ssm get-parameter --name 'bootstrap-home' --query 'Parameter.Value' | xargs) >> /home/pierogis-live/.env
sudo echo DIST_HOME=$(aws ssm get-parameter --name 'dist-home' --query 'Parameter.Value' | xargs) >> /home/pierogis-live/.env
sudo echo DATABASE_URL=$(aws ssm get-parameter --name 'database-url' --query 'Parameter.Value' | xargs) >> /home/pierogis-live/.env
sudo echo CDN_URL=$(aws ssm get-parameter --name 'cdn-url' --query 'Parameter.Value' | xargs) >> /home/pierogis-live/.env

# copy server install script
sudo aws s3 cp s3://pierogis.live/dist/pierogis-live-$VERSION.tar.gz /home/pierogis-live/pierogis-live.tar.gz

# install the python packages as pierogis-live user
sudo python3 -m venv /home/pierogis-live/venv
sudo /home/pierogis-live/venv/bin/pip install gunicorn
sudo /home/pierogis-live/venv/bin/pip install /home/pierogis-live/pierogis-live.tar.gz
sudo /home/pierogis-live/venv/bin/pip install psycopg2

# configure gunicorn
sudo aws s3 cp s3://pierogis.live/bootstrap/gunicorn.conf.py /home/pierogis-live/conf/gunicorn.conf.py
sudo mkdir /home/pierogis-live/log
sudo touch /home/pierogis-live/log/gunicorn.access.log
sudo touch /home/pierogis-live/log/gunicorn.error.log

# make pierogis-live the owner of the application folder
sudo chown -R pierogis-live:pierogis-live /home/pierogis-live

# allow nginx to access pierogis-live user home folder
sudo chmod 710 /home/pierogis-live/
sudo usermod -a -G pierogis-live nginx

# start the server and nginx
sudo systemctl start pierogis-live
sudo systemctl enable pierogis-live
sudo systemctl start nginx
sudo systemctl enable nginx