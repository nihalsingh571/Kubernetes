import pytest
from django.contrib.auth import get_user_model
from core.models import ApplicantProfile, RecruiterProfile, Internship, Application

User = get_user_model()

@pytest.mark.django_db
def test_internship_application():
    """Test applying to an internship"""
    # Create recruiter
    recruiter_user = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )
    recruiter_profile = RecruiterProfile.objects.create(
        user=recruiter_user,
        company_name="Test Corp"
    )

    # Create internship
    internship = Internship.objects.create(
        recruiter=recruiter_profile,
        title="ML Intern",
        description="Machine learning internship",
        location="Remote"
    )

    # Create applicant
    applicant_user = User.objects.create_user(
        username="student",
        email="student@test.com",
        password="pass",
        role="APPLICANT"
    )
    applicant_profile = ApplicantProfile.objects.create(
        user=applicant_user,
        skills=["Python", "ML"]
    )

    # Create application
    application = Application.objects.create(
        applicant=applicant_profile,
        internship=internship,
        status="PENDING"
    )

    assert application.status == "PENDING"
    assert application.applicant == applicant_profile
    assert application.internship == internship

@pytest.mark.django_db
def test_application_status_update():
    """Test updating application status"""
    # Create users and profiles
    recruiter_user = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )
    recruiter_profile = RecruiterProfile.objects.create(
        user=recruiter_user,
        company_name="Test Corp"
    )

    internship = Internship.objects.create(
        recruiter=recruiter_profile,
        title="Dev Intern"
    )

    applicant_user = User.objects.create_user(
        username="student",
        email="student@test.com",
        password="pass",
        role="APPLICANT"
    )
    applicant_profile = ApplicantProfile.objects.create(
        user=applicant_user
    )

    application = Application.objects.create(
        applicant=applicant_profile,
        internship=internship,
        status="PENDING"
    )

    # Update status
    application.status = "ACCEPTED"
    application.save()

    application.refresh_from_db()
    assert application.status == "ACCEPTED"

@pytest.mark.django_db
def test_unique_application_constraint():
    """Test that a user can only apply once to an internship"""
    # Create users and profiles
    recruiter_user = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )
    recruiter_profile = RecruiterProfile.objects.create(
        user=recruiter_user,
        company_name="Test Corp"
    )

    internship = Internship.objects.create(
        recruiter=recruiter_profile,
        title="Dev Intern"
    )

    applicant_user = User.objects.create_user(
        username="student",
        email="student@test.com",
        password="pass",
        role="APPLICANT"
    )
    applicant_profile = ApplicantProfile.objects.create(
        user=applicant_user
    )

    # First application
    Application.objects.create(
        applicant=applicant_profile,
        internship=internship,
        status="PENDING"
    )

    # Second application should fail due to unique constraint
    with pytest.raises(Exception):  # IntegrityError
        Application.objects.create(
            applicant=applicant_profile,
            internship=internship,
            status="PENDING"
        )