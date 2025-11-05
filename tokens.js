/**
 * tokens.js - env-aware loader
 *
 * Behavior:
 * 1) If process.env.TOKENS is set, parse it as JSON array. Entries may be strings or objects { token, channelIds }.
 * 2) Else if TOKEN_1, TOKEN_2... env vars exist, load as simple tokens.
 * 3) Else try fallback files: tokens.json, tokens.js.orig, config.json (extract an array safely).
 *
 * Exports:
 *  - tokens: Array<{ token: string, channelIds: string[] }>
 *  - tokenMetadata: function() -> masked metadata (safe to return to clients)
 *
 * IMPORTANT: Do not commit real tokens. Use Render/GitHub Secrets / environment variables.
 */

const fs = require('fs');
const path = require('path');

let tokens = [];

/** Normalize an entry to { token, channelIds } */
function normalizeEntry(e) {
  if (!e) return null;
  if (typeof e === 'string') return { token: String(e), channelIds: [] };
  if (typeof e === 'object') return { token: String(e.token || e.value || ''), channelIds: Array.isArray(e.channelIds) ? e.channelIds : [] };
  return null;
}

/** 1) Try process.env.TOKENS (JSON array) */
if (process.env.TOKENS) {
  try {
    const parsed = JSON.parse(process.env.TOKENS);
    if (Array.isArray(parsed)) {
      tokens = parsed.map(normalizeEntry).filter(Boolean);
      console.log(`[tokens.js] Loaded ${tokens.length} token(s) from TOKENS env var.`);
    } else {
      console.warn('[tokens.js] TOKENS env var is not an array; ignoring.');
    }
  } catch (e) {
    console.warn('[tokens.js] Failed to parse TOKENS env var as JSON:', e.message);
  }
}

/** 2) Try TOKEN_1, TOKEN_2, ... env vars */
if (tokens.length === 0) {
  const simpleKeys = Object.keys(process.env).filter(k => /^TOKEN_\\d+$/i.test(k));
  if (simpleKeys.length > 0) {
    simpleKeys.sort((a, b) => {
      const na = Number(a.split('_')[1] || 0);
      const nb = Number(b.split('_')[1] || 0);
      return na - nb;
    });
    tokens = simpleKeys.map(k => ({ token: String(process.env[k]), channelIds: [] }));
    console.log(`[tokens.js] Loaded ${tokens.length} token(s) from TOKEN_# env vars.`);
  }
}

/** 3) Fallback: try tokens.json, tokens.js.orig, config.json */
if (tokens.length === 0) {
  const tryFiles = ['tokens.json', 'tokens.js.orig', 'config.json'];
  for (const fname of tryFiles) {
    const p = path.join(__dirname, fname);
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        // Try direct JSON parse first
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            tokens = parsed.map(normalizeEntry).filter(Boolean);
            console.log('[tokens.js] Loaded tokens from', fname);
            break;
          }
        } catch (e) {
          // Not strict JSON: try extract an array literal
          const arrMatch = raw.match(/(\\[[\\s\\S]*?\\])/m);
          if (arrMatch) {
            try {
              const cleaned = arrMatch[1].replace(/'/g, '\"');
              const parsed2 = JSON.parse(cleaned);
              if (Array.isArray(parsed2)) {
                tokens = parsed2.map(normalizeEntry).filter(Boolean);
                console.log('[tokens.js] Loaded tokens by extracting array from', fname);
                break;
              }
            } catch (e2) {
              // ignore parse error
            }
          }
        }
      } catch (e) {
        // ignore read error
      }
    }
  }
}

/** Safe metadata for client display */
function tokenMetadata() {
  return tokens.map((t, i) => ({
    index: i,
    masked: t.token ? (t.token.slice(0, 4) + '...' + t.token.slice(-4)) : null,
    hasChannelIds: Array.isArray(t.channelIds) && t.channelIds.length > 0,
    channelIds: Array.isArray(t.channelIds) ? t.channelIds : []
  }));
}

module.exports = {
  tokens,
  tokenMetadata
};
