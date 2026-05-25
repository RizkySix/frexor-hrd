# VAK Working Style Test — Frexor

Internal HRD tool untuk mengirim tes gaya belajar **Visual / Auditory / Kinesthetic** ke kandidat dan melihat hasilnya di dashboard.

## Stack

- **Next.js 14** (App Router)
- **Prisma** + **PostgreSQL** (Neon free tier untuk dev, Neon/Vercel Postgres untuk prod)
- **NextAuth.js v4** (credentials provider)
- **Tailwind CSS**

> Catatan: Prisma tidak mendukung `env()` pada field `provider`. App ini memakai PostgreSQL untuk dev maupun prod (gunakan Neon dev branch agar gratis dan instan). Jika benar-benar butuh SQLite lokal, ganti `provider = "postgresql"` di [`prisma/schema.prisma`](prisma/schema.prisma) menjadi `"sqlite"` dan hapus folder `prisma/migrations/` sebelum `prisma migrate dev`.

## Alur Aplikasi

1. **HRD login** di `/login` → dashboard `/dashboard`
2. **Buat link** untuk kandidat → dapatkan URL `/tes/<token>` (kadaluarsa 7 hari)
3. **Kandidat** buka link → isi 30 soal → submit
4. **HRD** lihat hasil skor V/A/K dan dominant style di detail kandidat

## Akun HRD Default

| Email              | Password      |
| ------------------ | ------------- |
| `hrd@company.com`  | `password123` |

> Ganti password setelah login pertama di production.

## Setup Lokal

```bash
# 1. Install deps
npm install

# 2. Buat database PostgreSQL
#    Gratis & instan: https://neon.tech → New Project → copy connection string

# 3. Set env vars
cp .env.example .env
# Edit .env:
#   DATABASE_URL="postgresql://...?sslmode=require"
#   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
#   NEXTAUTH_URL="http://localhost:3000"

# 4. Run migrations + seed HRD default
npx prisma migrate dev --name init
npm run seed

# 5. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur Folder

```
app/
  api/
    auth/[...nextauth]/route.ts
    kandidat/route.ts                 POST  buat kandidat + link
    tes/[token]/route.ts              GET   validasi & data kandidat
    tes/[token]/submit/route.ts       POST  simpan jawaban + hitung skor
    dashboard/route.ts                GET   list kandidat milik HRD login
  login/page.tsx
  dashboard/
    page.tsx                          tabel kandidat + tombol "Buat Link Baru"
    kandidat/[id]/page.tsx            detail hasil per kandidat
  tes/[token]/
    page.tsx                          form 30 soal
    selesai/page.tsx                  halaman terima kasih + hasil VAK
lib/
  prisma.ts        singleton Prisma client
  auth.ts          NextAuth options
  scoring-key.ts   VAK mapping + calculateVAK()
  questions.ts     30 pertanyaan
components/
  QuestionCard.tsx
  VAKChart.tsx
  CandidateTable.tsx
  CreateCandidateModal.tsx
prisma/
  schema.prisma
  seed.ts
middleware.ts      proteksi /dashboard/*
```

## Deploy ke Vercel

### Prerequisites
- Akun [Vercel](https://vercel.com)
- Akun [Neon](https://neon.tech) untuk PostgreSQL gratis — atau pakai Vercel Postgres dari dashboard Vercel

### Langkah-langkah

1. **Buat database PostgreSQL**
   - Buka [neon.tech](https://neon.tech) → New Project → copy connection string
   - Format: `postgresql://user:pass@host/dbname?sslmode=require`

2. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/username/vak-test.git
   git push -u origin main
   ```

3. **Import ke Vercel**
   - Buka [vercel.com](https://vercel.com) → **Add New Project** → import dari GitHub
   - Framework: Next.js (auto-detected)

4. **Set Environment Variables** di Vercel dashboard
   | Key                | Value                                        |
   | ------------------ | -------------------------------------------- |
   | `DATABASE_URL`     | `postgresql://...?sslmode=require` (dari Neon) |
   | `NEXTAUTH_SECRET`  | hasil `openssl rand -base64 32`              |
   | `NEXTAUTH_URL`     | `https://nama-project.vercel.app`            |

5. **Deploy** → build script otomatis menjalankan `prisma migrate deploy`.

6. **Seed database production** (sekali saja setelah deploy pertama)
   ```bash
   vercel env pull .env.production.local
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

### Catatan Penting

- `prisma migrate deploy` sudah masuk ke `build` script di `package.json`, jadi setiap deploy akan auto-apply migration baru.
- `vercel.json` set framework Next.js + build command yang sama.
- Pastikan folder `prisma/migrations/` ter-commit ke git (Vercel butuh saat deploy).
- Setelah login pertama, **ganti password HRD default** lewat database/Prisma Studio (`npx prisma studio`).

## Scoring VAK

Setiap dari 30 soal punya mapping A/B/C → V/A/K di [`lib/scoring-key.ts`](lib/scoring-key.ts). Dominant style = label dengan skor tertinggi (tie-break urutan: V → A → K).

> Mapping di file ini adalah estimasi berdasarkan konteks tiap soal. Sesuaikan dengan kunci resmi Frexor jika tersedia.
