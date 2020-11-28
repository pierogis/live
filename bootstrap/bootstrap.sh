#!/bin/bash

# install and start nginx
sudo amazon-linux-extras install -y nginx1
sudo aws s3 cp s3://pierogis.live/bootstrap/pierogis-live.conf /etc/nginx/conf.d/pierogis-live.conf

# install the gunicorn app as a system service
sudo aws s3 cp s3://pierogis.live/bootstrap/pierogis-live.service /etc/systemd/system/pierogis-live.service
sudo chmod 755 /etc/systemd/system/pierogis-live.service
sudo systemctl daemon-reload

# install python
sudo yum install -y python3

# add the pierogis-live user
sudo useradd pierogis-live
sudo passwd -f -u pierogis-live

# copy server install script
sudo aws s3 cp s3://pierogis.live/dist/pierogis-live.tar.gz /home/pierogis-live/pierogis-live/pierogis-live.tar.gz

# install the python packages as pierogis-live user
sudo python3 -m venv /home/pierogis-live/pierogis-live/venv
sudo /home/pierogis-live/pierogis-live/venv/bin/pip install gunicorn
sudo /home/pierogis-live/pierogis-live/venv/bin/pip install /home/pierogis-live/pierogis-live/pierogis-live.tar.gz

# make pierogis-live the owner of the application folder
sudo chown pierogis-live:pierogis-live /home/pierogis-live/pierogis-live

# allow nginx to access pierogis-live user home folder
sudo chmod 710 /home/pierogis-live/
sudo usermod -a -G pierogis-live nginx

# start the server and nginx
sudo systemctl start pierogis-live
sudo systemctl enable pierogis-live
sudo systemctl start nginx
sudo systemctl enable nginx