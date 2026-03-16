import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_user_registration():
    """Test user registration functionality"""
    user = User.objects.create_user(
        username="testuser",
        email="test@test.com",
        password="password123",
        role="APPLICANT"
    )

    assert user.username == "testuser"
    assert user.email == "test@test.com"
    assert user.role == "APPLICANT"
    assert user.check_password("password123")

@pytest.mark.django_db
def test_login():
    """Test JWT login API"""
    client = APIClient()

    # Create a test user
    User.objects.create_user(
        username="anjali",
        email="anjali@test.com",
        password="test1234",
        role="APPLICANT"
    )

    # Test login (using email as login field per DJOSER settings)
    response = client.post("/auth/jwt/create/", {
        "email": "anjali@test.com",  # Use email field
        "password": "test1234"
    })

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data

@pytest.mark.django_db
def test_user_roles():
    """Test different user roles"""
    # Test applicant
    applicant = User.objects.create_user(
        username="applicant",
        email="app@test.com",
        password="pass",
        role="APPLICANT"
    )
    assert applicant.role == "APPLICANT"

    # Test recruiter
    recruiter = User.objects.create_user(
        username="recruiter",
        email="rec@test.com",
        password="pass",
        role="RECRUITER"
    )
    assert recruiter.role == "RECRUITER"

    # Test admin
    admin = User.objects.create_user(
        username="admin",
        email="admin@test.com",
        password="pass",
        role="ADMIN"
    )
    assert admin.role == "ADMIN"