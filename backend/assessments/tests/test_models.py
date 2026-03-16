import pytest
from django.contrib.auth import get_user_model
from assessments.models import Skill, Question, AssessmentAttempt

User = get_user_model()

@pytest.mark.django_db
def test_skill_creation():
    """Test creating a skill"""
    skill = Skill.objects.create(name="Python")
    assert skill.name == "Python"
    assert str(skill) == "Python"

@pytest.mark.django_db
def test_question_creation():
    """Test creating a question"""
    skill = Skill.objects.create(name="Python")

    question = Question.objects.create(
        skill=skill,
        text="What is Python?",
        options=["Language", "Animal", "Food", "City"],
        correct_option=0
    )

    assert question.skill == skill
    assert question.correct_option == 0
    assert len(question.options) == 4

@pytest.mark.django_db
def test_assessment_attempt():
    """Test creating an assessment attempt"""
    user = User.objects.create_user(
        username="testuser",
        email="test@test.com",
        password="pass"
    )

    skill = Skill.objects.create(name="Python")

    attempt = AssessmentAttempt.objects.create(
        user=user,
        status="COMPLETED",
        score=0.85
    )
    attempt.skills_assessed.add(skill)

    assert attempt.user == user
    assert attempt.status == "COMPLETED"
    assert attempt.score == 0.85
    assert skill in attempt.skills_assessed.all()