// /api/listen.js — honest capture for pasted media links.
//
// Purpose: when a reader pastes a YouTube or podcast/audio link into chat, actually
// *capture* the words instead of guessing from the description. Returns a `provenance`
// flag so the UI can label the source honestly:
//   'captions'   — real YouTube caption track
//   'audio'      — real audio transcribed via Groq Whisper (whisper-large-v3)
//   'show-notes' — neither reachable; fell back to the video/page description
//
// Reuses the same Vercel env vars as api/summarize.js — no new key required:
//   GROQ_API_KEY  (Whisper + Llama summary), GOOGLE_AI_KEY, ANTHROPIC_API_KEY (fallbacks)
// Whisper access must be enabled on the Groq account for provenance:'audio' to work;
// if it isn't, capture degrades gracefully to 'show-notes'.
//
// Standalone serverless function — does not import or alter api/summarize.js.

const MAX_TRANSCRIPT = 8000;   // chars fed to the summarizer
const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // Groq Whisper free-tier friendly cap

// ── Body parser (mirrors summarize.js) ───────────────────────────────────────
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// ── URL shape detection ──────────────────────────────────────────────────────
function youtubeId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function isAudioUrl(url) {
  return /\.(mp3|m4a|aac|ogg|oga|wav|flac|mp4|m4b)(\?|#|$)/i.test(String(url));
}

// ── YouTube captions ─────────────────────────────────────────────────────────
// Pull the real caption track from the watch page's player response. No API key.
async function fetchYouTubeCaptions(id) {
  const out = { transcript: '', title: '', description: '' };
  let html = '';
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) html = await r.text();
  } catch {}
  if (!html) return out;

  // Title + description (used for the show-notes fallback too)
  const titleM = html.match(/<meta name="title" content="([^"]*)"/) || html.match(/<title>([^<]*)<\/title>/);
  if (titleM) out.title = decodeEntities(titleM[1]).replace(/ - YouTube$/, '');
  const descM = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (descM) { try { out.description = JSON.parse(`"${descM[1]}"`); } catch { out.description = descM[1]; } }

  // captionTracks[].baseUrl — prefer an English track, else the first available
  const tracks = [];
  const re = /"baseUrl":"([^"]+)"[^}]*?"(?:vssId|languageCode)":"([^"]*)"|"languageCode":"([^"]*)"[^}]*?"baseUrl":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const baseUrl = (m[1] || m[4] || '').replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    const lang = (m[2] || m[3] || '').toLowerCase();
    if (baseUrl.includes('timedtext')) tracks.push({ baseUrl, lang });
  }
  if (!tracks.length) return out;
  const pick = tracks.find(t => t.lang.startsWith('en')) || tracks[0];

  try {
    const cr = await fetch(pick.baseUrl, { signal: AbortSignal.timeout(10000) });
    if (cr.ok) {
      const xml = await cr.text();
      const parts = [];
      const tre = /<text[^>]*>([\s\S]*?)<\/text>/g;
      let tm;
      while ((tm = tre.exec(xml))) parts.push(decodeEntities(tm[1].replace(/<[^>]+>/g, ' ')));
      out.transcript = parts.join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch {}
  return out;
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// ── Audio → Groq Whisper ─────────────────────────────────────────────────────
async function transcribeAudio(url, key) {
  if (!key) return '';
  let buf, contentType = 'audio/mpeg';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return '';
    const len = Number(r.headers.get('content-length') || 0);
    if (len && len > MAX_AUDIO_BYTES) return ''; // too large to transcribe within limits
    contentType = r.headers.get('content-type') || contentType;
    const ab = await r.arrayBuffer();
    if (ab.byteLength > MAX_AUDIO_BYTES) return '';
    buf = new Uint8Array(ab);
  } catch { return ''; }
  try {
    const fd = new FormData();
    fd.append('file', new Blob([buf], { type: contentType }), 'audio.mp3');
    fd.append('model', 'whisper-large-v3');
    fd.append('response_format', 'text');
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
      signal: AbortSignal.timeout(50000),
    });
    if (!r.ok) return '';
    return (await r.text()).trim();
  } catch { return ''; }
}

