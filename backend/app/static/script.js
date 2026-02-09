/* =========================================
   1. GLOBAL STATE & DOM ELEMENTS
   ========================================= */
const screens = {
    start: document.getElementById("startScreen"),
    loading: document.getElementById("loadingScreen"),
    ats: document.getElementById("atsScreen"),
    interview: document.getElementById("interviewScreen"),
    feedback: document.getElementById("feedbackScreen")
};

const inputs = {
    company: document.getElementById("companySelect"),
    resumeFile: document.getElementById("resumeFile"),
    resumeText: document.getElementById("resumeText")
};

const atsUI = {
    score: document.getElementById("atsScoreCircle"),
    status: document.getElementById("atsStatus"),
    threshold: document.getElementById("atsThreshold"),
    detailsContainer: document.querySelector(".ats-details"),
    feedbackList: document.getElementById("atsFeedbackList"),
    keywords: document.getElementById("atsKeywords"),
    startBtn: document.getElementById("startAnywayBtn")
};

const interviewUI = {
    question: document.getElementById("questionText"),
    transcript: document.getElementById("transcriptBox"),
    count: document.getElementById("qCount"),
    mic: document.getElementById("micBtn"),
    confirm: document.getElementById("confirmBtns"),
    status: document.getElementById("status")
};

let currentSessionId = null;
let currentQIndex = 0;
let recognition;
let transcript = "";
const synth = window.speechSynthesis;

/* =========================================
   2. INITIALIZATION
   ========================================= */

/* Initialize Camera */
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => document.getElementById("cameraFeed").srcObject = stream)
  .catch(e => {
      console.error("Camera error:", e);
      // Optional: alert("Please enable camera access for the interview experience.");
  });

/* Navigation Helper */
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    screens[name].classList.add("active");
}

/* =========================================
   3. MODE SELECTION LISTENERS
   ========================================= */

// OPTION 1: General Mode (No Resume)
document.getElementById("generalBtn").onclick = async () => {
    showScreen("loading");
    document.getElementById("loadingText").textContent = `Setting up ${inputs.company.value} interview...`;
    
    try {
        // FIXED: Removed "http://127.0.0.1:8000" - Now uses relative path
        const res = await fetch("/start-general", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target_company: inputs.company.value })
        });
        
        if (!res.ok) throw new Error("Backend connection failed");
        
        const data = await res.json();
        currentSessionId = data.session_id;
        startInterviewLoop();
    } catch (err) {
        console.error(err);
        alert("Server Error: Check your Render logs!");
        showScreen("start");
    }
};

// OPTION 2: Paste Resume Text
document.getElementById("useTextBtn").onclick = async () => {
    if(inputs.resumeText.value.length < 50) return alert("Please paste your full resume text (min 50 chars).");
    
    await processResume({ 
        resume_text: inputs.resumeText.value, 
        target_company: inputs.company.value 
    }, "text");
};

// OPTION 3: Upload Resume File
inputs.resumeFile.onchange = async () => {
    if(!inputs.resumeFile.files[0]) return;
    await processResume(inputs.resumeFile.files[0], "file");
};

/* =========================================
   4. RESUME PROCESSING & ATS LOGIC
   ========================================= */

