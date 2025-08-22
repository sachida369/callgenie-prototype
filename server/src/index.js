
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Papa from 'papaparse';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import { createOrUpdateVoice, ttsSynthesize } from './lib/elevenlabs.js';
import { startMockCampaign } from './lib/mockCampaign.js';
import { ensureData } from './lib/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*' }));
app.use(express.json({ limit: '10mb' }));

const upload = multer({ dest: path.join(__dirname, '../data/uploads') });

// DB (lowdb JSON)
const file = path.join(__dirname, '../data/db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { leads: [], campaigns: [], voices: [] });
await db.read();
await ensureData(db);

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

// Upload CSV of leads
app.post('/upload-leads', upload.single('file'), async (req, res) => {
  try {
    const csvText = fs.readFileSync(req.file.path, 'utf8');
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const leads = parsed.data.map((row, i) => ({
      id: Date.now() + i,
      name: row.name || row.Name || '',
      phone: row.phone || row.Phone || '',
      email: row.email || row.Email || '',
      status: 'NEW',
      intent: 'LOW',
      dnd: false
    }));
    db.data.leads.push(...leads);
    await db.write();
    res.json({ count: leads.length, leads });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Failed to parse CSV' });
  }
});

// Start campaign (mock; replace with Twilio dialer + Realtime)
app.post('/start-campaign', async (req, res) => {
  const { name, concept, schedule, retryRules, voice_id } = req.body || {};
  const campaign = {
    id: Date.now(),
    name: name || 'Campaign',
    concept,
    schedule,
    retryRules,
    voice_id,
    status: 'RUNNING',
    createdAt: new Date().toISOString()
  };
  db.data.campaigns.push(campaign);
  await db.write();
  startMockCampaign(db, campaign);
  res.json({ ok: true, campaign });
});

// Stats
app.get('/campaign-stats', async (req, res) => {
  const totals = {
    total: db.data.leads.length,
    hot: db.data.leads.filter(l => l.intent === 'HIGH').length,
    warm: db.data.leads.filter(l => l.intent === 'MEDIUM').length,
    cold: db.data.leads.filter(l => l.intent === 'LOW').length
  };
  res.json({ totals, campaigns: db.data.campaigns.slice(-5) });
});

// Log lead update
app.post('/log-lead', async (req, res) => {
  const { id, intent, status, notes, next_action } = req.body || {};
  const lead = db.data.leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (intent) lead.intent = intent;
  if (status) lead.status = status;
  if (notes) lead.notes = notes;
  if (next_action) lead.next_action = next_action;
  await db.write();
  res.json({ ok: true, lead });
});

// Voice cloning (via ElevenLabs if API key present)
app.post('/voice/clone', upload.single('file'), async (req, res) => {
  try {
    const name = req.body?.name || 'MyInstantVoice';
    const samplePath = req.file?.path;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!samplePath) return res.status(400).json({ error: 'No file uploaded' });

    const result = await createOrUpdateVoice({ name, samplePath, apiKey });
    if (result.error) return res.status(400).json(result);

    // Persist
    const existingIdx = db.data.voices.findIndex(v => v.name === name);
    if (existingIdx >= 0) db.data.voices[existingIdx] = { name, voice_id: result.voice_id };
    else db.data.voices.push({ name, voice_id: result.voice_id });
    await db.write();
    res.json({ voice_id: result.voice_id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Voice clone failed' });
  }
});

// Text → Speech
app.post('/voice/tts', async (req, res) => {
  try {
    const { voice_id, text } = req.body || {};
    if (!voice_id || !text) return res.status(400).json({ error: 'Missing voice_id or text' });
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
    const result = await ttsSynthesize({ voice_id, text, apiKey, modelId });
    if (result.error) return res.status(400).json(result);
    res.json({ audio_base64: result.audio_base64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// TODO: Twilio webhook & realtime sockets (scaffold)
app.post('/twilio/outbound-callback', async (req, res) => {
  // Receive Twilio webhooks here (answer, hangup, recording, etc.)
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CallGenie server running on :${PORT}`);
});
