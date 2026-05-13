from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_recruiter_approval_workflow'),
    ]

    operations = [
        migrations.AddField(
            model_name='recruiterprofile',
            name='company_description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='company_location',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='company_size',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='industry',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='phone_number',
            field=models.CharField(blank=True, max_length=30),
        ),
    ]