async function processResume(payload, type) {
    showScreen("loading");
    document.getElementById("loadingText").textContent = `Analyzing resume for ${inputs.company.value} fit...`;

    try {
        let res;
        if (type === "text") {
            // FIXED: Relative path
            res = await fetch("/upload-resume-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            const formData = new FormData();
            formData.append("file", payload);
            formData.append("company", inputs.company.value);
            // FIXED: Relative path
            res = await fetch("/upload-resume-file", { method: "POST", body: formData });
        }

        if (!res.ok) throw new Error("Resume upload failed");

        const data = await res.json();
        currentSessionId = data.session_id;
        handleATSResult(data.ats_result);

    } catch (err) {
        console.error(err);
        alert("Error processing resume. Check console.");
        showScreen("start");
    }
}

function handleATSResult(ats) {
    showScreen("ats");

    // 1. Set Static Text
    atsUI.threshold.textContent = `Pass Threshold: ${ats.threshold}`;
    atsUI.status.textContent = ats.is_passed ? "Resume Passed! 🚀" : "Needs Optimization ⚠️";
    atsUI.status.style.color = ats.is_passed ? "var(--success)" : "var(--danger)";
    
    // 2. Score Animation (0 -> Actual Score)
    let currentScore = 0;
    const targetScore = ats.score;
    
    atsUI.score.textContent = "0";
    atsUI.score.style.borderColor = "#334155";
    
    const interval = setInterval(() => {
        if (currentScore >= targetScore) {
            clearInterval(interval);
            atsUI.score.textContent = targetScore;
        } else {
            currentScore++;
            atsUI.score.textContent = currentScore;
        }
        
        const color = currentScore >= ats.threshold ? "var(--success)" : "var(--danger)";
        atsUI.score.style.borderColor = color;
        atsUI.score.style.color = color;
    }, 20); 

    // 3. TUTORIAL MODE UI LOGIC (Hide feedback if passed)
    if (ats.is_passed) {
        if (atsUI.detailsContainer) atsUI.detailsContainer.style.display = 'none';
        
        atsUI.startBtn.textContent = "Start Interview Now ➝";
        atsUI.startBtn.className = "btn accent";
    } else {
        if (atsUI.detailsContainer) atsUI.detailsContainer.style.display = 'block';
        
        atsUI.feedbackList.innerHTML = ats.feedback.map(f => `<li>${f}</li>`).join("");
        atsUI.keywords.innerHTML = ats.missing_keywords.length > 0 
            ? ats.missing_keywords.map(k => `<span>${k}</span>`).join("") 
            : "<span style='color:var(--text-muted)'>No missing keywords detected.</span>";
            
        atsUI.startBtn.textContent = "Ignore Risks & Start";
        atsUI.startBtn.className = "btn warning";
    }
}

atsUI.startBtn.onclick = startInterviewLoop;

/* =========================================
   5. INTERVIEW LOOP
   ========================================= */

async function startInterviewLoop() {
    showScreen("interview");
    fetchNextQuestion();
}

async function fetchNextQuestion() {
    interviewUI.status.textContent = "Interviewer is thinking...";
    
    try {
        // FIXED: Relative path
        const res = await fetch("/get-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: currentSessionId })
        });
        
        const data = await res.json();
        
        if (data.status === "completed") {
            finishInterview();
            return;
        }
        
        currentQIndex++;
        interviewUI.count.textContent = currentQIndex;
        interviewUI.question.textContent = data.question;
        
        speakText(data.question);
        interviewUI.status.textContent = "Listening...";
        resetMicUI();

    } catch (err) {
        console.error("Error fetching question:", err);
    }
}

async function finishInterview() {
    showScreen("loading");
    document.getElementById("loadingText").textContent = "Generating comprehensive feedback...";
    
    try {
        // FIXED: Relative path
        const res = await fetch("/get-feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: currentSessionId })
        });
        const data = await res.json();
        
        showScreen("feedback");
        document.getElementById("feedbackContent").innerHTML = marked.parse(data.feedback);
    } catch (err) {
        alert("Error generating feedback.");
        showScreen("start");
    }
}

/* =========================================
   6. AUDIO SYSTEMS (TTS & STT)
   ========================================= */

function speakText(text) {
    if (synth.speaking) synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    synth.speak(utterance);
}

interviewUI.mic.onclick = () => {
    if (synth.speaking) synth.cancel();

    interviewUI.mic.classList.add("hidden");
    interviewUI.confirm.classList.remove("hidden");
    transcript = "";
    interviewUI.transcript.innerHTML = "Listening...";
    
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript + " ";
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        interviewUI.transcript.innerHTML = transcript + '<span style="color:#94a3b8">' + interim + '</span>';
    };
    
    recognition.start();
};

document.getElementById("acceptBtn").onclick = async () => {
    if (recognition) recognition.stop();
    interviewUI.status.textContent = "Submitting answer...";
    
    // FIXED: Relative path
    await fetch("/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentSessionId, answer: transcript })
    });
    
    fetchNextQuestion();
};

document.getElementById("retryBtn").onclick = resetMicUI;

function resetMicUI() {
    interviewUI.mic.classList.remove("hidden");
    interviewUI.confirm.classList.add("hidden");
    interviewUI.transcript.innerHTML = "<span class='placeholder'>Your spoken answer will appear here...</span>";
    if(recognition) recognition.stop();
}
