from rest_framework.routers import DefaultRouter

from .views import AdminUserViewSet

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')

urlpatterns = router.urls
