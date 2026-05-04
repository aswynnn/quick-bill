# Invoice Studio — Next.js + Supabase

A full-stack invoice management app with client dashboard, persistent business profile, and PDF export.

---

## 🚀 Setup in 4 steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor** → paste the contents of `supabase-schema.sql` → **Run**
3. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon` public key

### 3. Configure environment variables

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard.

---

## 📁 Project Structure

```
invoice-studio/
├── app/
│   ├── api/
│   │   ├── profile/route.ts        ← GET & POST profile
│   │   ├── clients/
│   │   │   ├── route.ts            ← GET all, POST new client
│   │   │   └── [id]/route.ts       ← PATCH, DELETE client
│   │   └── invoices/
│   │       ├── route.ts            ← GET all, POST new invoice
│   │       └── [id]/route.ts       ← PATCH, DELETE invoice
│   ├── dashboard/page.tsx          ← Main dashboard
│   ├── profile/page.tsx            ← Business profile settings
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── modals/
│   │   ├── ClientModal.tsx         ← Add/edit client modal
│   │   └── InvoiceModal.tsx        ← Create/edit invoice modal
│   └── ui/
│       └── Toast.tsx
├── lib/
│   ├── supabase.ts                 ← Supabase client + logo upload
│   └── pdf.ts                     ← jsPDF invoice generation
├── types/
│   └── database.ts                ← TypeScript types
├── supabase-schema.sql             ← Run this in Supabase SQL Editor
└── .env.local                      ← Add your Supabase keys here
```

---

## 🗄️ Database Tables

| Table      | Description                              |
|------------|------------------------------------------|
| `profile`  | Your business info (one row)             |
| `clients`  | All your clients                         |
| `invoices` | All invoices, linked to clients via FK   |

---

## ✨ Features

- **Business Profile** — fill once, autofills every invoice
- **Logo upload** — stored in Supabase Storage
- **Client dashboard** — color-coded cards, click to filter invoices
- **Invoice management** — create, edit, delete, mark paid/pending
- **PDF export** — clean A4 PDF matching your reference layout
- **GST support** — SGST, CGST, Cess per invoice
- **Status tracking** — Draft / Pending / Paid with filter bar
- **Search** — search by invoice number or client name

---

## 🔐 Adding Auth (optional)

The app works without auth (single-user). To add Supabase Auth:

1. Enable **Email Auth** in Supabase → Authentication
2. Wrap `app/layout.tsx` with a session provider from `@supabase/ssr`
3. Add `auth.uid()` checks to your RLS policies in `supabase-schema.sql`
