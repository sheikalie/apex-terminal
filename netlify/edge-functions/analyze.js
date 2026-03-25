// This file intentionally disabled — routing is handled by netlify/functions/analyze.js
// Do not delete this file (it prevents Netlify from auto-routing to edge)
export default async () => {
  return new Response(JSON.stringify({ error: { message: 'Use /api/analyze via the regular function, not edge.' } }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
export const config = { path: '/api/analyze-edge-disabled' };
