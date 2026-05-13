from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_applicantprofile_university_email_verification'),
    ]

    operations = [
        migrations.AddField(
            model_name='recruiterprofile',
            name='admin_notified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='company_linkedin',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='work_email_otp_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='work_email_otp_hash',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='work_email_verified',
            field=models.BooleanField(default=False),
        ),
    ]
