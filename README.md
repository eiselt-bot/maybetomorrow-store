# MaybeTomorrow.store

Multi-tenant e-commerce platform for Kenyan micro-entrepreneurs. Each tenant
gets their own subdomain (`shoezaa.maybetomorrow.store`,
`bakery.maybetomorrow.store`, ...) with storefront, checkout, WhatsApp
click-to-chat, and KES-denominated pricing that auto-converts to USD / EUR /
CHF for international buyers. Full concept document: see
[`CONCEPT.md`](./CONCEPT.md).

## Tech stack

- **Framework:** Next.js 16 (App Router, RSC, Server Actions, standalone output)
- **Runtime:** Node.js 22
- **UI:** React 19, Tailwind CSS v4, lucide-react icons
- **Database:** PostgreSQL 16 (Docker) via Drizzle ORM + `postgres.js` driver
- **Auth:** NextAuth v5 (beta) with credentials provider
- **AI:** Anthropic Claude (via `@anthropic-ai/sdk`)
- **Process manager:** PM2 (`mt-store` app on port 3003)
- **Reverse proxy:** Nginx with Let's Encrypt wildcard cert
- **Deployment target:** IONOS VPS `mahelya` (87.106.127.232)

## Quickstart (local development)

```bash
# 1. Install dependencies.
npm install

# 2. Copy the env template and fill in secrets.
cp .env.example .env
# Regenerate NEXTAUTH_SECRET / AUTH_SECRET: openssl rand -hex 32
# Set ANTHROPIC_API_KEY if you want AI features to work locally.

# 3. Make sure Postgres is reachable (DATABASE_URL in .env).
#    On mahelya this is the existing Docker Postgres on :5432.
#    Locally, spin up your own or point at a dev DB.

# 4. Push the Drizzle schema.
npm run db:push

# 5. (Optional) seed demo tenants, products, and currency rates.
npm run db:seed

# 6. Run the dev server on port 3003.
npm run dev
```

Open <http://localhost:3003> to see the marketing site. For subdomain testing,
see [`deploy/README.md` section 10](./deploy/README.md#10-local-subdomain-testing-developer-machines).

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server on port 3003 (Turbopack in Next 16). |
| `npm run build` | Production build (standalone output). |
| `npm run start` | Start the built bundle on port 3003. |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting. |
| `npm run db:generate` | Generate Drizzle migrations from `src/lib/db/schema.ts`. |
| `npm run db:push` | Push the schema directly to the DB (dev-friendly, no migration files). |
| `npm run db:studio` | Open Drizzle Studio to inspect the DB. |
| `npm run db:seed` | Run `src/lib/db/seed.ts` to populate demo data. |
| `npm run currency:fetch` | Run `scripts/currency-cron.ts` — used by the daily cron. |

## Project layout

```
maybetomorrow-store/
├── src/
│   ├── app/              # Next.js App Router pages + route handlers
│   └── lib/
│       └── db/
│           ├── client.ts # Drizzle client (exports `db` and `schema`)
│           ├── schema.ts # Full Drizzle schema
│           └── seed.ts   # Demo data seeder
├── scripts/
│   ├── currency-cron.ts  # Daily KES -> USD/EUR/CHF rate refresh
│   ├── deploy.sh         # Idempotent build + pm2 reload
│   └── setup-mahelya.sh  # First-time server setup reference
├── deploy/
│   ├── nginx-maybetomorrow.conf  # Nginx vhost (wildcard TLS)
│   └── README.md                 # Full production deployment guide
├── drizzle/              # Generated migration files
├── public/               # Static assets
├── ecosystem.config.js   # PM2 app definition (port 3003)
├── next.config.ts        # Next.js config (standalone, image domains)
├── CONCEPT.md            # Full product concept
└── README.md             # You are here.
```

## Production deployment

See [`deploy/README.md`](./deploy/README.md) for the complete walk-through:
domain registration, DNS, wildcard TLS via `certbot-dns-ionos`, Nginx vhost
install, PM2 startup, uploads directory, and the daily currency cron.

Short version for an already-provisioned mahelya:

```bash
cd /home/claude-admin/maybetomorrow-store
git pull
./scripts/deploy.sh
```

## License

Proprietary — all rights reserved. (Placeholder — update when a license is
chosen.)
