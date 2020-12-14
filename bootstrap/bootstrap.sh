#!/bin/bash

# install and start nginx
sudo amazon-linux-extras install -y nginx1

# install python
sudo yum install -y python3 python3-devel gcc postgresql-devel

# add the pierogis-live user
sudo useradd pierogis-live
sudo passwd -f -u pierogis-live

# install the python packages as pierogis-live user
sudo python3 -m venv /home/pierogis-live/venv
sudo /home/pierogis-live/venv/bin/pip install gunicorn
sudo /home/pierogis-live/venv/bin/pip install psycopg2

# configure gunicorn
sudo mkdir /home/pierogis-live/log
sudo mkdir /home/pierogis-live/conf
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