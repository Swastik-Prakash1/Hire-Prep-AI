from google import genai
from app.config import GEMINI_API_KEY, MODEL_NAME
import json, re

client = genai.Client(api_key=GEMINI_API_KEY)

# --- PROMPTS ---

ATS_PROMPT = """
You are an expert ATS (Applicant Tracking System) scanner for {company}.
Analyze the resume text below.

STRICT SCORING RULES for {company}:
- Google: High weight on "Scalability", "Go/C++", "System Design", "Data Structures". Threshold: 75.
- Microsoft: High weight on ".NET", "Azure", "Enterprise", "Collaboration". Threshold: 75.
- Adobe: High weight on "Creativity", "UI/UX", "Java", "Full Stack". Threshold: 70.

OUTPUT FORMAT (JSON ONLY):
{{
  "score": <0-100>,
  "threshold": <insert threshold based on company>,
  "feedback": ["Critical issue 1", "Critical issue 2"],
  "missing_keywords": ["keyword1", "keyword2"]
}}

Resume Text:
{resume_text}
"""

RESUME_ANALYSIS_PROMPT = """
You are a Senior Technical Recruiter at {company}. Extract these details from the resume into JSON:
{
  "summary": "Professional summary",
  "projects": ["List of key project titles"],
  "skills": ["List of technical skills"]
}
"""

INTERVIEW_PROMPT = """
You are a strict technical interviewer at {company}. 
CONTEXT:
Resume Summary: {resume_summary}
Conversation History:
{history}

GOAL: Ask the next interview question (Question {q_num} of 5).
RULES:
1. Act like a {company} interviewer. (Google: Focus on optimization/scale. Microsoft: Focus on architecture/safety. Adobe: Focus on product/user).
2. If History is empty, start relevant to the resume projects.
3. Listen to their answers. If they are vague, drill down.
4. Keep questions professional and short.

RETURN ONLY THE QUESTION TEXT.
"""

GENERAL_PROMPT = """
You are a strict technical interviewer at {company}.
The candidate has NO resume.
GOAL: Ask the next interview question (Question {q_num} of 5).
RULES:
1. Start by asking them to introduce themselves.
2. Dig deep into whatever technology they mention.
3. Assess if they are a cultural fit for {company}.

RETURN ONLY THE QUESTION TEXT.
"""

FEEDBACK_PROMPT = """
You are a Hiring Manager at {company}.
Review this interview transcript.
Transcript:
{history}

Provide a structured Markdown review: Strengths, Weaknesses, and Hiring Decision.
"""

def evaluate_ats(resume_text: str, company: str) -> dict:
    try:
        res = client.models.generate_content(
            model=MODEL_NAME,
            contents=ATS_PROMPT.format(company=company, resume_text=resume_text)
        )
        match = re.search(r"\{[\s\S]*\}", res.text)
        data = json.loads(match.group()) if match else {"score": 0, "threshold": 70, "feedback": ["Parse Error"], "missing_keywords": []}
        
        # Add a passed boolean for easy frontend handling
        data["is_passed"] = data["score"] >= data["threshold"]
        return data
    except Exception as e:
        return {"score": 0, "threshold": 70, "feedback": [str(e)], "missing_keywords": [], "is_passed": False}

def analyze_resume(resume_text: str, company: str) -> dict:
    try:
        res = client.models.generate_content(
            model=MODEL_NAME,
            contents=RESUME_ANALYSIS_PROMPT.format(company=company) + f"\n\nResume:\n{resume_text}"
        )
        match = re.search(r"\{[\s\S]*\}", res.text)
        return json.loads(match.group()) if match else {"summary": "Error parsing", "projects": [], "skills": []}
    except:
        return {"summary": "Error", "projects": [], "skills": []}

def generate_question(resume_summary, history, q_num, company, mode="resume"):
    if mode == "general":
        prompt = GENERAL_PROMPT.format(company=company, history="\n".join(history), q_num=q_num)
    else:
        prompt = INTERVIEW_PROMPT.format(company=company, resume_summary=resume_summary, history="\n".join(history), q_num=q_num)

    res = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    return res.text.strip()

def generate_feedback(history, company):
    prompt = FEEDBACK_PROMPT.format(company=company, history="\n".join(history))
    res = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    return res.text.strip()