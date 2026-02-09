from pydantic import BaseModel
from typing import Optional, List

class ResumeText(BaseModel):
    resume_text: str
    target_company: str

class AnswerSubmission(BaseModel):
    session_id: str
    answer: str

class StartInterview(BaseModel):
    session_id: str

class StartGeneral(BaseModel):
    target_company: str

class FeedbackRequest(BaseModel):
    session_id: str

class ATSResult(BaseModel):
    score: int
    is_passed: bool
    threshold: int
    feedback: List[str]
    missing_keywords: List[str]