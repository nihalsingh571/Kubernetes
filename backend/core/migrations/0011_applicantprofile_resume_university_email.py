from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_ml_model_full_alignment'),
    ]

    operations = [
        migrations.AddField(
            model_name='applicantprofile',
            name='resume',
            field=models.FileField(blank=True, null=True, upload_to='resumes/'),
        ),
        migrations.AddField(
            model_name='applicantprofile',
            name='university_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]
