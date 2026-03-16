from django.core.management.base import BaseCommand, CommandError
from docx import Document

from assessments.models import Skill, Question
from assessments.utils import parse_questions_from_docx


class Command(BaseCommand):
    help = "Import questions from a DOCX file for a specific skill."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the DOCX file containing questions",
        )
        parser.add_argument(
            "--skill",
            type=str,
            required=True,
            help="Name of the skill to associate questions with",
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        skill_name = options["skill"]

        # Get or create the skill
        try:
            skill = Skill.objects.get(name=skill_name)
        except Skill.DoesNotExist:
            raise CommandError(f"Skill '{skill_name}' does not exist. Please create it first.")

        # Load the document
        try:
            doc = Document(file_path)
        except Exception as e:
            raise CommandError(f"Error loading DOCX file: {e}")

        # Parse questions from the document
        questions_data = parse_questions_from_docx(doc)

        if not questions_data:
            raise CommandError("No questions found in the DOCX file.")

        # Import questions
        imported_count = 0
        for question_data in questions_data:
            try:
                Question.objects.create(
                    skill=skill,
                    text=question_data["text"],
                    options=question_data["options"],
                    correct_option=question_data["correct_option"]
                )
                imported_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Failed to import question '{question_data['text'][:50]}...': {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"Successfully imported {imported_count} questions for skill '{skill_name}'.")
        )

