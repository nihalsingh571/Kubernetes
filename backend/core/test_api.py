import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from core.models import (
    ApplicantProfile, RecruiterProfile, Internship, Application
)
from users.models import User

User = get_user_model()


def make_user(email, role, first_name='Test', last_name='User'):
    """Helper to create a user with required fields."""
    username = email.split('@')[0]
    return User.objects.create_user(
        email=email,
        password='testpass123',
        role=role,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )


class ApplicantProfileAPITests(APITestCase):
    """Test ApplicantProfile endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.applicant_user = make_user('applicant@example.com', 'APPLICANT')
        self.applicant_profile = ApplicantProfile.objects.create(
            user=self.applicant_user,
            vsps_score=0.75
        )

    def test_get_own_applicant_profile(self):
        """Test getting own applicant profile"""
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get('/api/applicants/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vsps_score'], 0.75)

    def test_update_own_applicant_profile(self):
        """Test updating own applicant profile"""
        self.client.force_authenticate(user=self.applicant_user)
        data = {'vsps_score': 0.85, 'education': 'B.Tech'}
        response = self.client.patch('/api/applicants/me/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vsps_score'], 0.85)
        self.assertEqual(response.data['education'], 'B.Tech')

    def test_unauthenticated_cannot_access_profile(self):
        """Test that unauthenticated users cannot access profiles"""
        response = self.client.get('/api/applicants/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_applicant_cannot_view_other_profiles(self):
        """Test that applicants can only view their own profile"""
        other_user = make_user('other@example.com', 'APPLICANT', first_name='Other', last_name='User')
        other_profile = ApplicantProfile.objects.create(
            user=other_user,
            vsps_score=0.80
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/applicants/{other_profile.id}/')
        
        # Applicants should only see their own profile via 'me' endpoint
        # Attempting to get specific profile should be restricted
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


class RecruiterProfileAPITests(APITestCase):
    """Test RecruiterProfile endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.recruiter_user = make_user('recruiter@example.com', 'RECRUITER')
        self.recruiter_profile = RecruiterProfile.objects.create(
            user=self.recruiter_user,
            company_name='Tech Corp',
            is_verified=False
        )

    def test_get_own_recruiter_profile(self):
        """Test getting own recruiter profile"""
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.get('/api/recruiters/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company_name'], 'Tech Corp')

    def test_update_recruiter_profile(self):
        """Test updating recruiter profile"""
        self.client.force_authenticate(user=self.recruiter_user)
        data = {'company_website': 'https://techcorp.com'}
        response = self.client.patch('/api/recruiters/me/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company_website'], 'https://techcorp.com')

    def test_admin_can_verify_recruiter(self):
        """Test that admins can verify recruiters"""
        admin_user = make_user('admin@example.com', 'ADMIN', first_name='Admin', last_name='User')
        
        self.client.force_authenticate(user=admin_user)
        data = {'is_verified': True}
        response = self.client.patch(f'/api/recruiters/{self.recruiter_profile.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.recruiter_profile.refresh_from_db()
        self.assertTrue(self.recruiter_profile.is_verified)

    def test_recruiter_cannot_verify_themselves(self):
        """Test that recruiters cannot verify themselves"""
        self.client.force_authenticate(user=self.recruiter_user)
        data = {'is_verified': True}
        response = self.client.patch(f'/api/recruiters/{self.recruiter_profile.id}/', data)
        
        # Recruiters should only access their own profile via 'me'
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


class InternshipAPITests(APITestCase):
    """Test Internship endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create recruiter
        self.recruiter_user = make_user('recruiter@example.com', 'RECRUITER')
        self.recruiter_profile = RecruiterProfile.objects.create(
            user=self.recruiter_user,
            company_name='Tech Corp'
        )
        
        # Create internship
        self.internship = Internship.objects.create(
            title='Python Developer',
            recruiter=self.recruiter_profile,
            required_skills=['Python', 'Django']
        )

    def test_get_internships_list(self):
        """Test getting list of internships"""
        response = self.client.get('/api/internships/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_recruiter_can_create_internship(self):
        """Test that recruiters can create internships"""
        self.client.force_authenticate(user=self.recruiter_user)
        data = {
            'title': 'Frontend Developer',
            'required_skills': ['React', 'JavaScript']
        }
        response = self.client.post('/api/internships/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Frontend Developer')

    def test_applicant_cannot_create_internship(self):
        """Test that applicants cannot create internships"""
        applicant_user = make_user('applicant@example.com', 'APPLICANT')
        ApplicantProfile.objects.create(user=applicant_user)
        
        self.client.force_authenticate(user=applicant_user)
        data = {
            'title': 'Backend Developer',
            'required_skills': ['Python']
        }
        response = self.client.post('/api/internships/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_applicant_can_apply_to_internship(self):
        """Test that applicants can apply to internships"""
        applicant_user = make_user('applicant@example.com', 'APPLICANT')
        applicant_profile = ApplicantProfile.objects.create(user=applicant_user)
        
        self.client.force_authenticate(user=applicant_user)
        response = self.client.post(f'/api/internships/{self.internship.id}/apply/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify application was created
        self.assertTrue(
            Application.objects.filter(
                internship=self.internship,
                applicant=applicant_profile
            ).exists()
        )

    def test_applicant_cannot_apply_twice(self):
        """Test that applicants cannot apply twice to same internship"""
        applicant_user = make_user('applicant@example.com', 'APPLICANT')
        applicant_profile = ApplicantProfile.objects.create(user=applicant_user)
        
        # First application
        Application.objects.create(
            internship=self.internship,
            applicant=applicant_profile
        )
        
        # Try to apply again
        self.client.force_authenticate(user=applicant_user)
        response = self.client.post(f'/api/internships/{self.internship.id}/apply/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_recruiter_cannot_apply_to_internship(self):
        """Test that recruiters cannot apply to internships"""
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.post(f'/api/internships/{self.internship.id}/apply/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ApplicationAPITests(APITestCase):
    """Test Application endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create recruiter and internship
        self.recruiter_user = make_user('recruiter@example.com', 'RECRUITER')
        self.recruiter_profile = RecruiterProfile.objects.create(
            user=self.recruiter_user,
            company_name='Tech Corp'
        )
        self.internship = Internship.objects.create(
            title='Python Developer',
            recruiter=self.recruiter_profile
        )
        
        # Create applicant and application
        self.applicant_user = make_user('applicant@example.com', 'APPLICANT')
        self.applicant_profile = ApplicantProfile.objects.create(user=self.applicant_user)
        self.application = Application.objects.create(
            internship=self.internship,
            applicant=self.applicant_profile,
            status='PENDING'
        )

    def test_applicant_can_view_their_applications(self):
        """Test that applicants can view their own applications"""
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get('/api/applications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'PENDING')

    def test_recruiter_can_view_internship_applicants(self):
        """Test that recruiters can view applicants for their internships"""
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.get(f'/api/internships/{self.internship.id}/applicants/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_recruiter_can_review_application(self):
        """Test that recruiters can review applications"""
        self.client.force_authenticate(user=self.recruiter_user)
        data = {'status': 'ACCEPTED'}
        response = self.client.patch(f'/api/applications/{self.application.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, 'ACCEPTED')
