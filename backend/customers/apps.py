from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customers'
    
    def ready(self):
        # Temporarily disable signals to debug customer creation issue
        # import customers.signals
        pass
