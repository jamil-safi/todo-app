from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from todos.models import List

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_list(sender, instance, created, **kwargs):
    if created:
        List.objects.create(
            owner = instance,
            title = "My Todos",
            is_default = True,
            display_order = 0
        )