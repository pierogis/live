sudo yum install python3 git

git clone https://github.com/ksmoore17/pierogis-live.git
cd pierogis-live

curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3 -
source $HOME/.poetry/env
poetry config virtualenvs.in-project true
poetry install

. .venv/bin/activate

flask run

pip install gunicorn

sudo amazon-linux-extras install nginx1
sudo cp ./pierogis-live.conf /etc/nginx/conf.d/pierogis-live.conf
sudo systemctl start nginx
sudo systemctl enable nginx

gunicorn 'pierogis_live:create_app()'
