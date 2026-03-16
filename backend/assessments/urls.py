from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SkillViewSet, AssessmentViewSet, QuestionAdminViewSet

router = DefaultRouter()
router.register(r'skills', SkillViewSet)
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'questions', QuestionAdminViewSet, basename='assessment-questions')

urlpatterns = [
    path('', include(router.urls)),
]
