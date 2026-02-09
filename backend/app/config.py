import os
import sys
from dotenv import load_dotenv

# Load .env for local dev (does nothing on Render, which is fine)
load_dotenv()

# --- 1. GET API KEY ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- 2. DEBUGGING (Check the Logs!) ---
if not GEMINI_API_KEY:
    print("❌ CRITICAL ERROR: GEMINI_API_KEY is MISSING in Environment Variables!", file=sys.stderr)
    # Fallback to prevent immediate crash, but API calls will fail
    GEMINI_API_KEY = "MISSING_KEY"
else:
    # Print masked key to verify it is reading the correct one
    print(f"✅ SUCCESS: API Key loaded! Starts with: {GEMINI_API_KEY[:4]}...", file=sys.stderr)

# --- 3. MODEL SELECTION ---
# We MUST use 1.5-flash first to verify the connection. 
# Once this works, you can try "gemini-2.0-flash-exp" later.
MODEL_NAME = "models/gemini-1.5-flash"

TOTAL_QUESTIONS = 5
