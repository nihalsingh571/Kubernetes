from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


def normalize_skill_names(skills):
    if not isinstance(skills, list):
        return []
    names = []
    for skill in skills:
        if isinstance(skill, str):
            label = skill.strip()
        elif isinstance(skill, dict):
            label = (skill.get('name') or skill.get('label') or '').strip()
        else:
            label = ''
        if label:
            names.append(label)
    return names


def normalize_skill_key(skill):
    return (skill or '').strip().lower()

class ApplicantProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applicant_profile')
    skills = models.JSONField(default=list)  # List of strings e.g. ["Python", "Django"]
    university_email = models.EmailField(blank=True)
    university_email_verified = models.BooleanField(default=False)
    university_email_otp_hash = models.CharField(max_length=128, blank=True)
    university_email_otp_expires_at = models.DateTimeField(null=True, blank=True)
    college = models.CharField(max_length=255, blank=True)
    degree = models.CharField(max_length=255, blank=True)
    major = models.CharField(max_length=255, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    interested_role = models.CharField(max_length=255, blank=True)
    
    # Micro-assessment scores (normalized 0-1)
    assessment_accuracy = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    assessment_speed_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    assessment_skip_penalty = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])

    # VSPS extended parameters (proposal §3.1)
    assessment_difficulty_score = models.FloatField(
        default=0.5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Avg difficulty weight of questions answered (easy=0.5, medium=0.75, hard=1.0)",
    )
    assessment_consistency = models.FloatField(
        default=0.5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Stability of accuracy across the last 3 assessment attempts",
    )

    # Proctoring integrity multiplier for Trust Score (proposal §3.2)
    integrity_factor = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Anti-cheating confidence: 1.0=clean, 0.7=multiple violations",
    )

    # Computed VSPS
    vsps_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])

    # Recency of activity (normalized 0-1)
    recency_score = models.FloatField(default=1.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])

    # Contact & Social
    mobile_number = models.CharField(max_length=20, blank=True)
    github_link = models.URLField(blank=True)
    linkedin_link = models.URLField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} Profile"

    @property
    def required_profile_values(self):
        return {
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'username': self.user.username,
            'email': self.user.email,
            'college_email': self.university_email,
            'university': self.college,
            'degree': self.degree,
            'major': self.major,
            'graduation_year': self.graduation_year,
            'interested_role': self.interested_role,
            'skills': normalize_skill_names(self.skills),
            'github': self.github_link,
            'linkedin': self.linkedin_link,
            'resume': self.resume,
        }

    @property
    def missing_required_fields(self):
        return [field for field, value in self.required_profile_values.items() if not bool(value)]

    @property
    def profile_completion_percentage(self):
        values = self.required_profile_values
        completed = sum(1 for value in values.values() if bool(value))
        return round((completed / len(values)) * 100)

    @property
    def is_profile_complete(self):
        return self.profile_completion_percentage == 100

    @property
    def is_eligible_for_assessments(self):
        return self.is_profile_complete and self.university_email_verified

    @property
    def is_verified_profile(self):
        return self.is_eligible_for_assessments

    @property
    def university_email_otp_is_active(self):
        return bool(
            self.university_email_otp_hash
            and self.university_email_otp_expires_at
            and self.university_email_otp_expires_at > timezone.now()
        )

    @property
    def verified_skill_names(self):
        verified = []
        for skill in self.skills if isinstance(self.skills, list) else []:
            if isinstance(skill, str):
                continue
            if isinstance(skill, dict) and (skill.get('status') or '').lower() == 'verified':
                label = (skill.get('name') or skill.get('label') or '').strip()
                if label:
                    verified.append(label)
        return verified

    def missing_required_skills_for(self, required_skills):
        verified_keys = {normalize_skill_key(skill) for skill in self.verified_skill_names}
        missing = []
        for skill in required_skills or []:
            label = skill.get('name') if isinstance(skill, dict) else str(skill)
            label = label.strip()
            if label and normalize_skill_key(label) not in verified_keys:
                missing.append(label)
        return missing