// Best-effort: find a playable audio enclosure on a podcast episode *page*.
async function findAudioEnclosure(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { audio: '', title: '', description: '' };
    const html = await r.text();
    const title = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '';
    const description = (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || '';
    const audio =
      (html.match(/<meta property="og:audio" content="([^"]*)"/) || [])[1] ||
      (html.match(/<audio[^>]+src="([^"]+)"/) || [])[1] ||
      (html.match(/"(https?:\/\/[^"]+\.(?:mp3|m4a|aac))(?:\?[^"]*)?"/) || [])[1] || '';
    return { audio: decodeEntities(audio), title: decodeEntities(title), description: decodeEntities(description) };
  } catch { return { audio: '', title: '', description: '' }; }
}

// ── Compact summary cascade (Groq → Gemini → Claude); own copy, summarize.js untouched ──
async function summarizeText(title, text) {
  const prompt = `You are summarizing the ACTUAL transcript/content of a media item titled "${title}". Write a tight 3-4 sentence summary grounded only in the text: what is said, the key names/numbers, and why it matters. No filler, never paraphrase the title.\n\nCONTENT:\n${text}`;
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groq}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 320, temperature: 0.3 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) { const d = await r.json(); const s = d?.choices?.[0]?.message?.content?.trim(); if (s) return { summary: s, provider: 'Groq' }; }
    } catch {}
  }
  const gem = process.env.GOOGLE_AI_KEY;
  if (gem) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gem}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 320, temperature: 0.3 } }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) { const d = await r.json(); const s = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim(); if (s) return { summary: s, provider: 'Gemini' }; }
    } catch {}
  }
  const anth = process.env.ANTHROPIC_API_KEY;
  if (anth) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': anth, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 320, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) { const d = await r.json(); const s = d?.content?.[0]?.text?.trim(); if (s) return { summary: s, provider: 'Claude' }; }
    } catch {}
  }
  return { summary: '', provider: '' };
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try { body = await readBody(req); } catch { return res.status(400).json({ error: 'Bad body' }); }
  const url = String(body.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'url required' });

  let provenance = 'show-notes';
  let title = '';
  let captured = '';       // the real transcript when we have one
  let notes = '';          // description/show-notes fallback text

  const ytId = youtubeId(url);
  if (ytId) {
    const yt = await fetchYouTubeCaptions(ytId);
    title = yt.title || 'YouTube video';
    notes = yt.description || '';
    if (yt.transcript && yt.transcript.length > 40) { captured = yt.transcript; provenance = 'captions'; }
  } else {
    // Podcast / audio. Direct audio URL, or discover an enclosure on the page.
    let audioUrl = isAudioUrl(url) ? url : '';
    if (!audioUrl) {
      const found = await findAudioEnclosure(url);
      audioUrl = found.audio; title = found.title; notes = found.description;
    }
    if (audioUrl) {
      const tx = await transcribeAudio(audioUrl, process.env.GROQ_API_KEY);
      if (tx && tx.length > 40) { captured = tx; provenance = 'audio'; }
    }
  }

  const sourceText = (captured || notes || '').slice(0, MAX_TRANSCRIPT);
  if (!sourceText || sourceText.length < 40) {
    return res.status(200).json({
      summary: '', provenance: 'show-notes', title,
      error: 'Could not capture captions, audio, or show notes for this link.',
    });
  }

  const { summary, provider } = await summarizeText(title || 'this media', sourceText);
  if (!summary) {
    // Capture succeeded but no summarizer configured — return the honest capture status.
    return res.status(200).json({
      summary: '', provenance, title, provider: '',
      error: 'No AI provider configured to summarize. Add GROQ_API_KEY in Vercel env vars.',
    });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({ summary, provenance, title, provider });
}
