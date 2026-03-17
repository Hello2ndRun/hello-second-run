// ════════════════════════════════════════════════════════════
// Express API Server — HELLO SECOND/RUN Backend
// Handles document extraction, UVP lookup, email capture
// Run: npx tsx server/api.ts
// ════════════════════════════════════════════════════════════

import express from 'express';
import { extractDocument, lookupUvp, client } from './claude.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// ─── CORS Middleware ───
app.use((req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://hello2ndrun.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
});

// ─── Document Extraction (Claude Vision) ───
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

// ─── UVP Lookup (Claude AI) ───
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

// ─── EAN Lookup Proxy (Open Food Facts) ───
app.get('/api/ean/:ean', async (req, res) => {
  try {
    const ean = req.params.ean.replace(/[\s-]/g, '');
    if (ean.length < 8) {
      return res.status(400).json({ error: 'EAN muss mindestens 8 Zeichen lang sein' });
    }

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    const p = data.product;
    res.json({
      ean,
      produktname: p.product_name || p.product_name_de || p.product_name_en || 'Unbekanntes Produkt',
      marke: p.brands || '',
      gewicht: p.quantity || p.net_weight || '',
      kategorie: mapCategory(p.categories_tags || []),
      imageUrl: p.image_front_url || p.image_front_small_url || '',
      quelle: 'openfoodfacts',
    });
  } catch (error: any) {
    console.error('EAN lookup error:', error.message);
    res.status(500).json({ error: 'EAN-Lookup fehlgeschlagen' });
  }
});

function mapCategory(categories: string[] = []): string {
  const joined = categories.join(' ').toLowerCase();
  if (joined.includes('beverage') || joined.includes('drink') || joined.includes('getränk')) return 'beverages';
  if (joined.includes('dairy') || joined.includes('milch') || joined.includes('cheese') || joined.includes('käse')) return 'dairy';
  if (joined.includes('frozen') || joined.includes('tiefkühl') || joined.includes('glacé')) return 'frozen';
  if (joined.includes('food') || joined.includes('snack') || joined.includes('pasta') || joined.includes('sauce')) return 'food';
  if (joined.includes('household') || joined.includes('haushalt') || joined.includes('cleaning')) return 'household';
  if (joined.includes('non-food') || joined.includes('pflege') || joined.includes('hygiene')) return 'non-food';
  return 'food';
}

// ─── Email Capture ───
const emailList: Array<{ email: string; timestamp: string }> = [];

app.post('/api/email-capture', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse erforderlich' });
    }

    // Prevent duplicates
    const exists = emailList.find(e => e.email === email);
    if (!exists) {
      emailList.push({ email, timestamp: new Date().toISOString() });
      console.log(`📧 Neue E-Mail erfasst: ${email} (gesamt: ${emailList.length})`);
    }

    res.json({ success: true, message: 'E-Mail gespeichert!' });
  } catch (error: any) {
    console.error('Email capture error:', error.message);
    res.status(500).json({ error: 'Fehler beim Speichern der E-Mail' });
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
      "Du bist der KI-Assistent von HELLO SECOND/RUN, dem Angebots-Tool für Sonderposten aus Salzburg, Österreich. Du hilfst Nutzern bei Fragen zu: Sonderposten-Handel, MHD-Ware, Preisfindung (EK/UVP/VK), Angebotserstellung, PDF-Dokumenten. Antworte immer auf Deutsch, kurz und hilfreich.";

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
  console.log(`🚀 HELLO SECOND/RUN API Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(``);
  console.log(`   GET  /api/health             — Health check`);
  console.log(`   GET  /api/ean/:ean           — EAN product lookup`);
  console.log(`   POST /api/extract-document   — Claude Vision PDF extraction`);
  console.log(`   POST /api/lookup-uvp         — Claude UVP price lookup`);
  console.log(`   POST /api/email-capture      — Email list capture`);
  console.log(`   POST /api/chat               — Claude AI chat assistant`);
  console.log(``);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ configured' : '❌ missing — set ANTHROPIC_API_KEY in .env'}`);
});
