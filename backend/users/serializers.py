from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

PERSONAL_EMAIL_DOMAINS = {
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'icloud.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'zoho.com',
}

class UserCreateSerializer(BaseUserCreateSerializer):
    agree_terms = serializers.BooleanField(write_only=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_website = serializers.URLField(write_only=True, required=False, allow_blank=True)
    linkedin = serializers.URLField(write_only=True, required=False, allow_blank=True)
    company_linkedin = serializers.URLField(write_only=True, required=False, allow_blank=True)
    designation = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_size = serializers.CharField(write_only=True, required=False, allow_blank=True)
    industry = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_location = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = (
            'id',
            'email',
            'username',
            'password',
            'first_name',
            'last_name',
            'role',
            'agree_terms',
            'company_name',
            'company_website',
            'linkedin',
            'company_linkedin',
            'designation',
            'company_description',
            'phone_number',
            'company_size',
            'industry',
            'company_location',
        )

    def validate_agree_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept terms.")
        return value

    def validate(self, attrs):
        attrs.pop('agree_terms', None)
        company_name = attrs.pop('company_name', '')
        company_website = attrs.pop('company_website', '')
        company_linkedin = attrs.pop('company_linkedin', '')
        linkedin = attrs.pop('linkedin', '')
        designation = attrs.pop('designation', '')
        company_description = attrs.pop('company_description', '')
        phone_number = attrs.pop('phone_number', '')
        company_size = attrs.pop('company_size', '')
        industry = attrs.pop('industry', '')
        company_location = attrs.pop('company_location', '')

        attrs = super().validate(attrs)
        attrs.update({
            'company_name': company_name,
            'company_website': company_website,
            'company_linkedin': company_linkedin,
            'linkedin': linkedin,
            'designation': designation,
            'company_description': company_description,
            'phone_number': phone_number,
            'company_size': company_size,
            'industry': industry,
            'company_location': company_location,
        })

        role = attrs.get('role')
        email = (attrs.get('email') or '').strip().lower()
        attrs['email'] = email
        domain = email.rsplit('@', 1)[-1] if '@' in email else ''
        if role == User.Role.RECRUITER and domain in PERSONAL_EMAIL_DOMAINS:
            raise serializers.ValidationError({'email': 'Recruiters must sign up with a company work email.'})
        if role == User.Role.RECRUITER:
            required_fields = {
                'company_name': 'Company name is required for recruiter signup.',
                'company_website': 'Company website is required for recruiter signup.',
                'designation': 'Designation is required for recruiter signup.',
                'company_description': 'Company description is required for recruiter signup.',
                'phone_number': 'Phone number is required for recruiter signup.',
                'company_size': 'Company size is required for recruiter signup.',
                'industry': 'Industry is required for recruiter signup.',
                'company_location': 'Company location is required for recruiter signup.',
            }
            for field, message in required_fields.items():
                if not (attrs.get(field) or '').strip():
                    raise serializers.ValidationError({field: message})
            if not ((attrs.get('company_linkedin') or attrs.get('linkedin') or '').strip()):
                raise serializers.ValidationError({'linkedin': 'LinkedIn URL is required for recruiter signup.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('agree_terms', None)
        company_name = (validated_data.pop('company_name', '') or '').strip()
        company_website = (validated_data.pop('company_website', '') or '').strip()
        company_linkedin_value = validated_data.pop('company_linkedin', '')
        linkedin_value = validated_data.pop('linkedin', '')
        company_linkedin = (company_linkedin_value or linkedin_value or '').strip()
        designation = (validated_data.pop('designation', '') or '').strip()
        company_description = (validated_data.pop('company_description', '') or '').strip()
        phone_number = (validated_data.pop('phone_number', '') or '').strip()
        company_size = (validated_data.pop('company_size', '') or '').strip()
        industry = (validated_data.pop('industry', '') or '').strip()
        company_location = (validated_data.pop('company_location', '') or '').strip()
        user = super().create(validated_data)
        if user.role == User.Role.RECRUITER:
            from core.models import AdminNotification, RecruiterProfile
            profile, _ = RecruiterProfile.objects.get_or_create(
                user=user,
                defaults={
                    'company_name': company_name or user.first_name or user.email.split('@')[0],
                    'company_website': company_website,
                    'company_linkedin': company_linkedin,
                    'designation': designation,
                    'company_description': company_description,
                    'phone_number': phone_number,
                    'company_size': company_size,
                    'industry': industry,
                    'company_location': company_location,
                    'status': RecruiterProfile.STATUS_PENDING_ADMIN_REVIEW,
                    'is_verified': False,
                    'work_email_verified': False,
                    'verified_by_admin': False,
                },
            )
            if not _:
                profile.company_name = company_name or profile.company_name
                profile.company_website = company_website or profile.company_website
                profile.company_linkedin = company_linkedin or profile.company_linkedin
                profile.designation = designation or profile.designation
                profile.company_description = company_description or profile.company_description
                profile.phone_number = phone_number or profile.phone_number
                profile.company_size = company_size or profile.company_size
                profile.industry = industry or profile.industry
                profile.company_location = company_location or profile.company_location
                profile.status = RecruiterProfile.STATUS_PENDING_ADMIN_REVIEW
                profile.work_email_verified = False
                profile.verified_by_admin = False
                profile.is_verified = False
                profile.save(update_fields=[
                    'company_name',
                    'company_website',
                    'company_linkedin',
                    'designation',
                    'company_description',
                    'phone_number',
                    'company_size',
                    'industry',
                    'company_location',
                    'status',
                    'work_email_verified',
                    'verified_by_admin',
                    'is_verified',
                ])
            AdminNotification.objects.create(
                type=AdminNotification.TYPE_RECRUITER_VERIFICATION,
                priority=AdminNotification.PRIORITY_HIGH,
                message=f'New recruiter verification request from {profile.company_name}',
                recruiter=profile,
            )
        return user

class UserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'role', 'two_factor_enabled')

class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'two_factor_enabled',
            'is_active',
            'last_login',
            'date_joined',
            'password',
        )
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Password is required for new users.'})
        return attrs

    def _ensure_username(self, email: str) -> str:
        base = (email.split('@')[0] or 'user').lower()
        candidate = base
        suffix = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f"{base}{suffix}"
            suffix += 1
        return candidate

    def _apply_role_flags(self, user):
        if user.role == User.Role.ADMIN:
            user.is_staff = True
        elif not user.is_superuser:
            user.is_staff = False

    def create(self, validated_data):
        password = validated_data.pop('password')
        if validated_data.get('email'):
            validated_data['email'] = validated_data['email'].strip().lower()
        username = validated_data.get('username')
        if not username:
            validated_data['username'] = self._ensure_username(validated_data['email'])
        user = User(**validated_data)
        user.set_password(password)
        self._apply_role_flags(user)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if validated_data.get('email'):
            validated_data['email'] = validated_data['email'].strip().lower()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        self._apply_role_flags(instance)
        instance.save()
        return instance
