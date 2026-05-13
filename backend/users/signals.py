from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def ensure_recruiter_profile(sender, instance, created, **kwargs):
    if instance.role != User.Role.RECRUITER:
        return
    from core.models import RecruiterProfile

    RecruiterProfile.objects.get_or_create(
        user=instance,
        defaults={
            'company_name': instance.first_name or instance.email.split('@')[0],
            'company_website': '',
            'is_verified': False,
            'work_email_verified': False,
        },
    )
