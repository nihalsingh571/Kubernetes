from django.db import migrations, models
import django.db.models.deletion


def backfill_recruiter_status(apps, schema_editor):
    RecruiterProfile = apps.get_model('core', 'RecruiterProfile')
    for profile in RecruiterProfile.objects.all():
        if profile.is_verified and profile.work_email_verified:
            profile.status = 'active'
            profile.verified_by_admin = True
        elif profile.is_verified:
            profile.status = 'approved_pending_email_verification'
            profile.verified_by_admin = True
        else:
            profile.status = 'pending_admin_review'
            profile.is_verified = False
        profile.save(update_fields=['status', 'verified_by_admin', 'is_verified'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_recruiterprofile_work_email_verification'),
    ]

    operations = [
        migrations.AddField(
            model_name='recruiterprofile',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending_admin_review', 'Pending Admin Review'),
                    ('approved_pending_email_verification', 'Approved Pending Email Verification'),
                    ('active', 'Active'),
                    ('rejected', 'Rejected'),
                    ('suspended', 'Suspended'),
                ],
                default='pending_admin_review',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='recruiterprofile',
            name='verified_by_admin',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='AdminNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('recruiter_verification', 'Recruiter Verification')], max_length=80)),
                ('priority', models.CharField(choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')], default='medium', max_length=20)),
                ('message', models.CharField(max_length=255)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recruiter', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='admin_notifications', to='core.recruiterprofile')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.RunPython(backfill_recruiter_status, migrations.RunPython.noop),
    ]
