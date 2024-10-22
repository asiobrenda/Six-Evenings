from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'makeup',
        'USER': 'makeup',
        'PASSWORD': 'sql1pass',
        'HOST': 'localhost',
        'PORT': 5432
    }
}
