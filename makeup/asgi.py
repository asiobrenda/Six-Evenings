import os
import dj_database_url
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
MAK_DIR = os.path.dirname(BASE_DIR)


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

# Security settings
SECURE_SSL_REDIRECT = True  # Redirect all HTTP requests to HTTPS
CSRF_COOKIE_SECURE = True  # Cookies are only sent over HTTPS
SESSION_COOKIE_SECURE = True  # Cookies are only sent over HTTPS

# Static file directory setup
STATIC_ROOT = os.path.join(MAK_DIR, "static")
STATIC_URL = '/static/'
