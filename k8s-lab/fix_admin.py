import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internconnect_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Fix all admin users — set role to uppercase 'ADMIN'
admin_emails = ['superadmin@admin.com', 'admin@example.com']

for email in admin_emails:
    if User.objects.filter(email=email).exists():
        u = User.objects.get(email=email)
        old_role = u.role
        u.role = 'ADMIN'
        u.is_staff = True
        u.is_superuser = True
        u.is_active = True
        u.save()
        print(f'Fixed: {email} | role: {old_role} -> ADMIN')
    else:
        print(f'Not found: {email}')

print('')
print('All admin roles corrected to ADMIN (uppercase)')
print('Login: superadmin@admin.com / adminpassword')
