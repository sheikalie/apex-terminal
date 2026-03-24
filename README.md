# APEX · Investment Intelligence Terminal

Institutional-grade stock analysis powered by Claude AI — securely hosted on Netlify with the API key protected server-side via an Edge Function proxy.

---

## Project Structure

```
apex-terminal/
├── index.html                        # Frontend UI
├── netlify.toml                      # Netlify build & routing config
├── netlify/
│   └── edge-functions/
│       └── analyze.js                # Secure API proxy (Deno runtime)
└── README.md
```

---

## Deployment Guide (15 minutes)

### Step 1 — Push to GitHub

1. Go to [github.com](https://github.com) and create a **New Repository**
   - Name: `apex-terminal`
   - Visibility: **Public** (required for free Netlify deploys) or Private (Netlify Pro)
   - Do NOT initialize with a README

2. Push this project:
   ```bash
   cd apex-terminal
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/apex-terminal.git
   git push -u origin main
   ```

---

### Step 2 — Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → authorize → select your `apex-terminal` repo
3. Build settings (should auto-detect from `netlify.toml`):
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
4. Click **Deploy site**

Your site will be live at `https://random-name-123.netlify.app` in ~60 seconds.

---

### Step 3 — Add Your Anthropic API Key

This is the critical security step — the key lives only on Netlify's servers, never in your code.

1. In Netlify dashboard → **Site configuration** → **Environment variables**
2. Click **Add a variable**
3. Set:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` *(your key from [console.anthropic.com](https://console.anthropic.com))*
4. Click **Save**
5. Go to **Deploys** → **Trigger deploy** → **Deploy site** (to pick up the new env var)

---

### Step 4 (Optional) — Custom Domain

1. In Netlify → **Domain management** → **Add custom domain**
2. Enter your domain (e.g. `apex.yourdomain.com`)
3. Update your DNS with the CNAME record Netlify provides
4. Netlify auto-provisions a free SSL certificate via Let's Encrypt

---

## Security Architecture

```
Browser (user)
     │
     │  POST /api/analyze  { ticker, model, prompt }
     ▼
Netlify Edge Function (analyze.js)
     │  ← ANTHROPIC_API_KEY lives here, server-side only
     │
     │  POST https://api.anthropic.com/v1/messages
     │  Headers: { x-api-key: $ANTHROPIC_API_KEY }
     ▼
Anthropic API
     │
     ▼  (response streamed back through the Edge Function)
Browser
```

The API key is **never sent to the browser** and **never appears in source code**. It exists only as a Netlify environment variable, injected at runtime into the Edge Function via `Deno.env.get('ANTHROPIC_API_KEY')`.

---

## Local Development

To test locally before deploying:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your Netlify site
netlify link

# Create a local .env file (gitignored)
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" > .env

# Start local dev server with Edge Functions
netlify dev
```

App will be available at `http://localhost:8888` with the Edge Function running at `http://localhost:8888/api/analyze`.

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

---

## Cost Estimate

Each full analysis call uses approximately **3,000–5,000 tokens** (input + output + web search).

| Usage | Approx. Cost |
|---|---|
| 1 analysis | ~$0.02–0.05 |
| 20 analyses/day | ~$0.40–1.00/day |
| 100 analyses/month | ~$2–5/month |

Set a **monthly spend limit** at [console.anthropic.com/settings/limits](https://console.anthropic.com/settings/limits) to cap exposure.

---

## Disclaimer

This tool is for informational purposes only. Not financial advice. Always consult a licensed financial advisor before making investment decisions.
