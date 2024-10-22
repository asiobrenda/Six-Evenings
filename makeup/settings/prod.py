import os
import dj_database_url
from .base import *

# Set DEBUG to False
DEBUG = False

# Add your allowed hosts
ALLOWED_HOSTS = ['www.sixevenings.com', 'sixevenings.com']  # Add other hosts as needed

# Database configuration
DATABASES = {
    'default': dj_database_url.config(default=os.getenv('DATABASE_URL'))
}

# Middleware settings
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Ensure this line is included
    ...
]

# Static files settings
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Secure settings
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True