"""
Django settings for makeup project.

Generated by 'django-admin startproject' using Django 4.2.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""
import os
from pathlib import Path
import dj_database_url


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
MAK_DIR = os.path.dirname(BASE_DIR)



# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-#j9(egru5$5=vd=b2e+uf1j0sct$8me10^eoa4=ltjtq8fa)!h'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True')=='True'

# Use secure cookies when not in DEBUG mode
if not DEBUG:
    CSRF_COOKIE_SECURE = True  # Ensure CSRF cookies are only sent over HTTPS
    SESSION_COOKIE_SECURE = True  # Ensure session cookies are only sent over HTTPS
    CSRF_TRUSTED_ORIGINS = [
        'https://www.sixevenings.com',
        'https://sixevenings.com'
    ]  # Include both versions if you use both

    # Use a secure proxy header if you are behind a proxy/load balancer
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # Enforce HTTPS in production
    SECURE_SSL_REDIRECT = True

    # Additional security headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Allowed hosts - ensure your domain is included
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'www.sixevenings.com', 'sixevenings.com']


# Application definition

INSTALLED_APPS = [
     'daphne',
     'channels',
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




# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
if not DEBUG:
    DATABASES ={
     'default': dj_database_url.parse(os.environ.get("DATABASE_URL"))

    }

else:
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


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Kampala'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/


STATIC_URL = '/static/'
MEDIA_URL = '/media/'

# Specify directory for static files in development
STATICFILES_DIRS = [os.path.join(BASE_DIR, "makeup/static")]

# Define STATIC_ROOT and MEDIA_ROOT based on environment
if not DEBUG:  # Production environment
    BASE_STORAGE_PATH = '/opt/render/project/src/storage'
    STATIC_ROOT = os.path.join(BASE_STORAGE_PATH, "static")
    MEDIA_ROOT = os.path.join(BASE_STORAGE_PATH, "media")
else:  # Development environment
    STATIC_ROOT = os.path.join(BASE_DIR, "static")
    MEDIA_ROOT = os.path.join(BASE_DIR, "media")


# Storage for static files in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'



# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


AUTH_USER_MODEL = 'dating.SignUpUser'

LOGIN_REDIRECT_URL = '/'


# Redis configuration for Channels
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL],
        },
    },
}
