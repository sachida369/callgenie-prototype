
import fs from 'fs';
import fetch from 'node-fetch';

// Minimal helper – relies on ELEVENLABS_API_KEY env var existing (optional).
// If no API key, return a fake voice id / silent wav.

export async function createOrUpdateVoice({ name, samplePath, apiKey }) {
  try {
    if (!apiKey) {
      // Offline mode: pretend we created a voice
      return { voice_id: `demo_${name.replace(/\s+/g, '_').toLowerCase()}` };
    }
    const fileStream = fs.createReadStream(samplePath);
    // ElevenLabs Instant Voice API (endpoint path may change; adjust as needed)
    const url = `https://api.elevenlabs.io/v1/voices/add`;

    const formData = new (await import('form-data')).default();
    formData.append('name', name);
    formData.append('files', fileStream);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { error: `Voice create failed: ${text}` };
    }
    const data = await resp.json();
    return { voice_id: data?.voice_id || data?.voice?.voice_id || data?.voiceID || 'unknown' };
  } catch (e) {
    console.error(e);
    return { error: 'Voice create failed' };
  }
}

export async function ttsSynthesize({ voice_id, text, apiKey, modelId }) {
  try {
    if (!apiKey || String(voice_id).startsWith('demo_')) {
      // Return a short silent WAV (placeholder) in base64 for demo
      const silentWav = generateSilentWav(1000); // 1s
      return { audio_base64: silentWav.toString('base64') };
    }

    // ElevenLabs text-to-speech
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
    const body = {
      text,
      model_id: modelId || 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const t = await resp.text();
      return { error: `TTS failed: ${t}` };
    }
    const arrayBuffer = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    return { audio_base64: buf.toString('base64') };
  } catch (e) {
    console.error(e);
    return { error: 'TTS failed' };
  }
}

// Generate a 16‑bit PCM mono WAV of silence (for demo)
function generateSilentWav(ms) {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * (ms / 1000));
  const headerSize = 44;
  const dataSize = numSamples * 2; // 16-bit mono
  const buf = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  // fmt chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20);  // PCM format
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  // samples already zero (silence)
  return buf;
}
