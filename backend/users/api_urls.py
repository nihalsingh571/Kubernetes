from django.urls import path

from .views import (
    ChangePasswordView,
    DisableTwoFactorView,
    EnableTwoFactorView,
    VerifyLoginOTPView,
    VerifyTwoFactorSetupView,
)

app_name = 'users-api'

urlpatterns = [
    path('change-password', ChangePasswordView.as_view(), name='change-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password-slash'),
    path('enable-2fa/', EnableTwoFactorView.as_view(), name='enable-2fa'),
    path('verify-2fa/', VerifyTwoFactorSetupView.as_view(), name='verify-2fa'),
    path('disable-2fa/', DisableTwoFactorView.as_view(), name='disable-2fa'),
    path('verify-login-otp/', VerifyLoginOTPView.as_view(), name='verify-login-otp'),
]
