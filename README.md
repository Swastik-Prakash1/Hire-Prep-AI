# 🚀 HirePrep AI  
### Practice Real HR Interviews with an AI That Adapts to You

<p align="center">
  <a href="https://hire-prep-ai.onrender.com/" target="_blank">
    <img src="https://img.shields.io/badge/🔴 LIVE%20DEMO-Click%20Here-red?style=for-the-badge">
  </a>
</p>

> **HirePrep AI** is an AI-powered mock interview platform that simulates **real human HR interviews** — adaptive, conversational, and personalized.  
> It helps candidates practice interviews as conversations, not scripted Q&A.

---

## 🌐 Live Demo

👉 **Try it live:**  
🔗 **https://hire-prep-ai.onrender.com/**

> Open the link, allow camera & mic, and experience a realistic HR interview flow.

---

## 🧠 Why HirePrep AI?

Most interview preparation tools rely on:
- Static question banks  
- Keyword-based evaluation  
- Scripted flows  

**HirePrep AI is different.**

It conducts **human-like HR interviews** that:
- Adapt based on how you respond
- Ask natural follow-up questions
- Evaluate communication quality, not just correctness
- Feel like talking to a real interviewer

---

## ✨ Key Features

- 🎙️ **Voice-based interview interaction**
- 📷 **Live camera view (interview-like experience)**
- 🧠 **Context-aware AI interviewer**
- 🗣️ **Real-time speech-to-text transcript**
- 🔁 **Retry & confirm answers before submission**
- 🧩 **Resume-based OR general HR interviews**
- ⚡ **Adaptive follow-up questions**
- 📊 **Qualitative evaluation (clarity, relevance, confidence)**

---

## 🏗️ How It Works

1. Open the site  
2. Upload your resume **or** start a general HR interview  
3. The AI interviewer asks realistic HR questions  
4. Answer using your voice  
5. Review your transcript and confirm or retry  
6. The interview adapts and continues — just like real life  

---

## 🧩 Architecture Overview

### Frontend
- HTML, CSS, JavaScript
- Browser camera & microphone access
- Real-time speech transcription
- Interview-style UI

### Backend
- **FastAPI** (Python)
- Session-based interview state
- REST APIs for interview flow

### AI Engine
- **Gemini API** used as the core reasoning engine
- Generates interview questions
- Maintains multi-turn conversational context
- Evaluates answers qualitatively
- Reasons over unstructured input (speech, resumes)

The interview flow is adaptive:

\[
Q_{n+1} = f(Q_1, A_1, Q_2, A_2, \dots, Q_n, A_n)
\]

The next question depends on the **entire interview history**, not a fixed script.

---

## 📁 Project Structure

