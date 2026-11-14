# SETUP-BACKEND — Shared backend setup, step by step

**Goal / Uddeshyo:** onno phone theke submit korle answer-ta **tomar** Admin Dashboard-e ashbe. Eitar jonno ekta shared database lagbe — Upstash Redis (Marketplace diye, Vercel-er free storage). Purono Vercel KV ar nai, tai KV khuje pabe na — Upstash khujte hobe. Telegram lagbe na. Onno kono account lagbe na. Token hate paste korte hobe na.

## Step 1 — GitHub-e upload koro
1. GitHub-e notun **public** repo khulo (jemon `surveymind-ai`).
2. Ei folder-er **sob file** upload koro: `index.html`, `vercel.json`, `README.md`, `SETUP-BACKEND.md`, ar `api/` folder-ta.
3. Zip-ta upload koro **na**. Commit koro.

## Step 2 — Vercel-e Deploy koro
1. Vercel-e jao → **Add New → Project** → GitHub repo-ta **Import** koro.
2. Kichu change korte hobe na — **Deploy** chapo.
3. Live link pabe, jemon `https://surveymind-ai.vercel.app`.

## Step 3 — Backend connect koro (sobcheye important step)
1. Vercel dashboard-e, ei project-ta khulo.
2. Uporer menu-te **Storage**-te jao.
3. **Browse Marketplace** chapo → **Upstash** khujo (lekha thakbe **Redis**) → **Create** / **Add Integration** chapo.
4. Naam dao (jemon `surveymind-kv`) → **Create** chapo.
5. Ekta box ashbe — project-ta select kore **Connect** chapo.
6. Vercel nije duto jinish bosiye dibe: `UPSTASH_REDIS_REST_URL` ar `UPSTASH_REDIS_REST_TOKEN`. Tomar hate kichu copy-paste korte hobe na, token-ta kothao lekhte hobe na.
7. **Deployments**-e jao → shesher deployment-er pashe **⋯ → Redeploy** chapo. (Env var add howar por Redeploy na korle backend cholbe na — eita bhul koro na.)

## Step 4 — Test koro (onno phone diye)
1. Tomar phone-e live link khulo.
2. **Copy public link** chapo — link-ta hobe `live-link/?s=SRV-001`.
3. Oi link-ta onno ekta phone-e pathao (WhatsApp / Messenger).
4. Onno phone-e link khulo — **shudhu survey form** khulbe. Form puron kore **Submit** koro.
5. **Tomar phone-e** Admin Dashboard khulo → answer-ta okhane dekhabe. Uporer dike badge dekhabe: **“Shared backend: ON — answers from all phones collect here”**.
6. CSV download korle shared answer-gulo o thakbe.

## Jodi kaj na kore — check koro
- **Badge OFF dekhale:** Step 3-ta hoy nai. Storage → Upstash Redis-e jao, database-ta project-er sathe **Connect** ache kina dekho, tarpor **Redeploy** koro.
- **Form khulche na:** link-ta thik ache kina dekho — `?s=SRV-001` thakte hobe. Survey-ta Vercel site-ei banate hobe (Muse-er link theke banale Vercel-e thakbe na).
- **Answer asche na:** onno phone-e submit korar por tomar phone-e Admin-e **“Refresh shared answers”** button-ta chapo.

## Kivabe kaj kore (sir-ke bolle)
- Submit korle answer-ta Vercel-er server function (`api/submit.js`) Upstash Redis-e save kore.
- Admin Dashboard khulle (`api/responses.js`) sob phone-er answer-gulo ek jaygay ene dekhay.
- Survey-er definition-tao (`api/survey.js`) backend-e save hoy, tai onno phone-e share link khulle form-ta khule.
- Kono token / password code-e lekha nai — sob Vercel-er Environment Variable-e thake.
