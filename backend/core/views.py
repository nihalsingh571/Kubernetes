import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AdminNotification, ApplicantProfile, RecruiterProfile, Internship, Application, Notification, InternshipInvitation
from assessments.models import Skill
from .serializers import AdminNotificationSerializer, ApplicantProfileSerializer, RecruiterProfileSerializer, InternshipSerializer, ApplicationSerializer, NotificationSerializer, InternshipInvitationSerializer
from users.models import User


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

DEFAULT_ALLOWED_COLLEGE_DOMAINS = {
    'lpu.in',
}


def email_domain(email):
    return (email or '').strip().lower().rsplit('@', 1)[-1] if '@' in (email or '') else ''


def resolve_login_email(email):
    normalized = (email or '').strip()
    if not normalized:
        return ''
    matched = User.objects.filter(email__iexact=normalized).values_list('email', flat=True).first()
    return matched or normalized.lower()


def is_allowed_college_email(email):
    domain = email_domain(email)
    if not domain or domain in PERSONAL_EMAIL_DOMAINS:
        return False
    configured_domains = {
        item.strip().lower()
        for item in getattr(settings, 'ALLOWED_COLLEGE_EMAIL_DOMAINS', '').split(',')
        if item.strip()
    }
    allowed_domains = DEFAULT_ALLOWED_COLLEGE_DOMAINS | configured_domains
    if domain in allowed_domains:
        return True
    allowed_suffixes = ('.edu', '.edu.in', '.ac.in')
    allowed_keywords = ('university', 'college', 'institute', 'campus', 'school')
    return domain.endswith(allowed_suffixes) or any(keyword in domain for keyword in allowed_keywords)


def is_allowed_work_email(email):
    domain = email_domain(email)
    return bool(domain and domain not in PERSONAL_EMAIL_DOMAINS)


def create_recruiter_admin_notification(profile):
    notification = AdminNotification.objects.create(
        type=AdminNotification.TYPE_RECRUITER_VERIFICATION,
        priority=AdminNotification.PRIORITY_HIGH,
        message=f'New recruiter verification request from {profile.company_name}',
        recruiter=profile,
    )
    profile.admin_notified_at = timezone.now()
    profile.save(update_fields=['admin_notified_at'])
    return notification


