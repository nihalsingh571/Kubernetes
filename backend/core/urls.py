from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicantProfileViewSet, RecruiterProfileViewSet, InternshipViewSet, ApplicationViewSet

router = DefaultRouter()
router.register(r'applicants', ApplicantProfileViewSet, basename='applicant')
router.register(r'recruiters', RecruiterProfileViewSet, basename='recruiter')
router.register(r'internships', InternshipViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
]
