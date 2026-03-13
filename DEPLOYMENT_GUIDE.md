# Deployment Guide: Research Hub on Vercel (Zero Cost)

This guide explains how to deploy the Research Hub and ensure AI features work seamlessly in a cloud environment without any paid LLM subscriptions.

## 1. Prerequisites
- A **GitHub** repository with this code.
- A **Vercel** account.
- A **Supabase** project (DB & Storage).

## 2. Zero-Cost AI Options
Since you don't have a paid LLM, here are the two free ways to host:

### Option A: Groq (Free & Lightning Fast)
[Groq](https://console.groq.com/) provides a very generous **Free Tier** that is significantly faster than local models.
- **Variable**: `GROQ_API_KEY`
- **Variable**: `AI_PROVIDER` = `groq`

### Option B: Tunnel Local Ollama (ngrok)
If you want to use your local Ollama for free on Vercel:
1. Install [ngrok](https://ngrok.com/).
2. Run: `ngrok http 11434`
3. Copy the `https://xxxx.ngrok-free.app` URL.
- **Variable**: `OLLAMA_HOST` = `https://xxxx.ngrok-free.app` (The URL from ngrok)
- **Variable**: `AI_PROVIDER` = `ollama`

## 3. Environment Variables (Vercel Dashboard)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `GROQ_API_KEY` | (Optional) Your free API key from Groq |
| `AI_PROVIDER` | Pick `groq` or `ollama` |

## 4. Deployment Steps
1. Connect your GitHub repository to Vercel.
2. Paste the environment variables above.
3. Click **Deploy**.

## 5. How it Works
- **Local Dev**: Uses your local Ollama.
- **Production**: Automatically switches to **Groq** (if key provided) or talks to your **tunneled local Ollama** to ensure the app stays 100% free.

---
**Your Research Hub is now ready to scale for $0/month!**
