import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    ApplicantProfile, RecruiterProfile, Internship, Application,
    Conversation, Message, InterviewSchedule, Notification, InternshipInvitation
)

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds realistic demo data for presentation/showcase."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Wiping existing non-admin data..."))

        # Keep superusers
        admin_users = list(User.objects.filter(is_superuser=True).values_list('id', flat=True))

        Application.objects.all().delete()
        Internship.objects.all().delete()
        Conversation.objects.all().delete()
        Message.objects.all().delete()
        InterviewSchedule.objects.all().delete()
        Notification.objects.all().delete()
        InternshipInvitation.objects.all().delete()
        
        ApplicantProfile.objects.all().delete()
        RecruiterProfile.objects.all().delete()
        User.objects.exclude(id__in=admin_users).delete()

        self.stdout.write(self.style.SUCCESS("Wiped old data."))

        # 1. Recruiters
        recruiter_data = [
            {"first_name": "Harsh", "last_name": "Sharma", "email": "harsh.sharma@wipro.com", "company": "Wipro", "designation": "Senior Talent Acquisition Specialist", "industry": "IT Services", "website": "https://wipro.com", "location": "Bengaluru, India", "description": "Wipro is a leading global information technology, consulting and business process services company.", "size": "10000+"},
            {"first_name": "Ananya", "last_name": "Desai", "email": "ananya.desai@google.com", "company": "Google", "designation": "University Recruiter", "industry": "Technology", "website": "https://careers.google.com", "location": "Hyderabad, India", "description": "Google’s mission is to organize the world’s information and make it universally accessible and useful.", "size": "10000+"},
            {"first_name": "Rohan", "last_name": "Verma", "email": "rohan.v@razorpay.com", "company": "Razorpay", "designation": "Technical Recruiter", "industry": "Fintech", "website": "https://razorpay.com", "location": "Bengaluru, India", "description": "Razorpay is India's first full-stack financial solutions company. We are building the central nervous system for India's digital economy.", "size": "1000-5000"},
            {"first_name": "Priya", "last_name": "Singh", "email": "priya.singh@microsoft.com", "company": "Microsoft", "designation": "Early Careers Recruiter", "industry": "Software", "website": "https://microsoft.com", "location": "Noida, India", "description": "At Microsoft, our mission is to empower every person and every organization on the planet to achieve more.", "size": "10000+"},
            {"first_name": "Karan", "last_name": "Mehta", "email": "karan.mehta@kpmg.com", "company": "KPMG", "designation": "HR Manager - Campus", "industry": "Management Consulting", "website": "https://kpmg.com", "location": "Gurugram, India", "description": "KPMG is a global network of professional firms providing Audit, Tax and Advisory services.", "size": "10000+"},
            {"first_name": "Neha", "last_name": "Gupta", "email": "neha.g@amazon.com", "company": "Amazon", "designation": "SDE Recruiter", "industry": "E-commerce & Cloud", "website": "https://amazon.jobs", "location": "Bengaluru, India", "description": "Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.", "size": "10000+"},
            {"first_name": "Arjun", "last_name": "Patel", "email": "arjun.p@ibm.com", "company": "IBM", "designation": "Talent Partner", "industry": "IT & Consulting", "website": "https://ibm.com", "location": "Pune, India", "description": "IBM integrates technology and expertise, providing infrastructure, software and consulting services.", "size": "10000+"},
            {"first_name": "Aditi", "last_name": "Rao", "email": "aditi.r@infosys.com", "company": "Infosys", "designation": "Campus Lead", "industry": "IT Services", "website": "https://infosys.com", "location": "Mysuru, India", "description": "Infosys is a global leader in next-generation digital services and consulting.", "size": "10000+"},
            {"first_name": "Vikram", "last_name": "Iyer", "email": "vikram.iyer@huggingface.co", "company": "Hugging Face", "designation": "Machine Learning Recruiter", "industry": "AI/ML", "website": "https://huggingface.co", "location": "Remote", "description": "The AI community building the future. Build, train and deploy state of the art models powered by the reference open source in machine learning.", "size": "50-200"},
            {"first_name": "Sneha", "last_name": "Reddy", "email": "sneha.r@tcs.com", "company": "TCS", "designation": "Talent Acquisition Head", "industry": "IT Services", "website": "https://tcs.com", "location": "Chennai, India", "description": "Tata Consultancy Services is an IT services, consulting and business solutions organization.", "size": "10000+"},
        ]

        recruiter_profiles = []
        for rd in recruiter_data:
            user = User.objects.create_user(
                username=rd["email"].split('@')[0] + str(random.randint(100, 999)),
                email=rd["email"],
                password="password123",
                first_name=rd["first_name"],
                last_name=rd["last_name"],
                role=User.Role.RECRUITER
            )
            profile, _ = RecruiterProfile.objects.get_or_create(user=user)
            profile.company_name = rd["company"]
            profile.company_website = rd["website"]
            profile.designation = rd["designation"]
            profile.company_linkedin = f"{rd['website']}/linkedin"
            profile.company_description = rd["description"]
            profile.company_location = rd["location"]
            profile.industry = rd["industry"]
            profile.company_size = rd["size"]
            profile.status = RecruiterProfile.STATUS_ACTIVE
            profile.is_verified = True
            profile.work_email_verified = True
            profile.verified_by_admin = True
            profile.save()
            recruiter_profiles.append(profile)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(recruiter_profiles)} recruiters."))

        # 2. Students
        student_names = [
            ("Anjali", "Sinha"), ("Rahul", "Kumar"), ("Aarav", "Singh"), ("Ishita", "Sharma"),
            ("Ritik", "Jain"), ("Shruti", "Verma"), ("Kavya", "Reddy"), ("Rishabh", "Gupta"),
            ("Meera", "Menon"), ("Ayush", "Bansal"), ("Diya", "Kapoor"), ("Aryan", "Chopra"),
            ("Tanya", "Nair"), ("Siddharth", "Joshi"), ("Neha", "Deshmukh"), ("Yash", "Agarwal"),
            ("Pooja", "Bhatt"), ("Kartik", "Ahuja"), ("Riya", "Sen"), ("Aditya", "Ranjan")
        ]
        
        colleges = ["LPU", "IIT Bombay", "IIT Delhi", "NIT Trichy", "BITS Pilani", "VIT", "DTU", "NSUT"]
        domains = [
            {"role": "Full Stack Developer", "skills": [{"name": "React", "status": "verified"}, {"name": "Django", "status": "verified"}, {"name": "PostgreSQL", "status": "verified"}]},
            {"role": "AI/ML Engineer", "skills": [{"name": "Python", "status": "verified"}, {"name": "TensorFlow", "status": "verified"}, {"name": "NLP", "status": "verified"}]},
            {"role": "Data Analyst", "skills": [{"name": "SQL", "status": "verified"}, {"name": "Python", "status": "verified"}, {"name": "Power BI", "status": "verified"}, {"name": "Tableau", "status": "verified"}]},
            {"role": "App Developer", "skills": [{"name": "Kotlin", "status": "verified"}, {"name": "Flutter", "status": "verified"}, {"name": "Firebase", "status": "verified"}]},
            {"role": "Cybersecurity Analyst", "skills": [{"name": "Linux", "status": "verified"}, {"name": "Networking", "status": "verified"}, {"name": "Ethical Hacking", "status": "verified"}]},
        ]

        student_profiles = []
        for first, last in student_names:
            domain = random.choice(domains)
            college = random.choice(colleges)
            email = f"{first.lower()}.{last.lower()}{random.randint(10,99)}@gmail.com"
            college_email = f"{first.lower()}@stu.{college.lower().replace(' ', '')}.edu.in"
            
            user = User.objects.create_user(
                username=email.split('@')[0],
                email=email,
                password="password123",
                first_name=first,
                last_name=last,
                role=User.Role.APPLICANT
            )
            
            vsps = round(random.uniform(0.65, 0.98), 2)
            
            profile, _ = ApplicantProfile.objects.get_or_create(user=user)
            profile.skills = domain["skills"]
            profile.university_email = college_email
            profile.university_email_verified = True
            profile.college = college
            profile.degree = "B.Tech"
            profile.major = "Computer Science"
            profile.graduation_year = random.choice([2024, 2025, 2026])
            profile.interested_role = domain["role"]
            profile.vsps_score = vsps
            profile.assessment_accuracy = round(random.uniform(0.7, 0.95), 2)
            profile.assessment_speed_score = round(random.uniform(0.6, 0.9), 2)
            profile.assessment_difficulty_score = round(random.uniform(0.6, 0.9), 2)
            profile.assessment_consistency = round(random.uniform(0.7, 0.95), 2)
            profile.integrity_factor = 1.0
            profile.github_link = f"https://github.com/{first.lower()}{last.lower()}"
            profile.linkedin_link = f"https://linkedin.com/in/{first.lower()}{last.lower()}"
            profile.save()
            student_profiles.append(profile)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(student_profiles)} students."))

        # 3. Internships
        internship_templates = [
            {"title": "Software Development Intern", "skills": [{"name": "Python"}, {"name": "React"}, {"name": "Django"}], "stipend": 25000},
            {"title": "AI/ML Intern", "skills": [{"name": "Python"}, {"name": "TensorFlow"}, {"name": "NLP"}], "stipend": 30000},
            {"title": "Data Science Intern", "skills": [{"name": "Python"}, {"name": "SQL"}, {"name": "Pandas"}], "stipend": 28000},
            {"title": "Frontend Developer Intern", "skills": [{"name": "React"}, {"name": "JavaScript"}, {"name": "CSS"}], "stipend": 20000},
            {"title": "Backend Engineering Intern", "skills": [{"name": "Node.js"}, {"name": "PostgreSQL"}, {"name": "Express"}], "stipend": 25000},
            {"title": "Cybersecurity Intern", "skills": [{"name": "Linux"}, {"name": "Networking"}, {"name": "Ethical Hacking"}], "stipend": 22000},
            {"title": "Android Developer Intern", "skills": [{"name": "Kotlin"}, {"name": "Firebase"}, {"name": "Android Studio"}], "stipend": 24000},
            {"title": "Data Analyst Intern", "skills": [{"name": "SQL"}, {"name": "Power BI"}, {"name": "Tableau"}], "stipend": 18000},
            {"title": "Cloud Engineering Intern", "skills": [{"name": "AWS"}, {"name": "Linux"}, {"name": "Docker"}], "stipend": 26000},
            {"title": "Product Management Intern", "skills": [{"name": "Agile"}, {"name": "Jira"}, {"name": "Communication"}], "stipend": 35000},
        ]

        internships = []
        for i in range(25):
            recruiter = random.choice(recruiter_profiles)
            template = random.choice(internship_templates)
            mode = random.choice(["Remote", "On-site", "Hybrid"])
            location = "Remote" if mode == "Remote" else recruiter.company_location
            
            internship = Internship.objects.create(
                recruiter=recruiter,
                title=template["title"],
                description=f"Join {recruiter.company_name} as a {template['title']}. We are looking for passionate individuals who want to make an impact.",
                location=location,
                work_type=mode,
                stipend=template["stipend"],
                required_skills=template["skills"],
                preferred_skills=[{"name": "Git"}, {"name": "Agile"}],
                responsibilities="Write clean code, participate in code reviews, collaborate with cross-functional teams, and build scalable solutions.",
                duration="6 Months",
                start_date=timezone.now() + timedelta(days=random.randint(15, 45)),
                deadline=timezone.now() + timedelta(days=random.randint(5, 20)),
                status="OPEN"
            )
            internships.append(internship)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(internships)} internships."))

        # 4. Applications
        applications = []
        for student in student_profiles:
            # Each student applies to 2-4 internships
            applied_internships = random.sample(internships, random.randint(2, 4))
            for intship in applied_internships:
                status = random.choices(
                    ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'],
                    weights=[0.5, 0.3, 0.1, 0.1],
                    k=1
                )[0]
                
                app = Application.objects.create(
                    internship=intship,
                    applicant=student,
                    status=status,
                    applied_at=timezone.now() - timedelta(days=random.randint(1, 10))
                )
                applications.append(app)
                
                # If Accepted or Reviewed, maybe create a conversation/interview
                if status in ['ACCEPTED', 'REVIEWED']:
                    conv, _ = Conversation.objects.get_or_create(
                        recruiter=intship.recruiter.user,
                        student=student.user,
                        internship=intship
                    )
                    Message.objects.create(
                        conversation=conv,
                        sender=intship.recruiter.user,
                        message=f"Hi {student.user.first_name}, your profile looks great! We would love to discuss the {intship.title} role with you.",
                        created_at=timezone.now() - timedelta(days=2)
                    )
                    Message.objects.create(
                        conversation=conv,
                        sender=student.user,
                        message=f"Thank you, {intship.recruiter.user.first_name}! I am very interested. When are you available?",
                        created_at=timezone.now() - timedelta(days=1)
                    )

                    if status == 'ACCEPTED' and random.choice([True, False]):
                        InterviewSchedule.objects.create(
                            recruiter=intship.recruiter.user,
                            student=student.user,
                            internship=intship,
                            interview_type="Technical Round",
                            interview_mode="Video Call",
                            interview_date=timezone.now().date() + timedelta(days=random.randint(1, 5)),
                            interview_time=timezone.now().time(),
                            meeting_link="https://meet.google.com/abc-defg-hij",
                            interviewer_name=intship.recruiter.user.get_full_name(),
                            status="scheduled"
                        )
                        Message.objects.create(
                            conversation=conv,
                            sender=intship.recruiter.user,
                            type="interview",
                            message="I have scheduled an interview for you. Check your dashboard for the meeting link.",
                            created_at=timezone.now()
                        )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(applications)} applications, messages, and interviews."))

        # 5. Invitations
        for recruiter in recruiter_profiles:
            # Recruiter invites a random student
            student = random.choice(student_profiles)
            recruiter_internships = [i for i in internships if i.recruiter == recruiter]
            if recruiter_internships:
                intship = random.choice(recruiter_internships)
                InternshipInvitation.objects.create(
                    recruiter=recruiter.user,
                    student=student.user,
                    internship=intship,
                    message=f"Hi {student.user.first_name}, I saw your impressive VSPS score and GitHub projects. I encourage you to apply for our {intship.title} role at {recruiter.company_name}.",
                    status="pending"
                )
                Notification.objects.create(
                    user=student.user,
                    title="New Internship Invitation",
                    message=f"{recruiter.company_name} invited you to apply for {intship.title}.",
                    type="invitation"
                )

        self.stdout.write(self.style.SUCCESS("Seeded invitations and notifications."))
        self.stdout.write(self.style.SUCCESS("Demo data generation complete. Platform is production-ready!"))
