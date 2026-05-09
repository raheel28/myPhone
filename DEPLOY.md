# Deploying to Railway (all-in-one)

This deploys frontend + backend as a **single Railway service**. The Express server
also serves the built React app, so you get one URL, no CORS, and one set of env vars.

Code prep is already done:
- Root `package.json` orchestrates the build (`npm run build` → installs client deps,
  runs `vite build`, installs server deps).
- `server/src/index.js` serves `client/dist` in production with an SPA fallback.
- The chatbot already has its own rate limit + LLM fallback wired up.

## 1. MongoDB Atlas (free tier)

1. Sign up at <https://www.mongodb.com/cloud/atlas> (free, no card).
2. **Build a Cluster** → pick **M0 (Free)** → choose a region close to where Railway
   will run (US East works fine globally) → **Create**.
3. **Database Access** → **Add New Database User**.
   - Auth method: Password.
   - Username + password (use a strong one — copy it somewhere; you'll need it).
   - Built-in role: **Atlas admin** (or **Read and write to any database**).
4. **Network Access** → **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`). Railway's IPs aren't fixed, so allowlist-by-IP doesn't work.
5. **Database** → **Connect** → **Drivers** → copy the connection string.
   It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Append the database name before the `?`:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/phone_marketplace?retryWrites=true&w=majority`

## 2. Seed Atlas with the catalog (one-off, from your machine)

Atlas starts empty. Seed it from your laptop **before** deploying.

In `server/.env`, temporarily replace `MONGODB_URI` with your Atlas string, then:

```bash
cd server
npm run seed
```

You should see `Inserting 543 phones…` and `Seed complete.` Restore your local
`MONGODB_URI` after if you still want a local DB for dev, or keep Atlas for both.

## 3. Push to GitHub

```bash
# from project root
git init
git add .
git commit -m "Ready for deploy"
```

Create a new empty repo on <https://github.com/new> (name it whatever, e.g.
`phone-marketplace`). Then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/phone-marketplace.git
git push -u origin main
```

> Sanity check: `git status` after the push should be clean. `node_modules` and
> `.env` files are already in `.gitignore` — verify with
> `git ls-files | grep -E '(node_modules|\.env$)'` (should print nothing).

## 4. Deploy on Railway

1. Sign up at <https://railway.app>. The free trial gives $5 of credits.
2. **New Project** → **Deploy from GitHub repo** → authorize Railway → pick the
   repo you just pushed.
3. Railway's Nixpacks will detect Node.js, run `npm install`, then `npm run build`,
   then `npm start`. The first deploy will fail because env vars aren't set yet —
   that's expected.

## 5. Set environment variables on Railway

In the service → **Variables** → add these:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas connection string from step 1 |
| `GROQ_API_KEY` | your Groq key (`gsk_…`) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` (or `llama-3.1-8b-instant` for higher daily quota) |
| `CLIENT_ORIGIN` | (leave unset — same-origin deploy) |
| `PORT` | (leave unset — Railway injects this automatically) |

After saving, Railway redeploys.

## 6. Get a public URL

Service → **Settings** → **Networking** → **Generate Domain**. You'll get something
like `phone-marketplace-production.up.railway.app`. Open it — you should see the
React app, the catalog should populate, and the chat icon (bottom-right) should
respond.

## 7. Verify

- `https://<your-app>.up.railway.app/api/health` → should return `{"status":"ok",…}`
- Click 💬 → ask "gaming phone around 25k" → should return picks.
- Badge should read **AI**, not **OFFLINE**. If it's OFFLINE, check Railway's
  **Deployments → View Logs** for `[chatbot] LLM path failed` — most likely a
  rate limit or wrong model name in env.

## Updating after deploy

Edit code locally → `git commit` → `git push`. Railway auto-rebuilds and
deploys on every push to `main`. Env-var changes don't auto-redeploy; click
**Redeploy** in the Railway UI after editing them.

## Common gotchas

- **Build fails with "Cannot find module 'vite'"** — make sure you committed
  `client/package.json` and the root `package.json`.
- **App loads but API 404s** — `NODE_ENV` isn't set to `production`, so the
  static-file middleware never engages. Check the Railway env var.
- **`/api/phones` returns 500** — Atlas IP allowlist hasn't been opened to
  `0.0.0.0/0`, or the connection string is wrong.
- **Chatbot stuck on OFFLINE** — `GROQ_API_KEY` missing/invalid, or you've
  hit the daily token cap. Switch model to `llama-3.1-8b-instant`.

## Custom domain (optional)

Service → **Settings** → **Networking** → **Custom Domain** → enter
`yourdomain.com`. Railway gives you a CNAME to add at your registrar. Once DNS
propagates, both the Railway-generated domain and your custom domain serve the
same app.
