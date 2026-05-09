# AirCom — MERN Phone Marketplace

A production-ready full-stack mobile phone marketplace built with **MongoDB, Express, React (Vite), and Node.js**, featuring an **AI shopping assistant** powered by Anthropic's Claude.

The catalog is seeded from the bundled `phones.seed.json` (parsed from your "uniform for all brands.xlsx" — 543 phones across 9 brands).

```
phone-marketplace/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Navbar, Hero, PhoneCard, Chatbot, ...
│   │   ├── pages/            # Home, Catalog, PhoneDetail, About, Contact, Branches
│   │   ├── context/          # ThemeContext (dark/light)
│   │   ├── services/api.js   # Axios wrapper
│   │   └── styles/theme.css  # Design tokens
│   ├── index.html
│   └── vite.config.js
├── server/                   # Express + MongoDB backend
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/           # Phone, Branch, Contact (Mongoose)
│   │   ├── routes/           # /api/phones, /api/chatbot, /api/contact, /api/branches
│   │   ├── controllers/
│   │   ├── services/         # llmService.js, recommendService.js
│   │   ├── middleware/
│   │   ├── seed/             # seedPhones.js + .seed.json files
│   │   └── index.js
│   └── package.json
├── README.md
└── .gitignore
```

---

## Features

- Modern dark + neon UI (with optional light-mode toggle)
- Hero section, brand grid, featured carousel, promo banners
- Catalog with filters (brand, price, RAM, use case, 5G), sort, pagination, keyword search
- Phone detail page with full specs and bank offers
- About, Contact (with form → MongoDB), Branches (with map links)
- Fixed bottom-right **AI chatbot** powered by **Claude (Anthropic)** with structured tool-use that hands off to a server-side recommender
- REST API with rate limiting, helmet, CORS allowlist, gzip
- Mongoose models with text index for fast search
- Graceful rule-based fallback if no Anthropic key is set

---

## Quick start (local development)

### 1. Prerequisites

- **Node.js 18+** and npm
- A **MongoDB** connection string (local Mongo, Docker, or MongoDB Atlas free tier)
- (Optional, for the LLM chatbot) An **Anthropic API key** — sign up at <https://console.anthropic.com/>

### 2. Clone & install

```bash
# from the project root
cd server
npm install
cp .env.example .env       # then edit .env with your real values

cd ../client
npm install
cp .env.example .env       # leave VITE_API_BASE empty in dev
```

### 3. Configure environment

`server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/phone_marketplace
CLIENT_ORIGIN=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-...        # optional — falls back to rule-based chat if missing
ANTHROPIC_MODEL=claude-haiku-4-5
```

`client/.env`

```env
# Leave empty in dev — the Vite dev server proxies /api → http://localhost:5000
VITE_API_BASE=
```

### 4. Seed the database

```bash
cd server
npm run seed      # wipes and re-inserts 543 phones + 6 branches
```

### 5. Run

```bash
# terminal 1 — backend on http://localhost:5000
cd server
npm run dev

# terminal 2 — frontend on http://localhost:5173
cd client
npm run dev
```

Open <http://localhost:5173>. Click the 💬 button bottom-right to chat with **Buzz**.

---

## API reference

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/phones` | List + filter (`brand`, `minPrice`, `maxPrice`, `minRam`, `useCase`, `is5G`, `q`, `sort`, `page`, `limit`) |
| `GET`  | `/api/phones/featured` | Top 8 featured |
| `GET`  | `/api/phones/brands` | Distinct brands with counts |
| `GET`  | `/api/phones/:slug` | Single phone |
| `GET`  | `/api/branches` | All store branches (`?city=` to filter) |
| `POST` | `/api/contact` | Submit a contact form |
| `POST` | `/api/chatbot/message` | Body `{ messages: [{role, content}] }` → `{ reply, recommendations }` |

The chatbot endpoint is rate-limited to 30 req / minute / IP.

---

## Deployment

### Database — MongoDB Atlas (free)

1. Create a free cluster at <https://www.mongodb.com/cloud/atlas>.
2. Add your IP (or `0.0.0.0/0` while testing) under **Network Access**.
3. Create a database user under **Database Access**.
4. Click **Connect → Drivers** and copy the connection string (`mongodb+srv://...`).
5. Append `/phone_marketplace` as the database name.
6. Run `npm run seed` once locally with that URI to populate the cluster.

### Backend — Render (or Railway)

**Render (recommended)**

1. Push the repo to GitHub.
2. On <https://render.com>, click **New → Web Service** and select your repo.
3. **Root directory:** `server`
4. **Build command:** `npm install`
5. **Start command:** `npm start`
6. **Environment variables** — set `MONGODB_URI`, `CLIENT_ORIGIN` (your Vercel URL), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NODE_ENV=production`.
7. Hit **Create Web Service**. You'll get a URL like `https://aircom-api.onrender.com`.

**Railway** is similar — `New Project → Deploy from GitHub`, set the root to `server`, copy in the env vars.

### Frontend — Vercel (or Netlify)

**Vercel**

1. Click **Add New → Project** at <https://vercel.com> and import the same GitHub repo.
2. **Root directory:** `client`
3. **Framework preset:** Vite (auto-detected).
4. **Build command:** `npm run build` · **Output directory:** `dist`
5. **Environment variables:** `VITE_API_BASE=https://your-render-backend-url.onrender.com/api`
6. Deploy. Vercel will hand back a URL like `https://aircom.vercel.app`.
7. Go back to your Render service and set `CLIENT_ORIGIN` to that Vercel URL.

**Netlify** works the same — connect repo, base dir `client`, build `npm run build`, publish `dist`, set `VITE_API_BASE` env var.

### Connecting the dots

Make sure the three URLs reference each other consistently:

| Variable | Where it lives | Value |
|----------|----------------|-------|
| `MONGODB_URI` | Render env | Atlas connection string |
| `CLIENT_ORIGIN` | Render env | Vercel URL (e.g. `https://aircom.vercel.app`) |
| `VITE_API_BASE` | Vercel env | Render URL + `/api` |
| `ANTHROPIC_API_KEY` | Render env | Anthropic console |

After updating env vars on Render, click **Manual Deploy → Clear build cache & deploy**.

---

## Build scripts

| In `server/` | What it does |
|--------------|--------------|
| `npm run dev` | Nodemon hot-reload on file changes |
| `npm start`   | Production start |
| `npm run seed`| Wipe & reseed the DB |

| In `client/` | What it does |
|--------------|--------------|
| `npm run dev`     | Vite dev server (port 5173, proxies `/api` to backend) |
| `npm run build`   | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Customising the chatbot

The chatbot prompt and tool schema live in `server/src/services/llmService.js`. The recommendation logic is in `server/src/services/recommendService.js` — soft signals (brand match, use-case overlap, card offers, price-band centring) and a hard Mongo filter combined into a ranked top-5.

Swap the model by changing `ANTHROPIC_MODEL` (e.g. `claude-sonnet-4-6`).

If you delete `ANTHROPIC_API_KEY`, the server automatically falls back to a rule-based extractor + the same recommender — useful for demos.

---

## License

MIT — for demonstration purposes. Replace placeholder phone images and brand assets before commercial use.
