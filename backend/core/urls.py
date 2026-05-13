from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApplicantProfileViewSet,
    AdminNotificationViewSet,
    RecruiterProfileViewSet,
    InternshipViewSet,
    ApplicationViewSet,
    PlatformSettingsViewSet,
    admin_students,
    send_recruiter_work_email_otp,
    verify_recruiter_work_email_otp,
    NotificationViewSet,
    InternshipInvitationViewSet,
    ConversationViewSet,
    MessageViewSet,
    InterviewScheduleViewSet,
)

router = DefaultRouter()
router.register(r'applicants', ApplicantProfileViewSet, basename='applicant')
router.register(r'recruiters', RecruiterProfileViewSet, basename='recruiter')
router.register(r'admin-notifications', AdminNotificationViewSet, basename='admin-notification')
router.register(r'internships', InternshipViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'platform-settings', PlatformSettingsViewSet, basename='platform-settings')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'invitations', InternshipInvitationViewSet, basename='invitation')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'interviews', InterviewScheduleViewSet, basename='interview')

urlpatterns = [
    path('admin/students/', admin_students, name='admin-students'),
    path('recruiter/send-otp', send_recruiter_work_email_otp, name='recruiter-send-otp'),
    path('recruiter/send-otp/', send_recruiter_work_email_otp, name='recruiter-send-otp-slash'),
    path('recruiter/verify-otp', verify_recruiter_work_email_otp, name='recruiter-verify-otp'),
    path('recruiter/verify-otp/', verify_recruiter_work_email_otp, name='recruiter-verify-otp-slash'),
    path('recruiters/send-otp/', send_recruiter_work_email_otp, name='recruiters-send-otp'),
    path('recruiters/verify-otp/', verify_recruiter_work_email_otp, name='recruiters-verify-otp'),
    path('', include(router.urls)),
]