def notify_admins_recruiter_pending(profile):
    admin_emails = list(
        User.objects.filter(role=User.Role.ADMIN, email__isnull=False)
        .exclude(email='')
        .values_list('email', flat=True)
    )
    if not admin_emails:
        return
    try:
        send_mail(
            subject='InternConnect recruiter awaiting approval',
            message=(
                f'{profile.user.get_full_name() or profile.user.email} from '
                f'{profile.company_name or "an unlisted company"} requires admin verification.'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@internconnect.local'),
            recipient_list=admin_emails,
            fail_silently=False,
        )
        profile.admin_notified_at = timezone.now()
        profile.save(update_fields=['admin_notified_at'])
    except Exception as exc:
        print('Recruiter admin notification failed:', repr(exc))


def eligibility_error_response(profile):
    return Response(
        {
            'error': 'Complete and verify your student profile before using this feature.',
            'eligibility': ApplicantProfileSerializer(profile).get_eligibility(profile),
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def verified_profile_ids():
    return [
        profile.id
        for profile in ApplicantProfile.objects.select_related('user').all()
        if profile.is_verified_profile
    ]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_students(request):
    if request.user.role != User.Role.ADMIN:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    students = [
        profile for profile in ApplicantProfile.objects.select_related('user').filter(user__role=User.Role.APPLICANT).order_by('-id')
        if profile.is_verified_profile
    ]
    serializer = ApplicantProfileSerializer(students, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_recruiter_work_email_otp(request):
    email = resolve_login_email(request.data.get('email') or request.data.get('workEmail') or request.data.get('work_email') or '')
    password = request.data.get('password') or ''
    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if not user or user.role != User.Role.RECRUITER:
        return Response({'detail': 'Invalid recruiter credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = RecruiterProfile.objects.get_or_create(
        user=user,
        defaults={
            'company_name': user.first_name or user.email,
            'company_website': '',
            'status': RecruiterProfile.STATUS_PENDING_ADMIN_REVIEW,
        },
    )
    work_email = user.email.lower()
    print('Recruiter work email OTP request:', {'user_id': user.id, 'work_email': work_email, 'status': profile.status})

    if profile.status != RecruiterProfile.STATUS_APPROVED_PENDING_EMAIL_VERIFICATION or not profile.verified_by_admin:
        return Response(
            {
                'success': False,
                'type': 'PENDING_ADMIN_APPROVAL',
                'message': 'OTP is available only after admin verifies your company.',
                'detail': 'OTP is available only after admin verifies your company.',
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    if not is_allowed_work_email(work_email):
        return Response({'detail': 'Use a valid company work email, not a personal email domain.'}, status=status.HTTP_400_BAD_REQUEST)

    otp = f'{random.randint(100000, 999999)}'
    profile.work_email_verified = False
    profile.work_email_otp_hash = make_password(otp)
    profile.work_email_otp_expires_at = timezone.now() + timedelta(minutes=10)
    profile.save(update_fields=[
        'work_email_verified',
        'work_email_otp_hash',
        'work_email_otp_expires_at',
    ])

    try:
        send_mail(
            subject='Your InternConnect recruiter verification code',
            message=f'Your InternConnect recruiter verification code is {otp}. It expires in 10 minutes.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@internconnect.local'),
            recipient_list=[work_email],
            fail_silently=False,
        )
    except Exception as exc:
        print('Recruiter work email OTP send failed:', repr(exc))
        response_body = {'detail': 'Unable to send verification code right now. Please try again.'}
        if settings.DEBUG:
            response_body['debug'] = str(exc)
        return Response(response_body, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({'success': True, 'message': 'Verification code sent to your work email.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_recruiter_work_email_otp(request):
    email = resolve_login_email(request.data.get('email') or request.data.get('workEmail') or request.data.get('work_email') or '')
    password = request.data.get('password') or ''
    otp = (request.data.get('otp') or '').strip()
    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, username=email, password=password)
    if not user or user.role != User.Role.RECRUITER:
        return Response({'detail': 'Invalid recruiter credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        profile = user.recruiter_profile
    except RecruiterProfile.DoesNotExist:
        return Response({'detail': 'Recruiter profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    print('Recruiter work email OTP verify:', {'user_id': user.id, 'has_otp': bool(otp), 'status': profile.status})

    if not otp:
        return Response({'detail': 'OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if profile.status != RecruiterProfile.STATUS_APPROVED_PENDING_EMAIL_VERIFICATION or not profile.verified_by_admin:
        return Response({'detail': 'Recruiter is not approved for email verification.'}, status=status.HTTP_403_FORBIDDEN)
    if not profile.work_email_otp_is_active:
        return Response({'detail': 'Verification code expired. Request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
    if not check_password(otp, profile.work_email_otp_hash):
        return Response({'detail': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

    profile.work_email_verified = True
    profile.status = RecruiterProfile.STATUS_ACTIVE
    profile.is_verified = True
    profile.work_email_otp_hash = ''
    profile.work_email_otp_expires_at = None
    profile.save(update_fields=[
        'work_email_verified',
        'status',
        'is_verified',
        'work_email_otp_hash',
        'work_email_otp_expires_at',
    ])
    serializer = RecruiterProfileSerializer(profile, context={'request': request})
    refresh = RefreshToken.for_user(user)
    return Response({
        'success': True,
        'message': 'Work email verified. Your recruiter account is active.',
        'profile': serializer.data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })

class IsRecruiter(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        if request.user.role != User.Role.RECRUITER:
            return False
        profile = getattr(request.user, 'recruiter_profile', None)
        return bool(
            profile
            and profile.status == RecruiterProfile.STATUS_ACTIVE
            and profile.work_email_verified
            and profile.is_verified
        )

class IsApplicant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.APPLICANT


class IsAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == User.Role.ADMIN

class ApplicantProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicantProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role == User.Role.APPLICANT:
            return ApplicantProfile.objects.filter(user=self.request.user)
        return ApplicantProfile.objects.filter(id__in=verified_profile_ids())

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['GET', 'PATCH'])
    def me(self, request):
        profile, created = ApplicantProfile.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            print('Applicant profile update req.body:', request.data)
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=False, methods=['POST'], url_path='send-college-email-otp')
    def send_college_email_otp(self, request):
        profile, _ = ApplicantProfile.objects.get_or_create(user=request.user)
        college_email = (
            request.data.get('collegeEmail')
            or request.data.get('college_email')
            or request.data.get('university_email')
            or profile.university_email
            or ''
        ).strip().lower()
        print('College email OTP request:', {'user_id': request.user.id, 'college_email': college_email})

        if request.user.role != User.Role.APPLICANT:
            return Response({'detail': 'Only students can verify college email.'}, status=status.HTTP_403_FORBIDDEN)
        if not college_email:
            return Response({'detail': 'College email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_allowed_college_email(college_email):
            return Response({'detail': 'Use a valid college or university email address.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = f'{random.randint(100000, 999999)}'
        profile.university_email = college_email
        profile.university_email_verified = False
        profile.university_email_otp_hash = make_password(otp)
        profile.university_email_otp_expires_at = timezone.now() + timedelta(minutes=10)
        profile.save(update_fields=[
            'university_email',
            'university_email_verified',
            'university_email_otp_hash',
            'university_email_otp_expires_at',
        ])

        try:
            send_mail(
                subject='Your InternConnect college email verification code',
                message=f'Your InternConnect verification code is {otp}. It expires in 10 minutes.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@internconnect.local'),
                recipient_list=[college_email],
                fail_silently=False,
            )
        except Exception as exc:
            print('College email OTP send failed:', repr(exc))
            response_body = {'detail': 'Unable to send verification code right now. Please try again.'}
            if settings.DEBUG:
                response_body['debug'] = str(exc)
            return Response(response_body, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'success': True, 'message': 'Verification code sent to your college email.'})

    @action(detail=False, methods=['POST'], url_path='verify-college-email-otp')
    def verify_college_email_otp(self, request):
        profile, _ = ApplicantProfile.objects.get_or_create(user=request.user)
        otp = (request.data.get('otp') or '').strip()
        print('College email OTP verify:', {'user_id': request.user.id, 'has_otp': bool(otp)})

        if request.user.role != User.Role.APPLICANT:
            return Response({'detail': 'Only students can verify college email.'}, status=status.HTTP_403_FORBIDDEN)
        if not otp:
            return Response({'detail': 'OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not profile.university_email_otp_is_active:
            return Response({'detail': 'Verification code expired. Request a new code.'}, status=status.HTTP_400_BAD_REQUEST)
        if not check_password(otp, profile.university_email_otp_hash):
            return Response({'detail': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.university_email_verified = True
        profile.university_email_otp_hash = ''
        profile.university_email_otp_expires_at = None
        profile.save(update_fields=[
            'university_email_verified',
            'university_email_otp_hash',
            'university_email_otp_expires_at',
        ])
        serializer = self.get_serializer(profile)
        return Response({
            'success': True,
            'message': 'College email verified successfully.',
            'profile': serializer.data,
        })

    @action(detail=False, methods=['GET'], permission_classes=[permissions.AllowAny], url_path='suggest')
    def suggest(self, request):
        email = (request.query_params.get('email') or '').strip()
        if not email:
            return Response({'detail': 'Email query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.role != User.Role.APPLICANT:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = ApplicantProfile.objects.get_or_create(user=user)
        return Response(
            {
                'role': user.role,
                'student_name': (user.get_full_name() or user.email),
                'college': profile.college or '',
                'degree': profile.degree or '',
                'major': profile.major or '',
                'interested_role': profile.interested_role or '',
            }
        )

class RecruiterProfileViewSet(viewsets.ModelViewSet):
    serializer_class = RecruiterProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == User.Role.RECRUITER:
            return RecruiterProfile.objects.filter(user=self.request.user)
        return RecruiterProfile.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        # prevent recruiters from toggling their own verified flag
        protected_fields = {'is_verified', 'status', 'verified_by_admin', 'verified_at', 'work_email_verified'}
        if request.user.role == User.Role.RECRUITER and protected_fields.intersection(request.data.keys()):
            return Response({'detail': 'Cannot verify yourself'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAdminPermission], url_path='verify-company')
    def verify_company(self, request, pk=None):
        profile = self.get_object()
        profile.status = RecruiterProfile.STATUS_APPROVED_PENDING_EMAIL_VERIFICATION
        profile.verified_by_admin = True
        profile.verified_at = timezone.now()
        profile.work_email_verified = False
        profile.is_verified = False
        profile.work_email_otp_hash = ''
        profile.work_email_otp_expires_at = None
        profile.save(update_fields=[
            'status',
            'verified_by_admin',
            'verified_at',
            'work_email_verified',
            'is_verified',
            'work_email_otp_hash',
            'work_email_otp_expires_at',
        ])
        notify_admins_recruiter_pending(profile)
        AdminNotification.objects.filter(recruiter=profile, type=AdminNotification.TYPE_RECRUITER_VERIFICATION).update(is_read=True)
        serializer = self.get_serializer(profile)
        return Response({
            'success': True,
            'message': 'Company verified. Recruiter can now verify work email with OTP.',
            'profile': serializer.data,
        })

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAdminPermission])
    def reject(self, request, pk=None):
        profile = self.get_object()
        profile.status = RecruiterProfile.STATUS_REJECTED
        profile.verified_by_admin = False
        profile.is_verified = False
        profile.work_email_verified = False
        profile.save(update_fields=['status', 'verified_by_admin', 'is_verified', 'work_email_verified'])
        serializer = self.get_serializer(profile)
        return Response({'success': True, 'message': 'Recruiter rejected.', 'profile': serializer.data})

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAdminPermission])
    def suspend(self, request, pk=None):
        profile = self.get_object()
        profile.status = RecruiterProfile.STATUS_SUSPENDED
        profile.is_verified = False
        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        profile.save(update_fields=['status', 'is_verified'])
        serializer = self.get_serializer(profile)
        return Response({'success': True, 'message': 'Recruiter suspended.', 'profile': serializer.data})

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAdminPermission])
    def send_otp(self, request, pk=None):
        profile = self.get_object()
        if profile.status != RecruiterProfile.STATUS_APPROVED_PENDING_EMAIL_VERIFICATION or not profile.verified_by_admin:
            return Response({'detail': 'Recruiter must be approved by admin first.'}, status=status.HTTP_400_BAD_REQUEST)

        work_email = profile.user.email.lower()
        if not is_allowed_work_email(work_email):
            return Response({'detail': 'Recruiter email domain is not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = f'{random.randint(100000, 999999)}'
        profile.work_email_verified = False
        profile.work_email_otp_hash = make_password(otp)
        profile.work_email_otp_expires_at = timezone.now() + timedelta(minutes=10)
        profile.save(update_fields=[
            'work_email_verified',
            'work_email_otp_hash',
            'work_email_otp_expires_at',
        ])

        try:
            send_mail(
                subject='Your InternConnect recruiter verification code',
                message=f'Your InternConnect recruiter verification code is {otp}. It expires in 10 minutes.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@internconnect.local'),
                recipient_list=[work_email],
                fail_silently=False,
            )
        except Exception as exc:
            print('Admin send recruiter OTP failed:', repr(exc))
            response_body = {'detail': 'Unable to send verification code.'}
            if settings.DEBUG:
                response_body['debug'] = str(exc)
            return Response(response_body, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        serializer = self.get_serializer(profile)
        return Response({
            'success': True, 
            'message': f'OTP sent to {work_email}',
            'profile': serializer.data,
        })

    @action(detail=False, methods=['GET'], permission_classes=[permissions.AllowAny], url_path='suggest')
    def suggest(self, request):
        email = (request.query_params.get('email') or '').strip()
        if not email:
            return Response({'detail': 'Email query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.role != User.Role.RECRUITER:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = RecruiterProfile.objects.get_or_create(
            user=user,
            defaults={'company_name': user.first_name or user.email, 'company_website': ''},
        )
        return Response(
            {
                'role': user.role,
                'company_name': profile.company_name or '',
                'company_website': profile.company_website or '',
                'designation': profile.designation or '',
                'company_linkedin': profile.company_linkedin or '',
                'company_description': profile.company_description or '',
                'phone_number': profile.phone_number or '',
                'company_size': profile.company_size or '',
                'industry': profile.industry or '',
                'company_location': profile.company_location or '',
                'work_email_verified': profile.work_email_verified,
                'approval_status': profile.approval_status,
                'is_verified': profile.is_verified,
            }
        )

    @action(detail=False, methods=['GET', 'PATCH'])
    def me(self, request):
        profile, created = RecruiterProfile.objects.get_or_create(
            user=request.user,
            defaults={'company_name': request.user.first_name or request.user.email, 'company_website': ''},
        )
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminPermission]

    def get_queryset(self):
        return AdminNotification.objects.select_related('recruiter', 'recruiter__user').all()

    @action(detail=False, methods=['GET'], url_path='summary')
    def summary(self, request):
        pending_count = RecruiterProfile.objects.filter(status=RecruiterProfile.STATUS_PENDING_ADMIN_REVIEW).count()
        notifications = self.get_queryset().filter(is_read=False)[:10]
        return Response({
            'pending_recruiters': pending_count,
            'urgent_message': f'{pending_count} recruiter accounts require urgent verification.',
            'notifications': self.get_serializer(notifications, many=True).data,
        })

class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    
    def get_permissions(self):
        # allow anonymous access to list and retrieve
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'applicants']:
            return [IsRecruiter()]
        if self.action in ['list', 'retrieve', 'recommendations']:
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            recruiter_id = self.request.data.get('recruiter_id')
            if not recruiter_id:
                raise ValidationError({'recruiter_id': 'This field is required for admin-created listings.'})
            try:
                recruiter_profile = RecruiterProfile.objects.get(pk=recruiter_id)
            except RecruiterProfile.DoesNotExist:
                raise ValidationError({'recruiter_id': 'Recruiter not found.'})
        else:
            recruiter_profile = RecruiterProfile.objects.get(user=user)
        instance = serializer.save(recruiter=recruiter_profile)
        self._sync_skill_catalog(instance.required_skills)
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._sync_skill_catalog(instance.required_skills)

    def _sync_skill_catalog(self, skills):
        if not skills:
            return
        for skill in skills:
            label = ''
            if isinstance(skill, str):
                label = skill.strip()
            elif isinstance(skill, dict):
                label = (skill.get('name') or '').strip()
            if label:
                Skill.objects.get_or_create(name=label)

    @action(detail=True, methods=['POST'])
    def apply(self, request, pk=None):
        internship = self.get_object()
        user = request.user
        
        if user.role != User.Role.APPLICANT:
            return Response({"error": "Only applicants can apply"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            profile = user.applicant_profile
        except ApplicantProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        if not profile.is_eligible_for_assessments:
            return eligibility_error_response(profile)

        missing_skills = profile.missing_required_skills_for(internship.required_skills)
        if missing_skills:
            return Response(
                {
                    "error": "Verify all required skills before applying.",
                    "missing_required_skills": missing_skills,
                    "required_skills": internship.required_skills,
                    "verified_skills": profile.verified_skill_names,
                },
                status=status.HTTP_403_FORBIDDEN,
            )
            
        if Application.objects.filter(internship=internship, applicant=profile).exists():
            return Response({"error": "Already applied"}, status=status.HTTP_400_BAD_REQUEST)
            
        application = Application.objects.create(internship=internship, applicant=profile)
        
        # Automatically start a conversation between recruiter and student
        from .models import Conversation
        Conversation.objects.get_or_create(
            recruiter=internship.recruiter.user,
            student=user,
            internship=internship
        )
        
        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['GET'])
    def applicants(self, request, pk=None):
        internship = self.get_object()
        
        try:
            recruiter_profile = request.user.recruiter_profile
            if internship.recruiter != recruiter_profile:
                return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        except RecruiterProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)
            
        applications = Application.objects.filter(
            internship=internship,
            applicant_id__in=verified_profile_ids(),
        ).order_by('-applicant__vsps_score')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class PlatformSettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminPermission]

    @action(detail=False, methods=['GET'], url_path='settings')
    def get_settings(self, request):
        """Get current platform settings"""
        from .models import PlatformSettings
        settings = PlatformSettings.get_settings()
        return Response({
            'enforce_2fa_for_admins_recruiters': settings.enforce_2fa_for_admins_recruiters,
            'auto_approve_verified_recruiters': settings.auto_approve_verified_recruiters
        })

    @action(detail=False, methods=['PATCH'])
    def update_settings(self, request):
        """Update platform settings"""
        from .models import PlatformSettings
        settings = PlatformSettings.get_settings()
        
        enforce_2fa = request.data.get('enforce_2fa_for_admins_recruiters')
        auto_approve = request.data.get('auto_approve_verified_recruiters')
        
        if enforce_2fa is not None:
            settings.enforce_2fa_for_admins_recruiters = enforce_2fa
        if auto_approve is not None:
            settings.auto_approve_verified_recruiters = auto_approve
            
        settings.save()
        
        return Response({
            'enforce_2fa_for_admins_recruiters': settings.enforce_2fa_for_admins_recruiters,
            'auto_approve_verified_recruiters': settings.auto_approve_verified_recruiters
        })

    @action(detail=False, methods=['GET'])
    def recommendations(self, request):
        user = request.user
        if user.role != User.Role.APPLICANT:
            return Response({"error": "Only applicants can get recommendations"}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = user.applicant_profile
        except ApplicantProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        if not profile.is_eligible_for_assessments:
            return eligibility_error_response(profile)

        from ml_engine.recommender import (
            RecommendationEngine, CandidateProfile, MicroAssessment,
            Internship as MLInternship,
        )

        skills_list = []
        for s in profile.skills:
            if isinstance(s, dict):
                skills_list.append(s.get('name', ''))
            else:
                skills_list.append(str(s))

        # Build MicroAssessment with all VSPS parameters (proposal §3.1)
        candidate = CandidateProfile(
            id=user.id,
            skills=skills_list,
            micro_assessment=MicroAssessment(
                accuracy=profile.assessment_accuracy,
                speed_score=profile.assessment_speed_score,
                skip_penalty=profile.assessment_skip_penalty,
                difficulty_score=profile.assessment_difficulty_score,
                consistency=profile.assessment_consistency,
                recency_factor=profile.recency_score,
                integrity_factor=profile.integrity_factor,
            ),
            recency_score=profile.recency_score,
        )

        # Compute completion_ratio for Trust Score (proposal §4.1)
        total_applications = Application.objects.filter(applicant=profile).count()
        completed_applications = Application.objects.filter(
            applicant=profile, status__in=['ACCEPTED', 'REVIEWED']
        ).count()
        completion_ratio = (
            completed_applications / total_applications
            if total_applications > 0 else 0.5
        )

        db_internships = Internship.objects.select_related('recruiter').all()
        ml_internships = []
        internship_map = {}

        for i in db_internships:
            ml_i = MLInternship(
                id=i.id,
                title=i.title,
                description=i.description,
                recruiter_rating=i.recruiter_rating,       # now a real DB field
                recency_score=i.recency_score,             # now a real DB field
                is_verified=i.recruiter.is_verified,       # RecruiterProfile.is_verified
            )
            ml_internships.append(ml_i)
            internship_map[i.id] = i

        engine = RecommendationEngine()
        results = engine.recommend(
            candidate,
            ml_internships,
            completion_ratio=completion_ratio,
        )

        response_data = []
        for res in results:
            ml_internship = res['internship']
            original_obj = internship_map.get(ml_internship.id)
            if not original_obj:
                continue

            i_data = self.get_serializer(original_obj).data
            i_data['recommendation'] = {
                'final_score': res['final_score'],
                'cosine_similarity': res['cosine_similarity'],
                'vsps': res['vsps'],
                'trust_score': res['trust_score'],
            }
            response_data.append(i_data)

        return Response(response_data)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.APPLICANT:
            try:
                return Application.objects.filter(applicant=user.applicant_profile)
            except ApplicantProfile.DoesNotExist:
                return Application.objects.none()
        elif user.role == User.Role.RECRUITER:
            try:
                return Application.objects.filter(
                    internship__recruiter=user.recruiter_profile,
                    applicant_id__in=verified_profile_ids(),
                )
            except RecruiterProfile.DoesNotExist:
                return Application.objects.none()
        elif user.role == User.Role.ADMIN:
            return Application.objects.select_related('internship', 'applicant').filter(applicant_id__in=verified_profile_ids())
        return Application.objects.none()

    def perform_update(self, serializer):
        # only recruiters can change status
        if self.request.user.role == User.Role.RECRUITER:
            old_status = serializer.instance.status
            application = serializer.save()
            
            if application.status != old_status:
                from .models import Notification
                Notification.objects.create(
                    user=application.applicant.user,
                    message=f"Your application for {application.internship.title} is now {application.status}."
                )
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=['patch'])
    def read_all(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'success': True})

class InternshipInvitationViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.APPLICANT:
            return InternshipInvitation.objects.filter(student=user).exclude(status="withdrawn").order_by('-created_at')
        elif user.role == User.Role.RECRUITER:
            return InternshipInvitation.objects.filter(recruiter=user).order_by('-created_at')
        return InternshipInvitation.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsRecruiter])
    def send_invite(self, request):
        student_id = request.data.get('student_id')
        internship_id = request.data.get('internship_id')
        message = request.data.get('message', '')

        print(request.user)
        print(student_id)
        print(internship_id)

        try:
            student = User.objects.get(id=student_id, role=User.Role.APPLICANT)
            internship = Internship.objects.get(id=internship_id, recruiter=request.user.recruiter_profile)
            
            print(f"DEBUG BACKEND - student.id: {student.id}")
            print(f"DEBUG BACKEND - student.full_name: {student.get_full_name()}")
            
        except (User.DoesNotExist, Internship.DoesNotExist, RecruiterProfile.DoesNotExist):
            return Response({"error": "Invalid student or internship"}, status=status.HTTP_400_BAD_REQUEST)

        if InternshipInvitation.objects.filter(recruiter=request.user, student=student, internship=internship, status="pending").exists():
            return Response({"error": "A pending invitation already exists for this student and internship"}, status=status.HTTP_400_BAD_REQUEST)

        invitation = InternshipInvitation.objects.create(
            recruiter=request.user,
            student=student,
            internship=internship,
            message=message
        )
        print(f"DEBUG BACKEND - invitation.student.id: {invitation.student.id}")
        print(f"DEBUG BACKEND - invitation.student.full_name: {invitation.student.get_full_name()}")
        print(f"DEBUG BACKEND - invitation.status: {invitation.status}")

        notification = Notification.objects.create(
            user=student,
            title="New Internship Invitation",
            message=f"{request.user.recruiter_profile.company_name} invited you to apply for {internship.title}",
            type="invitation",
            related_invitation=invitation
        )

        print("DEBUG - notification.user:", notification.user)
        print("DEBUG - invitation.student:", invitation.student)
        print("DEBUG - invitation.status:", invitation.status)

        return Response(self.get_serializer(invitation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsRecruiter])
    def withdraw(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recruiter != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only withdraw invitations you sent.")
        
        if invitation.status != "pending":
            return Response({"error": "Only pending invitations can be withdrawn."}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = "withdrawn"
        invitation.save()

        # Optionally notify student it was withdrawn, though often it's just removed or hidden.
        # Here we'll skip sending a new notification to keep it quiet, but update status.

        return Response(self.get_serializer(invitation).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsApplicant])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        if invitation.student != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        
        if invitation.status != "pending":
            return Response({"error": "Invitation is already " + invitation.status}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = "accepted"
        invitation.responded_at = timezone.now()
        invitation.save()

        # create application
        Application.objects.get_or_create(
            applicant=invitation.student.applicant_profile,
            internship=invitation.internship,
            defaults={"source": "recruiter_invitation", "status": "PENDING"}
        )

        Notification.objects.create(
            user=invitation.recruiter,
            title="Invitation Accepted",
            message=f"{invitation.student.get_full_name()} accepted your internship invitation for {invitation.internship.title}",
            type="invitation_response"
        )

        return Response(self.get_serializer(invitation).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsApplicant])
    def reject(self, request, pk=None):
        invitation = self.get_object()
        if invitation.student != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        
        if invitation.status != "pending":
            return Response({"error": "Invitation is already " + invitation.status}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = "rejected"
        invitation.responded_at = timezone.now()
        invitation.save()

        Notification.objects.create(
            user=invitation.recruiter,
            title="Invitation Rejected",
            message=f"{invitation.student.get_full_name()} rejected your internship invitation for {invitation.internship.title}",
            type="invitation_response"
        )


        return Response(self.get_serializer(invitation).data)

from .models import Conversation, Message, InterviewSchedule
from .serializers import ConversationSerializer, MessageSerializer, InterviewScheduleSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'RECRUITER':
            return Conversation.objects.filter(recruiter=self.request.user).order_by('-created_at')
        return Conversation.objects.filter(student=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'RECRUITER':
            serializer.save(recruiter=self.request.user)
        else:
            serializer.save(student=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            return Message.objects.filter(conversation_id=conversation_id).order_by('created_at')
        
        if self.request.user.role == 'RECRUITER':
            return Message.objects.filter(conversation__recruiter=self.request.user).order_by('created_at')
        return Message.objects.filter(conversation__student=self.request.user).order_by('created_at')

    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation')
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Security check
        if self.request.user != conversation.recruiter and self.request.user != conversation.student:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
            
        serializer.save(sender=self.request.user, conversation=conversation)

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        message = self.get_object()
        if message.sender != request.user:
            message.is_read = True
            message.save()
        return Response(self.get_serializer(message).data)

class InterviewScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'RECRUITER':
            return InterviewSchedule.objects.filter(recruiter=self.request.user).order_by('interview_date', 'interview_time')
        return InterviewSchedule.objects.filter(student=self.request.user).order_by('interview_date', 'interview_time')

    def perform_create(self, serializer):
        if self.request.user.role != 'RECRUITER':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only recruiters can schedule interviews")
            
        interview = serializer.save(recruiter=self.request.user)
        
        Notification.objects.create(
            user=interview.student,
            title="Interview Scheduled",
            message=f"{interview.recruiter.recruiter_profile.company_name} scheduled a {interview.interview_type}",
            type="system"
        )
        
    @action(detail=True, methods=['patch'])
    def respond(self, request, pk=None):
        interview = self.get_object()
        if interview.student != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
            
        action = request.data.get('action')
        if action not in ['accepted', 'rejected']:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            
        interview.status = action
        interview.save()
        
        Notification.objects.create(
            user=interview.recruiter,
            title=f"Interview {action.capitalize()}",
            message=f"{interview.student.get_full_name()} has {action} your interview schedule.",
            type="system"
        )
        
        return Response(self.get_serializer(interview).data)