class RecruiterProfile(models.Model):
    STATUS_PENDING_ADMIN_REVIEW = 'pending_admin_review'
    STATUS_APPROVED_PENDING_EMAIL_VERIFICATION = 'approved_pending_email_verification'
    STATUS_ACTIVE = 'active'
    STATUS_REJECTED = 'rejected'
    STATUS_SUSPENDED = 'suspended'
    STATUS_CHOICES = [
        (STATUS_PENDING_ADMIN_REVIEW, 'Pending Admin Review'),
        (STATUS_APPROVED_PENDING_EMAIL_VERIFICATION, 'Approved Pending Email Verification'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name = models.CharField(max_length=255)
    company_website = models.URLField(blank=True)
    designation = models.CharField(max_length=255, blank=True)
    company_linkedin = models.URLField(blank=True)
    company_description = models.TextField(blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    industry = models.CharField(max_length=120, blank=True)
    company_location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_PENDING_ADMIN_REVIEW)
    work_email_verified = models.BooleanField(default=False)
    work_email_otp_hash = models.CharField(max_length=128, blank=True)
    work_email_otp_expires_at = models.DateTimeField(null=True, blank=True)
    admin_notified_at = models.DateTimeField(null=True, blank=True)
    verified_by_admin = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return self.company_name

    @property
    def work_email(self):
        return self.user.email

    @property
    def work_email_otp_is_active(self):
        return bool(
            self.work_email_otp_hash
            and self.work_email_otp_expires_at
            and self.work_email_otp_expires_at > timezone.now()
        )

    @property
    def approval_status(self):
        return self.status

    @property
    def linkedin(self):
        return self.company_linkedin


class AdminNotification(models.Model):
    TYPE_RECRUITER_VERIFICATION = 'recruiter_verification'
    PRIORITY_HIGH = 'high'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_LOW = 'low'

    TYPE_CHOICES = [
        (TYPE_RECRUITER_VERIFICATION, 'Recruiter Verification'),
    ]
    PRIORITY_CHOICES = [
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_LOW, 'Low'),
    ]

    type = models.CharField(max_length=80, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    message = models.CharField(max_length=255)
    recruiter = models.ForeignKey(RecruiterProfile, on_delete=models.CASCADE, related_name='admin_notifications', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.message

class Internship(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('REVIEWING', 'Reviewing'),
        ('PAUSED', 'Paused'),
        ('CLOSED', 'Closed'),
    ]

    recruiter = models.ForeignKey(RecruiterProfile, on_delete=models.CASCADE, related_name='internships')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, default='Remote')
    work_type = models.CharField(max_length=50, default='On-site')
    stipend = models.PositiveIntegerField(null=True, blank=True)
    required_skills = models.JSONField(default=list)
    preferred_skills = models.JSONField(default=list, blank=True)
    responsibilities = models.TextField(blank=True)
    duration = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    # Trust Score parameters (proposal §4)
    recruiter_rating = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Platform-assigned recruiter quality score (0–1)",
    )
    recency_score = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Freshness of this internship listing (1=very recent)",
    )

class PlatformSettings(models.Model):
    """Global platform settings"""
    enforce_2fa_for_admins_recruiters = models.BooleanField(default=True)
    auto_approve_verified_recruiters = models.BooleanField(default=False)
    recruiter_rating = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    recency_score = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )

    # Singleton pattern - only one instance should exist
    class Meta:
        verbose_name = "Platform Setting"
        verbose_name_plural = "Platform Settings"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and PlatformSettings.objects.exists():
            raise ValueError("Only one PlatformSettings instance can exist")
        return super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get the singleton platform settings instance"""
        settings, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'enforce_2fa_for_admins_recruiters': True,
                'auto_approve_verified_recruiters': False,
            },
        )
        return settings

    def __str__(self):
        return "Platform Settings"

class Application(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('REVIEWED', 'Reviewed'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]
    
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(ApplicantProfile, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    source = models.CharField(max_length=50, default='student_application')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('internship', 'applicant')

    def __str__(self):
        return f"{self.applicant.user.email} -> {self.internship.title}"


class InternshipInvitation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_invitations")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_invitations")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("invitation", "Invitation"),
        ("message", "Message"),
        ("application", "Application"),
        ("system", "System"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="system")
    is_read = models.BooleanField(default=False)
    related_invitation = models.ForeignKey(
        InternshipInvitation,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

class Conversation(models.Model):
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recruiter_conversations")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_conversations")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    MESSAGE_TYPES = [
        ("text", "Text"),
        ("interview", "Interview"),
        ("system", "System"),
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default="text")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class InterviewSchedule(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]
    recruiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scheduled_interviews")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_interviews")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE)
    interview_type = models.CharField(max_length=100)
    interview_mode = models.CharField(max_length=50)
    interview_date = models.DateField()
    interview_time = models.TimeField()
    meeting_link = models.URLField(blank=True)
    interviewer_name = models.CharField(max_length=255)
    instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    created_at = models.DateTimeField(auto_now_add=True)
