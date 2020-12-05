# gunicorn.conf.py
# Non logging stuff
bind = "unix:/home/pierogis-live/pierogis-live.sock"
workers = 3
# Access log - records incoming HTTP requests
accesslog = "/home/pierogis-live/log/gunicorn.access.log"
# Error log - records Gunicorn server goings-on
errorlog = "/home/pierogis-live/log/gunicorn.error.log"
# Whether to send Django output to the error log
capture_output = True
# How verbose the Gunicorn error logs should be
loglevel = 'debug'
