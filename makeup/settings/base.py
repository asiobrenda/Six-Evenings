import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MAK_DIR = os.path.dirname(BASE_DIR)

# Common settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'your_default_secret_key')
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'  # This is fine for local development
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'channels',
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'makeup.apps.dating',
    'easy_thumbnails',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'makeup.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'makeup/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.tz',
                'makeup.apps.dating.context_processors.notification_count_processor',
            ],
        },
    },
]

ASGI_APPLICATION = 'makeup.asgi.application'

# Redis channel layer configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_URL, 0)],
        },
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'dating.SignUpUser'

LOGIN_REDIRECT_URL = '/'

# Media and static files settings (same for both environments)
MEDIA_URL = '/media/'
STATIC_URL = '/static/'
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

STATICFILES_DIRS = [os.path.join(BASE_DIR, "static"), ]
STATIC_ROOT = os.path.join(MAK_DIR, "static")
