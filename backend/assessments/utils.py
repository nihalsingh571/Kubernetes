import re
from .models import Question


def letter_to_index(letter):
    """Convert answer letter (A, B, C, D) to an index (0-based)."""
    mapping = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
    if not letter:
        return None
    return mapping.get(letter.strip().upper())


def parse_questions_from_docx(doc):
    """Parse questions from a python-docx Document object.

    Expected format in the DOCX:

        Question: Some question text
        A) Option A
        B) Option B
        C) Option C
        D) Option D
        Correct: A

    Questions should be separated by a blank line.
    """

    questions = []
    current_question = None
    options = []
    correct_answer = None

    def process_completed_question():
        """Helper to process a completed question."""
        if current_question and len(options) >= 4 and correct_answer is not None:
            correct_index = letter_to_index(correct_answer)
            if correct_index is not None and correct_index < len(options):
                questions.append({
                    "text": current_question,
                    "options": options,
                    "correct_option": correct_index,
                })

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()

        if not text:
            # Blank line separates questions
            process_completed_question()
            current_question = None
            options = []
            correct_answer = None
            continue

        # Check for question start (case insensitive, flexible spacing)
        if re.match(r'^question\s*:', text, re.IGNORECASE):
            # Process previous question if it exists
            process_completed_question()
            # Start new question
            current_question = text.split(':', 1)[1].strip()
            options = []
            correct_answer = None
            continue

        # Check for options (A), B), etc.) - more flexible pattern
        option_match = re.match(r'^([A-D])\s*\)\s*(.+)$', text, re.IGNORECASE)
        if option_match:
            _, option_text = option_match.groups()
            options.append(option_text.strip())
            continue

        # Check for correct answer (case insensitive, flexible spacing)
        if re.match(r'^correct\s*:', text, re.IGNORECASE):
            correct_answer = text.split(':', 1)[1].strip()
            continue

    # Handle last question if no blank line at end
    process_completed_question()

    return questions


def save_questions(skill, questions):
    """
    Save a list of questions to the database for a given skill.

    Args:
        skill: The Skill instance
        questions: List of question dictionaries with 'text', 'options', 'correct_option'
    """
    for question_data in questions:
        Question.objects.create(
            skill=skill,
            text=question_data['text'],
            options=question_data['options'],
            correct_option=question_data['correct_option']
        )
