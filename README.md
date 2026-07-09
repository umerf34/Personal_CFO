# Personal CFO — Wealth Dashboard

A diagnostic financial dashboard: classifies your month as Wealth Building,
Wealth Leaking, or Salary Rotating, with an AI "Personal CFO" verdict.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. Data is saved to your browser's localStorage.

The "Generate AI Insights" button calls `/api/insights`, which only exists
when running on Vercel (see below) or via `vercel dev` locally. Everything
else works without it.

## Deploy for free (Vercel)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → **Add New Project** → import the repo.
   (Free tier, no credit card needed for hobby projects.)
3. Vercel auto-detects Vite — leave build settings as default.
4. Before deploying, add an environment variable:
   - **Settings → Environment Variables**
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com/settings/keys
5. Deploy. You'll get a free `your-project.vercel.app` URL.

That's it — the frontend is static, and `/api/insights.js` runs as a
serverless function that holds your key server-side, so it's never exposed
to visitors.

### Alternative: Netlify

Works the same way — Netlify also supports serverless functions
(`netlify/functions/`), you'd just move `api/insights.js` into that folder
and add the env var in Site settings. Everything else is identical.

### If you don't want the AI feature at all

You can skip the API key entirely — the whole dashboard (net worth, KPIs,
red flags, charts) works with zero backend. Only the "Generate AI Insights"
button needs the serverless function. In that case, static hosts like
**GitHub Pages** or **Cloudflare Pages** work too (`npm run build`, deploy
the `dist/` folder).

## Notes

- Currency formatting uses Indian numbering (₹1,50,000 / K/L/Cr).
- Fonts (Cabinet Grotesk, Manrope, JetBrains Mono) load from Fontshare/Google
  Fonts CDNs — no local font files needed.
