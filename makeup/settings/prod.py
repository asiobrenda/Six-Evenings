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

# Static files settings
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
