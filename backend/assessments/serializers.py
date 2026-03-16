from rest_framework import serializers
from .models import Skill, Question, AssessmentAttempt

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']
        extra_kwargs = {'name': {'required': True}}

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'options'] # Exclude correct_option

class QuestionAdminSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'skill', 'skill_name', 'text', 'options', 'correct_option', 'created_at']

class AssessmentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentAttempt
        fields = ['id', 'status', 'score', 'final_vsps', 'start_time', 'end_time']


class AssessmentAttemptDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    score_percent = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id',
            'user_email',
            'user_name',
            'skills',
            'status',
            'score',
            'score_percent',
            'final_vsps',
            'start_time',
            'end_time',
            'violation_count',
            'violation_log',
            'speed_score',
        ]

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.email

    def get_skills(self, obj):
        return [skill.name for skill in obj.skills_assessed.all()]

    def get_score_percent(self, obj):
        if obj.score is None:
            return 0.0
        return round(obj.score * 100, 1)

class AssessmentSubmitSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    answers = serializers.JSONField() # {question_id: selected_option_index}
    time_taken = serializers.JSONField() # {question_id: seconds}
    proctoring_log = serializers.JSONField(required=False, default=list)
