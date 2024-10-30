from .base import *
import os

# Set DEBUG to True for development
DEBUG = True
print(f"DEBUG: {DEBUG}")

# Allowed hosts - include localhost for local development
ALLOWED_HOSTS = ['*']  # Allow all hosts for local development

# Database configuration for local development
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

# Security settings
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False


STATIC_ROOT = os.path.join(MAK_DIR, "static")
MEDIA_ROOT = os.path.join(BASE_DIR, "media")