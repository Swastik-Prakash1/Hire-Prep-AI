from app.gemini_client import analyze_resume, generate_question, generate_feedback

class InterviewSession:
    def __init__(self, session_id, company, resume_text=None, mode="resume"):
        self.session_id = session_id
        self.company = company
        self.mode = mode
        self.resume_data = analyze_resume(resume_text, company) if resume_text else None
        self.history = []
        self.question_count = 0
        self.max_questions = 5

    def next_question(self):
        if self.question_count >= self.max_questions:
            return None 

        self.question_count += 1
        summary = self.resume_data["summary"] if self.resume_data else "No Resume"

        question = generate_question(
            summary, self.history, self.question_count, self.company, self.mode
        )
        
        self.history.append(f"Interviewer ({self.company}): {question}")
        return question

    def submit_answer(self, answer: str):
        self.history.append(f"Candidate: {answer}")

    def get_feedback(self):
        return generate_feedback(self.history, self.company)