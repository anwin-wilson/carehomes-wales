# Valley Care Group — Website & API

A premium care home website and content management system for Valley Care Group, South Wales.

## Project Structure

```
carehomes-wales/
├── frontend/          ← Static website (HTML, CSS, JS, images)
│   ├── index.html
│   ├── homes.html
│   ├── services.html
│   ├── about.html
│   ├── contact.html
│   ├── jobs.html
│   ├── admin.html
│   ├── homes/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── vercel.json
│
└── backend/           ← Node.js/Express API (Vercel KV)
    ├── server.js
    ├── api/
    │   └── index.js   ← Vercel serverless entry point
    ├── package.json
    ├── .env.example
    └── vercel.json
```

---

## 🚀 Deploying to GitHub + Vercel

### Step 1 — Create a GitHub Repository

1. Go to [github.com](https://github.com) → **Sign up** (free account)
2. Click **New repository**
3. Name it `carehomes-wales` (or any name you like)
4. Set to **Private**
5. Click **Create repository**

### Step 2 — Push Code to GitHub

Open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial deployment setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/carehomes-wales.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 3 — Create a Vercel Account

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (free)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Log in:
   ```bash
   vercel login
   ```

---

### Step 4 — Deploy the Backend

```bash
cd backend
npm install
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `vcg-backend`
- **Which directory?** → `./` (current — the `backend/` folder)
- **Want to override settings?** → No

Note the **production URL** shown at the end, e.g. `https://vcg-backend.vercel.app`

#### Add Environment Variables to the Backend

In the Vercel dashboard:
1. Open your `vcg-backend` project → **Settings** → **Environment Variables**
2. Add these variables (for **Production**, **Preview**, and **Development**):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random string (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `ADMIN_PASSWORD` | Your secure admin password (min 12 chars) |
| `ALLOWED_ORIGIN` | Your frontend URL (fill in after Step 5, e.g. `https://vcg-frontend.vercel.app`) |

#### Set up Vercel KV (Free Redis Database)

In the Vercel dashboard:
1. Go to your `vcg-backend` project → **Storage** tab
2. Click **Create Database** → **KV (Redis)**
3. Name it `vcg-kv`, choose the free tier, click **Create**
4. Vercel will automatically add `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` to your project env vars

#### Redeploy the backend after adding env vars:
```bash
cd backend
vercel --prod
```

---

### Step 5 — Deploy the Frontend

Before deploying, set the backend API URL in the frontend:

1. Open `frontend/assets/js/config.js`
2. Update the fallback URL to point to your backend:
   ```js
   // Change this line:
   window.API_BASE = (meta && meta.content) || window.__API_BASE__ || '';
   // To:
   window.API_BASE = (meta && meta.content) || window.__API_BASE__ || 'https://vcg-backend.vercel.app';
   ```

Then deploy:

```bash
cd frontend
vercel
```

Follow the prompts:
- **Project name?** → `vcg-frontend`
- **Which directory?** → `./` (current — the `frontend/` folder)

Note the **frontend production URL**, e.g. `https://vcg-frontend.vercel.app`

---

### Step 6 — Link Frontend URL to Backend CORS

1. Go to Vercel dashboard → `vcg-backend` → **Settings** → **Environment Variables**
2. Update `ALLOWED_ORIGIN` to your frontend URL:
   ```
   https://vcg-frontend.vercel.app
   ```
3. Redeploy the backend:
   ```bash
   cd backend
   vercel --prod
   ```

---

## ✅ Final Checklist

- [ ] Frontend loads at your Vercel URL
- [ ] Job listings load on `/jobs.html`
- [ ] Admin panel works at `/admin.html`
- [ ] Admin changes (jobs, content) persist after page refresh

---

## 🔒 Security Checklist Before Going Live

- [ ] Change `ADMIN_PASSWORD` to something strong (12+ chars)
- [ ] Set `JWT_SECRET` to a long random string (64+ chars)
- [ ] Set `NODE_ENV=production` in Vercel env vars
- [ ] Set `ALLOWED_ORIGIN` to your exact frontend domain
- [ ] Enable **2-Factor Authentication** on your Vercel and GitHub accounts

---

## 🛠 Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your local values
npm install
npm run dev   # Starts on http://localhost:3500

# Frontend
# Open frontend/index.html directly in a browser, OR
# Use a simple static server:
npx serve frontend
```

> Without KV env vars set, the backend uses an **in-memory store** (data resets on restart). This is fine for local development.

---

## 🏡 About

Valley Care Group provides compassionate nursing and residential care across South Wales.
- **Glan-yr-Afon Nursing Home** — Blackwood, Caerphilly
- **Llys Gwyn Residential Home** — Wales
- **Pentwyn Nursing Home** — Cardiff (Opening 2025)

📞 01633 680217 | ✉️ care@valleycare.wales
