import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internconnect_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = 'admin@example.com'
password = 'admin123'

user, created = User.objects.get_or_create(
    email=email,
    defaults={
        'username': 'admin',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True,
    },
)

if created:
    user.set_password(password)
    user.save()
    print(f"Superuser created: {email} / {password}")
else:
    updated_fields = []
    if user.username != 'admin':
        user.username = 'admin'
        updated_fields.append('username')
    if user.first_name != 'Admin':
        user.first_name = 'Admin'
        updated_fields.append('first_name')
    if user.last_name != 'User':
        user.last_name = 'User'
        updated_fields.append('last_name')
    if user.role != 'ADMIN':
        user.role = 'ADMIN'
        updated_fields.append('role')
    if not user.is_staff:
        user.is_staff = True
        updated_fields.append('is_staff')
    if not user.is_superuser:
        user.is_superuser = True
        updated_fields.append('is_superuser')
    if not user.check_password(password):
        user.set_password(password)
        updated_fields.append('password')

    if updated_fields:
        user.save()
        print(f"Superuser updated ({', '.join(updated_fields)}): {email}")
    else:
        print(f"Superuser already up to date: {email}")
