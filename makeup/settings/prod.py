import dj_database_url
import os

DATABASES = {
    'default': dj_database_url.config(default=os.getenv('DATABASE_URL'))
}
