# FMAC — Film Making Club, BITS Goa

Cinematic website for the Film Making Club at BITS Pilani, K.K. Birla Goa Campus.
Films are hosted on [YouTube](https://www.youtube.com/c/FilmmakingClubBITSGoa) and embedded on-site.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind + Framer Motion
- **PostgreSQL** + **Prisma**
- **JWT auth** (jose) + bcrypt — admin dashboard for CRUD
- **YouTube-only video** — `youtubeId` / `youtubeUrl` in DB, auto thumbnails

## Quick start

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000 · Admin: http://localhost:3000/admin/login

**Seed credentials:** `admin@fmac.club` / `changeme123` (override via `.env`)

## Sync YouTube catalogue

Films are synced from the [FMAC YouTube channel](https://www.youtube.com/c/FilmmakingClubBITSGoa) into Postgres — the site reads from the DB, not the YouTube API on every page load.

```bash
# Add to .env:
# YOUTUBE_API_KEY=...          # recommended (YouTube Data API v3)
# YOUTUBE_CHANNEL_ID=UCFVx9GpUrQ7FFWLiJ63mF9A

npx prisma migrate deploy
npm run sync:youtube           # full upsert from channel
npm run test:tenure            # verify tenure grouping
```

Without `YOUTUBE_API_KEY`, sync falls back to **yt-dlp** (full metadata including publish dates).

Tenures are grouped by **Aaja** orientation films: each tenure starts when that year's Aaja is published and ends when the next Aaja releases.

## Refresh YouTube catalog (legacy flat dump)

```bash
npm run fetch:youtube   # requires yt-dlp — flat playlist only
npm run sync:youtube    # preferred: full sync with dates
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Letterboxed hero, manifesto |
| `/library` | Tenure-organised film catalogue (YouTube embeds) |
| `/library/[slug]` | Single film with embedded player |
| `/achievements` | Festival laurels |
| `/location-map` | Venue + map |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Movie CRUD |

## API

- `GET /api/movies` — list (optional `?category=SHORT`)
- `GET /api/movies/latest` — hero film
- `GET /api/movies/[id]` — detail
- `POST|PUT|DELETE /api/movies` — admin only
- `GET /api/achievements` — laurels
- `POST /api/auth/login` — rate-limited login
- `POST /api/upload` — admin poster upload → `/public/uploads/posters`

## Design notes

- **Reference A (Home):** yellow-on-black duotone, distressed display type, `RedactedTextBlock`, checker corners, grain
- **Reference B (Movies/Admin):** rounded poster cards, FMAC Select badges, pill filters, warm grid glow
- **ProjectorBeam:** mouse parallax on desktop, device orientation on mobile (iOS permission prompt)
- Respects `prefers-reduced-motion` throughout
