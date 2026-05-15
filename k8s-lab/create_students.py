import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internconnect_backend.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate
User = get_user_model()

data = [
    ('anjali.sinha54@gmail.com', 'anjali_sinha', 'Anjali', 'Sinha'),
    ('rahul.kumar77@gmail.com',  'rahul_kumar',  'Rahul',  'Kumar'),
    ('aarav.singh63@gmail.com',  'aarav_singh',  'Aarav',  'Singh'),
    ('ishita.sharma74@gmail.com','ishita_sharma', 'Ishita', 'Sharma'),
]

for email, uname, fn, ln in data:
    if User.objects.filter(email=email).exists():
        u = User.objects.get(email=email)
        u.set_password('password123')
        u.is_active = True
        u.save()
        print('Updated: ' + email)
    else:
        u = User(email=email, username=uname, first_name=fn, last_name=ln, role='APPLICANT', is_active=True)
        u.set_password('password123')
        u.save()
        print('Created: ' + email)

print('')
print('=== Login Verification ===')
for email, _, _, _ in data:
    r = authenticate(email=email, password='password123')
    print(email + ' -> ' + ('LOGIN OK' if r else 'FAIL'))
