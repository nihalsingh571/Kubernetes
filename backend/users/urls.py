from django.urls import path

from .views import (
    GithubOAuthCallbackView,
    GithubOAuthStartView,
    GoogleOAuthCallbackView,
    GoogleOAuthStartView,
    RecaptchaLoginView,
)

app_name = 'users'

urlpatterns = [
    path('login/', RecaptchaLoginView.as_view(), name='recaptcha-login'),
    path('google/login/', GoogleOAuthStartView.as_view(), name='google-login'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google-callback'),
    path('github/login/', GithubOAuthStartView.as_view(), name='github-login'),
    path('github/callback/', GithubOAuthCallbackView.as_view(), name='github-callback'),
]
