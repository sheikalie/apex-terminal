/**
 * APEX · Anthropic API Proxy
 * Netlify Edge Function — runs at the edge (Deno runtime)
 *
 * - Keeps ANTHROPIC_API_KEY server-side, never exposed to the browser
 * - Streams the Anthropic response directly back to the client
 * - Handles CORS for local development
 */

export default async (request, context) => {

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (request.method !== 'POST') {
    return json({ error: { message: 'Method not allowed' } }, 405);
  }

  // ── API key guard ───────────────────────────────────────────────────────────
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({
      error: { message: 'ANTHROPIC_API_KEY environment variable is not set. Add it in Netlify → Site Settings → Environment Variables.' }
    }, 500);
  }

  // ── Parse and validate body ──────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  // Safety: strip any API key the client might have accidentally sent
  delete body.api_key;

  // ── Forward to Anthropic ─────────────────────────────────────────────────────
  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json({ error: { message: 'Failed to reach Anthropic API: ' + err.message } }, 502);
  }

  // ── If Anthropic returned an error, surface the real message ─────────────────
  if (!anthropicRes.ok) {
    let errBody = {};
    try { errBody = await anthropicRes.json(); } catch (_) {}
    const msg = errBody?.error?.message
      ?? 'Anthropic returned HTTP ' + anthropicRes.status + '. Check your API key has billing enabled at console.anthropic.com.';
    return json({ error: { message: 'Anthropic error: ' + msg } }, anthropicRes.status);
  }

  // ── Stream the successful response straight back ──────────────────────────────
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      'Content-Type': anthropicRes.headers.get('Content-Type') ?? 'application/json',
      ...corsHeaders(),
    },
  });
};

// ── Route config ─────────────────────────────────────────────────────────────
export const config = { path: '/api/analyze' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
