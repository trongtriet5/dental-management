"""
Django settings for dental_clinic project.
"""

from pathlib import Path
import os
from decouple import config as decouple_config, Config, RepositoryEnv

"""Environment loading

Priority: backend/config.env (if present) > OS env vars

This ensures Supabase settings in config.env are applied without relying on
external shell scripts to export variables.
"""
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Prefer a repo-local env file if available; otherwise fall back to OS env
ENV_FILE = BASE_DIR / 'config.env'
if ENV_FILE.exists():
    env = Config(RepositoryEnv(str(ENV_FILE)))
else:
    env = decouple_config

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'customers.apps.CustomersConfig',
    'appointments',
    'financials.apps.FinancialsConfig',
    'reports',
    'users',
    'locations.apps.LocationsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dental_clinic.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dental_clinic.wsgi.application'

# Database
# Use Supabase PostgreSQL if configured, otherwise fallback to SQLite
if env('SUPABASE_DB_URL', default=''):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('SUPABASE_DB_NAME', default='postgres'),
            'USER': env('SUPABASE_DB_USER', default='postgres'),
            'PASSWORD': env('SUPABASE_DB_PASSWORD', default=''),
            'HOST': env('SUPABASE_DB_HOST', default='localhost'),
            'PORT': env('SUPABASE_DB_PORT', default='5432'),
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
    }
else:
    # Fallback to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    # Chỉ giữ lại validation độ dài tối thiểu, loại bỏ các validation khác
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,  # Giảm từ 8 xuống 6 ký tự
        }
    },
]

# Internationalization
LANGUAGE_CODE = 'vi-vn'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

# Date formats - Fixed to dd/mm/yyyy format only
DATE_FORMAT = 'd/m/Y'
DATE_INPUT_FORMATS = [
    '%d/%m/%Y',  # DD/MM/YYYY only
]

DATETIME_FORMAT = 'd/m/Y H:i'
DATETIME_INPUT_FORMATS = [
    '%d/%m/%Y %H:%M',  # DD/MM/YYYY HH:MM only
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DATE_FORMAT': '%d/%m/%Y',
    'DATETIME_FORMAT': '%d/%m/%Y %H:%M',
    'DATE_INPUT_FORMATS': ['%d/%m/%Y'],  # Only dd/mm/yyyy format
    'DATETIME_INPUT_FORMATS': ['%d/%m/%Y %H:%M'],  # Only dd/mm/yyyy hh:mm format
}

# CORS settings
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000').split(',')

CORS_ALLOW_CREDENTIALS = True

# JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Firebase settings
FIREBASE_CREDENTIALS_PATH = env('FIREBASE_CREDENTIALS_PATH', default='')
FIREBASE_DATABASE_URL = env('FIREBASE_DATABASE_URL', default='')

# Custom user model
AUTH_USER_MODEL = 'users.User'
