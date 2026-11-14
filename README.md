# SurveyMind AI — Shared Backend (Vercel KV)

**Ek Admin, sob phone.** Ebar je kono phone theke submit korle answer ta ek Admin Dashboard-e joma hobe. Telegram lagbe na, onno kono account lagbe na.

**One Admin, every phone.** Answers submitted from any phone now collect into one Admin Dashboard. No Telegram, no other account.

## Files
- `index.html` — SurveyMind AI app (emerald-and-coral design, Go Live removed from the top menu, respondent mode locked)
- `api/submit.js` — saves one answer into Vercel KV
- `api/responses.js` — Admin reads shared answers from Vercel KV
- `api/survey.js` — saves / reads survey definitions, so a survey made on one phone opens on any other
- `vercel.json` — `/api/*` goes to the functions, everything else to `index.html` (so `?s=SRV-001` links work)
- `SETUP-BACKEND.md` — backend setup, step by step (romanised Bangla + English)

## 4 steps — GitHub + Vercel
1. **GitHub:** new **public** repo. Upload all files in this folder — `index.html`, `vercel.json`, `README.md`, `SETUP-BACKEND.md`, and the `api/` folder — **not the zip**. Commit.
2. **Vercel:** Import the repo, press **Deploy**. You get a live link like `https://surveymind-ai.vercel.app`.
3. **Backend connect (onek important):** Vercel dashboard-e jao → **Storage** → **Browse Marketplace** → **Upstash** (Redis) → **Create** / **Add Integration** → project-ta select kore **Connect** koro. Vercel nije `UPSTASH_REDIS_REST_URL` ar `UPSTASH_REDIS_REST_TOKEN` bosiye dibe — tomar hate kichu paste korte hobe na. (Purono Vercel KV ar nai, tai KV khuje pabe na — Upstash khujo.) Tarpor **Redeploy** koro.
4. **Test from another phone:** live link khulo → `?s=SRV-001` link-ta onno phone-e pathao → submit koro → **tomar phone-e Admin Dashboard khulo** — answer-ta okhane dekhabe. Admin-e badge dekhabe: **“Shared backend: ON”**.

## Jodi backend connect na koro
Site-ta tobuo cholbe, kintu answer shudhu oi phone-er Admin-ei dekhabe. Badge dekhabe: **“Shared backend: OFF — answers on this device only”**.

## Survey link to share
Live link + `?s=SRV-001` — jemon `https://surveymind-ai.vercel.app/?s=SRV-001`. Khulle shudhu survey form khulbe — kono home page na, kono Admin na, kono sign-in na.
