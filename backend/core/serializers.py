import json

from rest_framework import serializers
from .models import AdminNotification, ApplicantProfile, RecruiterProfile, Internship

class ApplicantProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    # expose the degree field under the more familiar name "education" for clients
    education = serializers.CharField(source='degree', required=False, allow_blank=True)
    university = serializers.CharField(source='college', required=False, allow_blank=True)
    github = serializers.URLField(source='github_link', required=False, allow_blank=True)
    linkedin = serializers.URLField(source='linkedin_link', required=False, allow_blank=True)
    resume_url = serializers.SerializerMethodField()
    profile_completion_status = serializers.SerializerMethodField()
    eligibility = serializers.SerializerMethodField()
    collegeEmail = serializers.EmailField(source='university_email', required=False, allow_blank=True)
    collegeEmailVerified = serializers.BooleanField(source='university_email_verified', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    verified_skills = serializers.ListField(child=serializers.CharField(), source='verified_skill_names', read_only=True)

    class Meta:
        model = ApplicantProfile
        # include education field in the response so clients can update it
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'skills',
                  'university_email', 'college', 'university', 'degree', 'education', 'major', 'graduation_year',
                  'interested_role',
                  'assessment_accuracy', 'assessment_speed_score', 'assessment_skip_penalty',
                  'assessment_difficulty_score', 'assessment_consistency',
                  'integrity_factor', 'vsps_score', 'recency_score',
                  'mobile_number', 'github_link', 'linkedin_link', 'github', 'linkedin',
                  'resume', 'resume_url', 'profile_completion_status', 'eligibility',
                  'collegeEmail', 'collegeEmailVerified', 'university_email_verified',
                  'user_id', 'verified_skills']
        extra_kwargs = {
            'email': {'required': False},
            # degree/education are optional
            'degree': {'required': False},
            'major': {'required': False},
            'graduation_year': {'required': False},
            'university_email': {'required': False},
            'university_email_verified': {'read_only': True},
            'resume': {'required': False},
        }

    def get_resume_url(self, obj):
        if not obj.resume:
            return ''
        request = self.context.get('request')
        url = obj.resume.url
        return request.build_absolute_uri(url) if request else url

    def get_profile_completion_status(self, obj):
        required_values = obj.required_profile_values
        completed = sum(1 for value in required_values.values() if bool(value))
        total = len(required_values)
        return {
            'completed_fields': completed,
            'total_fields': total,
            'percentage': obj.profile_completion_percentage,
            'is_complete': obj.is_profile_complete,
            'missing_fields': obj.missing_required_fields,
        }

    def get_eligibility(self, obj):
        missing_reasons = []
        if not obj.is_profile_complete:
            missing_reasons.append('Complete all required profile fields.')
        if not obj.university_email_verified:
            missing_reasons.append('Verify your college email address.')
        return {
            'is_profile_complete': obj.is_profile_complete,
            'profile_completion_percentage': obj.profile_completion_percentage,
            'college_email_verified': obj.university_email_verified,
            'is_eligible_for_assessments': obj.is_eligible_for_assessments,
            'is_visible_to_recruiters': obj.is_verified_profile,
            'is_verified_profile': obj.is_verified_profile,
            'missing_fields': obj.missing_required_fields,
            'missing_reasons': missing_reasons,
        }

    def validate_skills(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = [skill.strip() for skill in value.split(',') if skill.strip()]
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list or comma-separated string.')
        return value

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
            if data.get('graduation_year') == '':
                data['graduation_year'] = None
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        # Handle User update (email)
        user_data = {}
        if 'user' in validated_data:
             user_nested = validated_data.pop('user')
             if 'email' in user_nested:
                 user_data['email'] = user_nested['email']
        
        # Update Profile fields
        previous_university_email = instance.university_email
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if instance.university_email != previous_university_email:
            instance.university_email_verified = False
            instance.university_email_otp_hash = ''
            instance.university_email_otp_expires_at = None
        instance.save()

        # Update User fields if any
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
            
        return instance

class RecruiterProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    recruiter_name = serializers.CharField(source='user.get_full_name', read_only=True)
    work_email = serializers.EmailField(source='user.email', read_only=True)
    approval_status = serializers.CharField(read_only=True)
    linkedin = serializers.URLField(source='company_linkedin', required=False, allow_blank=True)
    signup_date = serializers.DateTimeField(source='user.date_joined', read_only=True)
    
    class Meta:
        model = RecruiterProfile
        fields = [
            'id',
            'email',
            'work_email',
            'recruiter_name',
            'company_name',
            'company_website',
            'designation',
            'company_linkedin',
            'linkedin',
            'company_description',
            'phone_number',
            'company_size',
            'industry',
            'company_location',
            'status',
            'work_email_verified',
            'verified_by_admin',
            'verified_at',
            'approval_status',
            'is_verified',
            'admin_notified_at',
            'signup_date',
        ]
        read_only_fields = [
            'work_email_verified',
            'verified_by_admin',
            'verified_at',
            'approval_status',
            'admin_notified_at',
            'is_verified',
            'status',
            'signup_date',
        ]


class AdminNotificationSerializer(serializers.ModelSerializer):
    recruiter_company = serializers.CharField(source='recruiter.company_name', read_only=True)
    recruiter_email = serializers.EmailField(source='recruiter.user.email', read_only=True)

    class Meta:
        model = AdminNotification
        fields = [
            'id',
            'type',
            'priority',
            'message',
            'recruiter',
            'recruiter_company',
            'recruiter_email',
            'is_read',
            'created_at',
        ]

class InternshipSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.CharField(source='recruiter.user.get_full_name', read_only=True)
    company_name = serializers.CharField(source='recruiter.company_name', read_only=True)
    recruiter_email = serializers.EmailField(source='recruiter.user.email', read_only=True)
    # allow description/location/skills to be omitted when creating
    description = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False)
    required_skills = serializers.ListField(child=serializers.CharField(), required=False)
    preferred_skills = serializers.ListField(child=serializers.CharField(), required=False)
    work_type = serializers.CharField(required=False)
    stipend = serializers.IntegerField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=Internship.STATUS_CHOICES, required=False)
    responsibilities = serializers.CharField(required=False, allow_blank=True)
    duration = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    deadline = serializers.DateField(required=False, allow_null=True)
    application_eligibility = serializers.SerializerMethodField()
    
    class Meta:
        model = Internship
        fields = [
            'id',
            'title',
            'description',
            'location',
            'required_skills',
            'preferred_skills',
            'work_type',
            'stipend',
            'status',
            'responsibilities',
            'duration',
            'start_date',
            'deadline',
            'created_at',
            'recruiter',
            'recruiter_name',
            'recruiter_email',
            'company_name',
            # Trust Score fields (proposal §4)
            'recruiter_rating',
            'recency_score',
            'application_eligibility',
        ]
        read_only_fields = ['recruiter', 'created_at']

    def get_application_eligibility(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated or getattr(user, 'role', None) != 'APPLICANT':
            return None
        profile = getattr(user, 'applicant_profile', None)
        if not profile:
            return {
                'can_apply': False,
                'missing_required_skills': obj.required_skills or [],
                'verified_skills': [],
                'message': 'Complete your student profile before applying.',
            }
        missing = profile.missing_required_skills_for(obj.required_skills)
        can_apply = profile.is_eligible_for_assessments and not missing
        if not profile.is_eligible_for_assessments:
            message = 'Complete your profile and verify your college email before applying.'
        elif missing:
            message = f"Verify required skills first: {', '.join(missing)}."
        else:
            message = 'You are eligible to apply.'
        return {
            'can_apply': can_apply,
            'missing_required_skills': missing,
            'verified_skills': profile.verified_skill_names,
            'message': message,
        }

from .models import Application

class ApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.user.get_full_name', read_only=True)
    applicant_email = serializers.EmailField(source='applicant.user.email', read_only=True)
    applicant_vsps = serializers.FloatField(source='applicant.vsps_score', read_only=True)
    # Include applicant details for recruiter view
    
    class Meta:
        model = Application
        fields = ['id', 'internship', 'applicant', 'status', 'source', 'applied_at', 
                  'applicant_name', 'applicant_email', 'applicant_vsps']
        # make status writable; viewset enforces that only recruiters can change it
        read_only_fields = ['applicant', 'applied_at']

from .models import Notification, InternshipInvitation

class InternshipInvitationSerializer(serializers.ModelSerializer):
    internship_title = serializers.CharField(source='internship.title', read_only=True)
    company_name = serializers.CharField(source='recruiter.recruiter_profile.company_name', read_only=True)
    recruiter_name = serializers.CharField(source='recruiter.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    stipend = serializers.IntegerField(source='internship.stipend', read_only=True)
    work_type = serializers.CharField(source='internship.work_type', read_only=True)
    duration = serializers.CharField(source='internship.duration', read_only=True)
    location = serializers.CharField(source='internship.location', read_only=True)
    required_skills = serializers.JSONField(source='internship.required_skills', read_only=True)

    class Meta:
        model = InternshipInvitation
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    related_invitation_details = InternshipInvitationSerializer(source='related_invitation', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'is_read', 'related_invitation', 'related_invitation_details', 'created_at']
        read_only_fields = ['user', 'created_at']

from .models import Conversation, Message, InterviewSchedule

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['conversation', 'sender', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    recruiter_company = serializers.CharField(source='recruiter.recruiter_profile.company_name', read_only=True)
    internship_title = serializers.CharField(source='internship.title', read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = '__all__'

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

class InterviewScheduleSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    recruiter_company = serializers.CharField(source='recruiter.recruiter_profile.company_name', read_only=True)
    internship_title = serializers.CharField(source='internship.title', read_only=True)

    class Meta:
        model = InterviewSchedule
        fields = '__all__'
        read_only_fields = ['recruiter', 'created_at']
