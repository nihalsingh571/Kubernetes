from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

# Pick or create admin user
admin = User.objects.filter(role=User.Role.ADMIN).first()
if not admin:
    admin = User.objects.create_superuser(
        email='admin@local.test',
        username='admin',
        password='adminpass',
        first_name='Admin',
        last_name='User',
        role=User.Role.ADMIN,
    )
    print('Created admin user', admin.email)
else:
    print('Using admin user', admin.email)

admin.set_password('adminpass')
admin.save()

client = APIClient()
resp = client.post('/auth/jwt/create/', {'email': admin.email, 'password': 'adminpass'}, format='json')
print('JWT login status', resp.status_code, resp.data)

if resp.status_code == 200:
    access = resp.data.get('access')
    # Use the same auth header type as frontend (JWT) per Django settings
    client.credentials(HTTP_AUTHORIZATION='JWT ' + access)

    patch = client.patch('/api/platform-settings/update_settings/', {'enforce_2fa_for_admins_recruiters': False}, format='json')
    print('PATCH status', patch.status_code, patch.data)

    get = client.get('/api/platform-settings/settings/')
    print('GET status', get.status_code, get.data)
else:
    print('Login did not succeed.')
