/**
 * server.js - fake webservice for Render
 *
 * Endpoints:
 * GET  /         -> status, version, tokenCount
 * GET  /tokens   -> masked metadata (or reveal tokens if ADMIN_KEY matches)
 * POST /send     -> simulate sending (logs and returns simulated response)
 *
 * Configure:
 * - TOKENS env (or TOKEN_#) or tokens.json fallback
 * - ADMIN_KEY (optional) for revealing tokens (dangerous)
 */

const express = require('express');
const bodyParser = require('body-parser');
const { tokens, tokenMetadata } = require('./tokens.js');

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || '1.0.0';

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: VERSION,
    tokenCount: Array.isArray(tokens) ? tokens.length : 0
  });
});

app.get('/tokens', (req, res) => {
  const adminKey = req.query.adminKey || process.env.ADMIN_KEY;
  if (adminKey && adminKey === process.env.ADMIN_KEY) {
    return res.json({ revealed: true, tokens });
  }
  res.json({ revealed: false, tokens: tokenMetadata() });
});

app.post('/send', (req, res) => {
  const { tokenIndex, channelId, message } = req.body || {};
  if (typeof tokenIndex !== 'number' || !message) {
    return res.status(400).json({ error: 'tokenIndex (number) and message (string) required' });
  }
  const t = tokens[tokenIndex];
  if (!t) return res.status(404).json({ error: 'tokenIndex not found' });

  // Simulate — do NOT actually contact Discord
  console.log(`[simulate-send] tokenIndex=${tokenIndex} channelId=${channelId} message=${message}`);
  res.json({ ok: true, simulated: true, tokenIndex, channelId, message });
});

app.listen(PORT, () => {
  console.log(`Fake server listening on port ${PORT} - version ${VERSION}`);
});
