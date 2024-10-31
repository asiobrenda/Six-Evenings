from .base import *

import environ

# Initialize environment variables
env = environ.Env()
environ.Env.read_env()  # This will read from your .env file


DEBUG = os.environ.get('DEBUG')


 # Security settings for production


 # Security settings for production
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    'https://www.sixevenings.com',
    'https://sixevenings.com',
]
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'



ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'www.sixevenings.com', 'sixevenings.com']
# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES ={
     'default': dj_database_url.parse(os.environ.get("DATABASE_URL"))

    }


if os.getenv("RENDER") == "true":  # Only present on Render
    BASE_STORAGE_PATH = env("RENDER_STORAGE_PATH", default="/opt/render/project/src/storage")
else:
    # Fallback to local storage path for testing
    BASE_STORAGE_PATH = env("LOCAL_RENDER_STORAGE_PATH", default="/home/asio/projects1/MakeUp/media_storage")

STATIC_ROOT = os.path.join(BASE_STORAGE_PATH, "static")
MEDIA_ROOT = os.path.join(BASE_STORAGE_PATH, "media")
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Include directories for static files in production
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]




