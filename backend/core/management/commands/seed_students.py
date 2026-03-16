import itertools

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from core.models import ApplicantProfile

User = get_user_model()

STUDENT_DATA = [
    {
        "first_name": "Ananya",
        "last_name": "Sharma",
        "email": "ananya.sharma@lpu.in",
        "university": "Lovely Professional University",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2026,
        "skills": ["Python", "Machine Learning", "React", "SQL"],
    },
    {
        "first_name": "Rohit",
        "last_name": "Verma",
        "email": "rohit.verma@lpu.in",
        "university": "Lovely Professional University",
        "degree": "B.Tech",
        "major": "Information Technology",
        "graduation_year": 2025,
        "skills": ["Java", "Spring Boot", "MySQL", "Docker"],
    },
    {
        "first_name": "Priya",
        "last_name": "Singh",
        "email": "priya.singh@lpu.in",
        "university": "Lovely Professional University",
        "degree": "BCA",
        "major": "Software Development",
        "graduation_year": 2026,
        "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    },
    {
        "first_name": "Arjun",
        "last_name": "Mehta",
        "email": "arjun.mehta@iitd.ac.in",
        "university": "IIT Delhi",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2025,
        "skills": ["C++", "Algorithms", "Distributed Systems", "Go"],
    },
    {
        "first_name": "Neha",
        "last_name": "Reddy",
        "email": "neha.reddy@iitb.ac.in",
        "university": "IIT Bombay",
        "degree": "B.Tech",
        "major": "Artificial Intelligence",
        "graduation_year": 2026,
        "skills": ["Python", "Deep Learning", "TensorFlow", "NLP"],
    },
    {
        "first_name": "Karan",
        "last_name": "Gupta",
        "email": "karan.gupta@iitk.ac.in",
        "university": "IIT Kanpur",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2025,
        "skills": ["Python", "Data Structures", "Flask", "PostgreSQL"],
    },
    {
        "first_name": "Sneha",
        "last_name": "Iyer",
        "email": "sneha.iyer@iitm.ac.in",
        "university": "IIT Madras",
        "degree": "B.Tech",
        "major": "Data Science",
        "graduation_year": 2026,
        "skills": ["Python", "Pandas", "Machine Learning", "Power BI"],
    },
    {
        "first_name": "Rahul",
        "last_name": "Patel",
        "email": "rahul.patel@iitg.ac.in",
        "university": "IIT Guwahati",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2025,
        "skills": ["Java", "Spring Boot", "Microservices", "AWS"],
    },
    {
        "first_name": "Ishita",
        "last_name": "Bansal",
        "email": "ishita.bansal@iima.ac.in",
        "university": "IIM Ahmedabad",
        "degree": "MBA",
        "major": "Marketing",
        "graduation_year": 2025,
        "skills": ["Marketing Strategy", "SEO", "Analytics", "Excel"],
    },
    {
        "first_name": "Vikram",
        "last_name": "Kapoor",
        "email": "vikram.kapoor@iimb.ac.in",
        "university": "IIM Bangalore",
        "degree": "MBA",
        "major": "Business Analytics",
        "graduation_year": 2026,
        "skills": ["Data Analysis", "SQL", "Tableau", "Business Intelligence"],
    },
    {
        "first_name": "Aditi",
        "last_name": "Joshi",
        "email": "aditi.joshi@iimc.ac.in",
        "university": "IIM Calcutta",
        "degree": "MBA",
        "major": "Finance",
        "graduation_year": 2025,
        "skills": ["Financial Modeling", "Excel", "Python", "Risk Analysis"],
    },
    {
        "first_name": "Siddharth",
        "last_name": "Nair",
        "email": "siddharth.nair@lpu.in",
        "university": "Lovely Professional University",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2026,
        "skills": ["React", "Next.js", "Tailwind", "TypeScript"],
    },
    {
        "first_name": "Meera",
        "last_name": "Kulkarni",
        "email": "meera.kulkarni@iitp.ac.in",
        "university": "IIT Patna",
        "degree": "B.Tech",
        "major": "Computer Science",
        "graduation_year": 2026,
        "skills": ["Python", "Django", "REST APIs", "Docker"],
    },
    {
        "first_name": "Aman",
        "last_name": "Chopra",
        "email": "aman.chopra@iiml.ac.in",
        "university": "IIM Lucknow",
        "degree": "MBA",
        "major": "Operations",
        "graduation_year": 2025,
        "skills": ["Supply Chain", "Operations", "Excel", "Data Analysis"],
    },
    {
        "first_name": "Ritika",
        "last_name": "Malhotra",
        "email": "ritika.malhotra@lpu.in",
        "university": "Lovely Professional University",
        "degree": "B.Tech",
        "major": "Data Science",
        "graduation_year": 2026,
        "skills": ["Python", "Machine Learning", "Scikit-learn", "SQL"],
    },
]

DEFAULT_PASSWORD = "InternConnect123!"


class Command(BaseCommand):
    help = "Seeds demo student users and applicant profiles."

    def add_arguments(self, parser):
        parser.add_argument("--password", help="Password to set for created users.", default=DEFAULT_PASSWORD)
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="If supplied, removes existing seeded students before creating new ones.",
        )

    def handle(self, *args, **options):
        password = options["password"]
        if not password or len(password) < 6:
            raise CommandError("Please provide a --password value with at least 6 characters.")

        created_users = 0
        updated_profiles = 0
        truncated = False

        if options["truncate"]:
            emails = [entry["email"].lower() for entry in STUDENT_DATA]
            ApplicantProfile.objects.filter(user__email__in=emails).delete()
            User.objects.filter(email__in=emails).delete()
            truncated = True

        for entry in STUDENT_DATA:
            email = entry["email"].lower()
            user_defaults = {
                "first_name": entry["first_name"],
                "last_name": entry["last_name"],
                "username": self._derive_username(email),
                "role": User.Role.APPLICANT,
            }
            user, created = User.objects.get_or_create(email=email, defaults=user_defaults)
            if created:
                user.set_password(password)
                user.save()
                created_users += 1
            else:
                updated_fields = []
                for field in ("first_name", "last_name"):
                    new_value = entry[field]
                    if getattr(user, field) != new_value:
                        setattr(user, field, new_value)
                        updated_fields.append(field)
                if user.role != User.Role.APPLICANT:
                    user.role = User.Role.APPLICANT
                    updated_fields.append("role")
                if updated_fields:
                    user.save(update_fields=updated_fields)

            profile, _ = ApplicantProfile.objects.get_or_create(user=user)
            profile.college = entry["university"]
            profile.degree = entry["degree"]
            profile.major = entry.get("major", "")
            profile.graduation_year = entry.get("graduation_year")
            profile.skills = entry.get("skills", [])
            profile.save()
            updated_profiles += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {updated_profiles} applicant profiles ({created_users} new users)."))
        if truncated:
            self.stdout.write(self.style.WARNING("Previous seeded students were removed (--truncate)."))

    def _derive_username(self, email):
        base = email.split("@")[0]
        candidate_iter = (base if idx == 0 else f"{base}{idx}" for idx in itertools.count())
        for candidate in candidate_iter:
            if not User.objects.filter(username=candidate).exists():
                return candidate
