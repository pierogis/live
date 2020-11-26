# install and start nginx
sudo amazon-linux-extras install -y nginx1
sudo aws cp s3://pierogis.live/bootstrap/pierogis-live.conf /etc/nginx/conf.d/pierogis-live.conf
sudo systemctl start nginx
sudo systemctl enable nginx

# install the gunicorn app as a system service
sudo aws s3 cp s3://pierogis.live/bootstrap/pierogis-live.service /etc/systemd/system/pierogis-live.service
sudo chmod 755 /etc/systemd/system/pierogis-live.service
sudo systemctl daemon-reload

# install python
sudo yum install -y python3

# add the pierogis-live user
sudo useradd pierogis-live
sudo passwd -f -u pierogis-live
sudo mkdir /opt/pierogis-live

# install the python packages as pierogis-live user
su - pierogis-live
pip3 install --user gunicorn

# install server
aws s3 cp s3://pierogis.live/bootstrap/install.sh ~/install.sh
. ~/install.sh
