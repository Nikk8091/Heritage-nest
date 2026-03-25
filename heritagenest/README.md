# 🪔 HeritageNest — Regional Folk Art Digital Archive

A community-driven digital archive to preserve and promote India's intangible cultural heritage.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
The `.env.local` file is already included with your keys. No changes needed.

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Firebase Setup (One-time)

### Enable Firestore
1. Go to [Firebase Console](https://console.firebase.google.com) → your project `heritagenest-24c05`
2. Click **Firestore Database** → **Create database**
3. Choose **Start in production mode** → select a region → Done

### Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** → add your support email → Save

### Deploy Firestore Rules & Indexes
```bash
npm install -g firebase-tools
firebase login
firebase use heritagenest-24c05
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📦 Supabase Setup

Your bucket `folk-art-media` should already be created and public.

If not:
1. Go to [supabase.com](https://supabase.com) → your project
2. **Storage** → **New bucket** → Name: `folk-art-media` → Toggle **Public** → Create
3. Go to **Storage** → **Policies** → Add policy:
   - For uploads: `INSERT` for `authenticated` role
   - For reads: `SELECT` for `public` role

---

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add these Environment Variables in Vercel Dashboard:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
AI_PROVIDER
GROQ_API_KEY
GROQ_MODEL
```

4. Click **Deploy** ✅

---

## 🤖 AI Artifact Explanation

Users can open an artifact page and click **Explain with AI** to get:

- Summary
- Historical context
- Cultural significance
- Learning points
- Further exploration ideas

Set these variables in `.env.local` and deployment env settings:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Optional API hardening
AI_RATE_LIMIT_MAX=20
AI_RATE_LIMIT_WINDOW_MS=60000
AI_CACHE_TTL_MS=21600000
```

Notes:

- `AI_PROVIDER=groq` is used for HeriNest AI.
- AI explanations are cached in-memory on the server process for faster repeat responses.

The AI request is handled server-side through `/api/artifact-explain` so keys are not exposed in the client.

---

## 📁 Project Structure

```
heritagenest/
├── app/
│   ├── layout.jsx              ← Root layout (Navbar + Footer + AuthProvider)
│   ├── page.jsx                ← Home page (hero, search, filters, gallery)
│   ├── page.module.css
│   ├── auth/login/
│   │   ├── page.jsx            ← Login + Signup (email & Google)
│   │   └── auth.module.css
│   ├── upload/
│   │   ├── page.jsx            ← Upload form (drag & drop, progress)
│   │   └── upload.module.css
│   ├── item/[id]/
│   │   ├── page.jsx            ← Item detail (media, info, bookmark, related)
│   │   └── item.module.css
│   ├── dashboard/
│   │   ├── page.jsx            ← User dashboard (uploads, bookmarks, stats)
│   │   └── dashboard.module.css
│   ├── categories/
│   │   ├── page.jsx            ← Browse by category with sidebar filters
│   │   └── categories.module.css
│   ├── profile/
│   │   ├── page.jsx            ← User profile page
│   │   └── profile.module.css
│   └── about/
│       ├── page.jsx            ← About page
│       └── about.module.css
│
├── components/
│   ├── Navbar.jsx + Navbar.module.css
│   ├── Footer.jsx + Footer.module.css
│   └── ArtCard.jsx + ArtCard.module.css
│
├── context/
│   └── AuthContext.jsx         ← Firebase auth state + userDoc
│
├── lib/
│   ├── firebase.js             ← Firebase app init
│   ├── supabase.js             ← Supabase client
│   ├── authService.js          ← Auth functions
│   ├── storageService.js       ← Supabase file upload/delete
│   ├── dbService.js            ← All Firestore CRUD
│   └── constants.js            ← States, categories, art forms lists
│
├── styles/
│   └── globals.css             ← CSS variables + utility classes
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── next.config.js
└── .env.local
```

## 🎨 Firestore Schema

```
artItems/{id}
  title:        string
  description:  string
  state:        string
  district:     string
  art_form:     string
  community:    string
  category:     string
  media_url:    string       ← Supabase public URL
  media_type:   "image" | "video"
  tags:         string[]
  user_id:      string       ← Firebase UID
  created_at:   timestamp
  views:        number

users/{uid}
  uid:          string
  email:        string
  displayName:  string
  photoURL:     string | null
  saved:        string[]     ← bookmarked artItem IDs
  created_at:   timestamp
```
