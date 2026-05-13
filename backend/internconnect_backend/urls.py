from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import RecruiterAwareTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('djoser.urls')),
    path('auth/jwt/create/', RecruiterAwareTokenObtainPairView.as_view(), name='jwt-create'),
    path('auth/', include('djoser.urls.jwt')),
    path('auth/social/', include('users.urls')),
    path('api/auth/', include('users.api_urls')),
    path('api/', include('users.admin_urls')),
    path('api/', include('core.urls')),
    path('api/', include('assessments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
