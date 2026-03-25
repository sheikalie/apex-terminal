/**
 * APEX · Anthropic API Proxy
 * Netlify Serverless Function (Node.js runtime)
 *
 * Unlike Edge Functions (26s hard limit), regular Netlify Functions
 * support up to 26s by default, extendable to 15 min on paid plans.
 * More importantly: this function buffers the full response before
 * returning, avoiding the mid-stream cut-off problem.
 */

exports.handler = async (event) => {

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: { message: 'Method not allowed' } }) };
  }

  // API key guard
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY is not set. Go to Netlify → Site configuration → Environment variables and add it.' } })
    };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: { message: 'Invalid JSON' } }) };
  }

  delete body.api_key;

  // Call Anthropic
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'Could not reach Anthropic: ' + err.message } })
    };
  }

  // Surface Anthropic errors clearly
  if (!res.ok) {
    let errBody = {};
    try { errBody = await res.json(); } catch (_) {}
    const msg = errBody?.error?.message ?? 'Anthropic returned HTTP ' + res.status;
    return {
      statusCode: res.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: msg } })
    };
  }

  // Return full buffered response
  const data = await res.json();
  return {
    statusCode: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
