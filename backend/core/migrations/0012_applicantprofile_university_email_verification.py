from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_applicantprofile_resume_university_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicantprofile',
            name='university_email_otp_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='applicantprofile',
            name='university_email_otp_hash',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name='applicantprofile',
            name='university_email_verified',
            field=models.BooleanField(default=False),
        ),
    ]
