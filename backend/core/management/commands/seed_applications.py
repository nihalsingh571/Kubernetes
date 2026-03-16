from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from core.models import ApplicantProfile, Internship, Application

APPLICATION_DATA = [
    {
        "student_email": "ananya.sharma@lpu.in",
        "internship_title": "Machine Learning Intern",
        "company": "Microsoft",
        "status": "PENDING",
        "applied_date": "2026-02-10",
    },
    {
        "student_email": "arjun.mehta@iitd.ac.in",
        "internship_title": "Software Development Intern",
        "company": "Google",
        "status": "ACCEPTED",
        "applied_date": "2026-02-08",
    },
    {
        "student_email": "sneha.iyer@iitm.ac.in",
        "internship_title": "Data Science Intern",
        "company": "Swiggy",
        "status": "REVIEWED",
        "applied_date": "2026-02-12",
    },
    {
        "student_email": "vikram.kapoor@iimb.ac.in",
        "internship_title": "Business Analyst Intern",
        "company": "McKinsey",
        "status": "REVIEWED",
        "applied_date": "2026-02-14",
    },
    {
        "student_email": "ritika.malhotra@lpu.in",
        "internship_title": "AI Engineer Intern",
        "company": "Nvidia",
        "status": "PENDING",
        "applied_date": "2026-02-21",
    },
]


class Command(BaseCommand):
    help = "Seeds internship applications linking seeded students and internships."

    def add_arguments(self, parser):
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="Delete all existing applications before seeding.",
        )

    def handle(self, *args, **options):
        if options["truncate"]:
            deleted, _ = Application.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} application records."))

        created = 0
        updated = 0

        for entry in APPLICATION_DATA:
            applicant = self._get_applicant(entry["student_email"])
            internship = self._get_internship(entry["internship_title"], entry["company"])

            if not applicant or not internship:
                continue

            applied_at = self._parse_date(entry["applied_date"])
            status = entry["status"].upper()
            if status == "UNDER REVIEW":
                status = "REVIEWED"

            application, was_created = Application.objects.update_or_create(
                internship=internship,
                applicant=applicant,
                defaults={
                    "status": status,
                    "applied_at": applied_at,
                },
            )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded applications complete. {created} created, {updated} updated, total {Application.objects.count()} records.")
        )

    def _get_applicant(self, email):
        try:
            return ApplicantProfile.objects.get(user__email=email)
        except ApplicantProfile.DoesNotExist:
            self.stdout.write(self.style.WARNING(f"Applicant not found for email {email}, skipping entry."))
            return None

    def _get_internship(self, title, company):
        try:
            return Internship.objects.get(title=title, recruiter__company_name=company)
        except Internship.DoesNotExist:
            self.stdout.write(self.style.WARNING(f"Internship '{title}' at {company} not found, skipping entry."))
            return None

    def _parse_date(self, date_string):
        if not date_string:
            return timezone.now()
        try:
            dt = parse_datetime(date_string)
            if dt is None:
                dt = timezone.datetime.fromisoformat(date_string)
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            return dt
        except Exception:
            return timezone.now()
