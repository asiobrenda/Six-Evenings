from django.apps import AppConfig

class DatingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'makeup.apps.dating'

    def ready(self):
        from . import signals
        print("Signals imported")