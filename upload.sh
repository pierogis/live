# build and upload tar to s3
python3.9 ./setup.py release sdist
aws s3 cp ./dist/pierogis-live-0.1.0.tar.gz s3://pierogis.live/dist/pierogis-live.tar.gz

# upload bootstrap scripts to s3
aws s3 cp ./bootstrap/bootstrap.sh s3://pierogis.live/bootstrap/bootstrap.sh
aws s3 cp ./bootstrap/pierogis-live.conf s3://pierogis.live/bootstrap/pierogis-live.conf
aws s3 cp ./bootstrap/pierogis-live.service s3://pierogis.live/bootstrap/pierogis-live.service