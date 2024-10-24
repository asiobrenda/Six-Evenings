# File: makeup/asgi.py
import os
from django.core.asgi import get_asgi_application
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makeup.settings')
django.setup()  # Call setup before importing routing or models

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from .apps.dating.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
