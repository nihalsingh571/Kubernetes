from django.core.management.base import BaseCommand

from assessments.models import Skill

SKILL_DATASET = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express.js",
    "Spring Boot",
    "Django",
    "Flask",
    "REST APIs",
    "GraphQL",
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "SQL",
    "Redis",
    "Firebase",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Bootstrap",
    "Figma",
    "UX Research",
    "Wireframing",
    "Prototyping",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "Data Science",
    "Data Analysis",
    "Data Visualization",
    "Power BI",
    "Tableau",
    "Excel",
    "Statistics",
    "Business Intelligence",
    "Data Structures",
    "Algorithms",
    "System Design",
    "Operating Systems",
    "Computer Architecture",
    "Distributed Systems",
    "AWS",
    "Docker",
    "Kubernetes",
    "Linux",
    "CI/CD",
    "Terraform",
    "Microservices",
    "Cybersecurity",
    "Ethical Hacking",
    "Network Security",
    "Blockchain",
    "Solidity",
    "Web3",
    "Smart Contracts",
    "Flutter",
    "Dart",
    "Mobile App Development",
    "Unity",
    "C#",
    "Game Development",
    "3D Graphics",
    "SEO",
    "Content Marketing",
    "Digital Marketing",
    "Social Media Marketing",
    "Marketing Strategy",
    "Market Research",
    "Product Management",
    "Product Strategy",
    "User Research",
    "Financial Modeling",
    "Risk Analysis",
    "Supply Chain Management",
    "Operations Management",
]


class Command(BaseCommand):
    help = "Seeds the platform skills catalog with a curated dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="Delete all existing skills before seeding.",
        )

    def handle(self, *args, **options):
        if options["truncate"]:
            deleted, _ = Skill.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing skill records."))

        added = 0
        for name in SKILL_DATASET:
            skill, created = Skill.objects.get_or_create(name=name)
            if created:
                added += 1

        self.stdout.write(self.style.SUCCESS(f"Skill catalog up to date. {added} new skills added, {Skill.objects.count()} total."))
