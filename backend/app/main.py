from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import ResumeText, AnswerSubmission, StartInterview, StartGeneral, FeedbackRequest
from app.interview_engine import InterviewSession
from app.gemini_client import evaluate_ats
from app.resume_utils import extract_text_from_pdf
import uuid

# UPDATED: Added Title
app = FastAPI(title="Hire Prep AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
sessions = {}

@app.post("/start-general")
def start_general(data: StartGeneral):
    session_id = str(uuid.uuid4())
    sessions[session_id] = InterviewSession(session_id, company=data.target_company, mode="general")
    return {"session_id": session_id, "status": "General Interview Started"}

@app.post("/upload-resume-text")
def upload_resume_text(data: ResumeText):
    # 1. Run ATS Check
    ats_result = evaluate_ats(data.resume_text, data.target_company)
    
    # 2. Initialize Session
    session_id = str(uuid.uuid4())
    sessions[session_id] = InterviewSession(session_id, company=data.target_company, resume_text=data.resume_text, mode="resume")
    
    return {
        "session_id": session_id, 
        "ats_result": ats_result
    }

@app.post("/upload-resume-file")
def upload_resume_file(file: UploadFile = File(...), company: str = Form(...)):
    text = extract_text_from_pdf(file.file)
    
    # 1. Run ATS Check
    ats_result = evaluate_ats(text, company)
    
    # 2. Initialize Session
    session_id = str(uuid.uuid4())
    sessions[session_id] = InterviewSession(session_id, company=company, resume_text=text, mode="resume")
    
    return {
        "session_id": session_id, 
        "ats_result": ats_result
    }

@app.post("/get-question")
def get_question(data: StartInterview):
    session = sessions.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    question = session.next_question()
    if question is None:
        return {"question": None, "status": "completed"}
    return {"question": question, "status": "ongoing"}

@app.post("/submit-answer")
def submit_answer(data: AnswerSubmission):
    session = sessions.get(data.session_id)
    if not session: raise HTTPException(status_code=404, detail="Session not found")
    session.submit_answer(data.answer)
    return {"status": "Recorded"}

@app.post("/get-feedback")
def get_feedback_endpoint(data: FeedbackRequest):
    session = sessions.get(data.session_id)
    if not session: raise HTTPException(status_code=404, detail="Session not found")
    feedback = session.get_feedback()
    del sessions[data.session_id]
    return {"feedback": feedback}