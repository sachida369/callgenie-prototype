
# CallGenie – AI Cold Calling SaaS (Prototype)

Full‑stack prototype for an AI cold‑calling web tool:
- Upload CSV leads
- Enter campaign concept (e.g., “IDFC First Bank – Used Car Loan”)
- (Scaffold) AI calls via Twilio, realtime LLM dialog, transfer hot leads to human agent
- **Instant voice cloning** from ~1‑minute sample (via ElevenLabs API if provided)
- Frontend: React + Vite + Tailwind
- Backend: Node + Express
- Storage: JSON (lowdb) in this prototype

> This is a production‑ready **scaffold** with working features where possible and clear TODOs for realtime voice and dialer plumbing.
> Replace stubs with your vendor integrations (Twilio Media Streams, OpenAI Realtime, etc.).

---

## 1) Quick Start (Local)

### Prereqs
- Node.js 18+
- npm (or pnpm/yarn)
- (Optional) Twilio account + credentials
- (Optional) ElevenLabs API key for instant voice cloning

### Install
```bash
cd server
npm install
cd ../client
npm install
```

### Configure Environment
Copy `server/.env.example` → `server/.env` and fill in values:
```
PORT=8080
CLIENT_URL=http://localhost:5173

# Twilio (optional for outbound & handoff)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_CALLER_ID=
TWILIO_WEBHOOK_BASE=

# OpenAI (placeholder for Realtime / LLM)
OPENAI_API_KEY=

# ElevenLabs (optional)
ELEVENLABS_API_KEY=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

### Run Dev
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```
Open: http://localhost:5173

---

## 2) GitHub Deployment

### Frontend → GitHub Pages
1) Push repo to GitHub.  
2) From `client/`:
```bash
npm run build
npm run deploy
```
3) In repo **Settings → Pages**, set source to `gh-pages` branch.

Set `VITE_SERVER_URL` in `client/.env.production` to your backend URL (Railway/Render/Fly).

### Backend → Railway/Render
- Create a new service, connect your repo (root = `/server`).
- Add env vars from `server/.env.example`.
- Deploy; copy the public URL.  
- Update client env to point to this URL.

---

## 3) What Works Now
- Upload CSV & preview
- Create/start a **mock** campaign (simulated dialer & transcripts)
- Campaign stats & lead tagging
- **Voice cloning**
  - POST `/voice/clone` with a ~1‑minute sample (mp3/wav). If ELEVENLABS_API_KEY is set, creates/updates an instant voice and returns `voice_id`.
  - POST `/voice/tts` with `voice_id` + `text` to receive base64 audio (via ElevenLabs if enabled; otherwise returns a placeholder).
- Clear TODOs for Twilio Media Streams + OpenAI Realtime wiring

---

## 4) Legal & Compliance
- Obtain consent and comply with DND/opt‑out.
- Add proper auth, rate limiting, input validation in production.
- Use a proper database and secure PII.

---

## 5) Sample cURL

```bash
# 1) Upload sample (~30–60s of clean speech)
curl -X POST http://localhost:8080/voice/clone \
  -F "name=MyVoice" \
  -F "file=@/path/to/voice_sample.mp3"

# => { "voice_id": "..." }

# 2) TTS with that voice
curl -X POST http://localhost:8080/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"voice_id":"...", "text":"Hello from my cloned voice."}'
# => { "audio_base64": "UklGR..." }
```

---

## 6) Notes
- This repo purposefully keeps the audio pipeline simple but shows exactly **where** to connect Twilio realtime and GPT streaming.
