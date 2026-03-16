// ════════════════════════════════════════════════════════════
// Express API Server — Claude AI Proxy
// Handles document extraction and UVP lookup
// Run: npx tsx server/api.ts
// ════════════════════════════════════════════════════════════

import express from 'express';
import { extractDocument, lookupUvp, client } from './claude.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

// ─── CORS Middleware ───
app.use((req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://hello2ndrun.com']
    : ['http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ─── Rate Limiter (in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimit(req: any, res: any, next: any) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return next();
  }

  if (entry.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  entry.count++;
  return next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

app.use('/api', rateLimit);

// ─── Middleware ───
app.use(express.json({ limit: '50mb' }));

// ─── Health Check ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Document Extraction ───
app.post('/api/extract-document', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'base64Data and mimeType are required' });
    }

    const result = await extractDocument(base64Data, mimeType);
    res.json(result);
  } catch (error: any) {
    console.error('Extract error:', error.message);
    res.status(500).json({ error: 'Fehler bei der Dokumenten-Extraktion' });
  }
});

// ─── UVP Lookup ───
app.post('/api/lookup-uvp', async (req, res) => {
  try {
    const { produktname, marke, gewicht, ean } = req.body;

    if (!produktname) {
      return res.status(400).json({ error: 'produktname is required' });
    }

    const result = await lookupUvp(produktname, marke || '', gewicht || '', ean || '');
    res.json(result);
  } catch (error: any) {
    console.error('UVP lookup error:', error.message);
    res.status(500).json({ error: 'Fehler beim UVP-Lookup' });
  }
});

// ─── Chat (AI Assistant) ───
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, systemContext } = req.body as {
      message: string;
      history: Array<{ role: string; text: string }>;
      systemContext?: string;
    };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build Anthropic messages array from history + new message
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (Array.isArray(history)) {
      for (const entry of history) {
        messages.push({
          role: entry.role === 'user' ? 'user' : 'assistant',
          content: entry.text,
        });
      }
    }

    messages.push({ role: 'user', content: message });

    // Use client-provided system context or default
    const systemPrompt = systemContext ||
      "Du bist der KI-Assistent von HELLO SECOND/RUN, einer Sonderposten-Vermittlungsplattform aus Salzburg, Österreich. Du hilfst Nutzern bei Fragen zu: Sonderposten-Handel, MHD-Ware, Preisfindung (EK/UVP/VK), Angebotserstellung, PDF-Dokumenten. Antworte immer auf Deutsch, kurz und hilfreich.";

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.json({ text: text || 'Entschuldigung, ich konnte keine Antwort generieren.' });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   POST /api/extract-document — Claude Vision PDF extraction`);
  console.log(`   POST /api/lookup-uvp — Claude UVP price lookup`);
  console.log(`   POST /api/chat — Claude AI chat assistant`);
});
