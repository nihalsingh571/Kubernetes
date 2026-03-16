import pytest
from django.contrib.auth import get_user_model
from core.models import ApplicantProfile, RecruiterProfile, Internship, Application

User = get_user_model()

@pytest.mark.django_db
def test_applicant_profile_creation():
    """Test creating an applicant profile"""
    user = User.objects.create_user(
        username="applicant",
        email="app@test.com",
        password="pass",
        role="APPLICANT"
    )

    profile = ApplicantProfile.objects.create(
        user=user,
        skills=["Python", "Django"],
        college="Test University",
        degree="B.Tech"
    )

    assert profile.user == user
    assert "Python" in profile.skills
    assert profile.college == "Test University"
    assert profile.vsps_score == 0.0

@pytest.mark.django_db
def test_recruiter_profile_creation():
    """Test creating a recruiter profile"""
    user = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )

    profile = RecruiterProfile.objects.create(
        user=user,
        company_name="Test Corp",
        company_website="https://test.com"
    )

    assert profile.user == user
    assert profile.company_name == "Test Corp"
    assert profile.is_verified == False

@pytest.mark.django_db
def test_internship_creation():
    """Test creating an internship"""
    user = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )

    recruiter_profile = RecruiterProfile.objects.create(
        user=user,
        company_name="Test Corp"
    )

    internship = Internship.objects.create(
        recruiter=recruiter_profile,
        title="Backend Developer Intern",
        description="Develop backend services",
        location="Remote",
        required_skills=["Python", "Django"]
    )

    assert internship.title == "Backend Developer Intern"
    assert internship.location == "Remote"
    assert "Python" in internship.required_skills
    assert internship.recruiter == recruiter_profile