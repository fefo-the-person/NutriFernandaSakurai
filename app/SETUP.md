# Setup – Nutri Fernanda Sakurai App

## Estimated time: ~30 minutes

---

> **Already ran schema.sql before?** Run `supabase/schema_channel_migration.sql` in the SQL Editor to add the channel column to consultations.

## Step 1 – Create the Supabase project (free)

1. Go to https://supabase.com and sign up (free)
2. Click **New project** → give it a name like `nutri-fernanda`
3. Once it loads, go to **SQL Editor** in the left sidebar
4. Open the file `supabase/schema.sql` and paste its entire contents into the editor → click **Run**
5. Go to **Project Settings → API** and copy:
   - **Project URL** → looks like `https://xxxx.supabase.co`
   - **anon public key** → long string starting with `eyJ`

---

## Step 2 – Configure the app

1. In the `app/` folder, copy `.env.example` to `.env.local`:
   ```
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

---

## Step 3 – Import historical data

This loads all existing consultation and expense history from the Excel file.

```bash
cd app/scripts
pip install pandas openpyxl supabase

# Get the SERVICE key from Supabase → Settings → API → service_role key
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_SERVICE_KEY=eyJ...

python import_data.py
```

---

## Step 4 – Run locally to test

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000 in your browser. Everything should work.

---

## Step 5 – Deploy to Vercel (free hosting)

1. Go to https://vercel.com and sign up with GitHub
2. Push the `app/` folder to a GitHub repository
3. In Vercel, click **New Project** → import your repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** — Vercel gives you a public URL like `nutri-fernanda.vercel.app`

---

## Step 6 – Install on Fernanda's iPad

1. Open the app URL in **Safari** on the iPad
2. Tap the **Share** button (box with arrow pointing up)
3. Tap **"Add to Home Screen"**
4. Give it a name and tap **Add**

The app now appears on the home screen like a native app — full screen, no browser chrome.

---

## Folder structure

```
app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard (Hoje)
│   │   ├── pacientes/            # Patient list + detail + new patient
│   │   ├── nova-consulta/        # Register consultation form
│   │   ├── financeiro/           # Monthly financial view
│   │   └── alertas/              # At-risk patient alerts
│   ├── components/
│   │   ├── BottomNav.tsx         # iPad-friendly bottom navigation
│   │   └── StatusBadge.tsx       # Ativo / Em risco / Inativo badge
│   └── lib/
│       ├── supabase.ts           # Database client
│       └── types.ts              # Shared types + formatting helpers
├── supabase/
│   └── schema.sql                # Database tables + views
└── scripts/
    └── import_data.py            # One-time Excel import
```

---

## Adding security (optional, recommended after launch)

By default the database is open to anyone with the URL. Once you confirm everything works:

1. Go to Supabase → **Authentication → Providers → Email** → enable it
2. In **SQL Editor**, uncomment the Row Level Security lines at the bottom of `schema.sql` and run them
3. Add a login page to the app (simple email + password)

This ensures only Fernanda can access the data.
