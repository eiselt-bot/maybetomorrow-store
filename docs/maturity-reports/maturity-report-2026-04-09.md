# Maturity Report — maybetomorrow-store

> Erstellt: 2026-04-09 | Analysiert von: A6 Mature v0.1 (PHIbel skill, remote-target mode)
> Scope: Full 11-dimension audit. PHIbel-specific helpers (consistency-check, sidebar-validator, save-maturity-score DB) wurden übersprungen da sie für mt-store nicht gelten.

## Projekt-Übersicht

| | |
|---|---|
| **Stack** | Next.js 16.2.3 (Turbopack, standalone) + React 19 + TypeScript strict + Drizzle ORM + Postgres 16 + NextAuth v5 beta + Tailwind v4 + Anthropic SDK |
| **Files** | 63 .ts/.tsx in 20 directories |
| **LOC (core)** | 2286 lines (actions + services + schema + middleware) |
| **Dependencies** | 26 total (15 prod + 11 dev) |
| **Tests** | 0 / 63 (0%) |
| **CI/CD** | None |
| **Docker** | None (Next.js standalone output) |
| **Linting** | None (no ESLint, no Prettier) |
| **DB tables** | 16 (users, shops, products, orders, order_items, shop_mockups, ai_generations, incident_cards, newsletter_optins, card_scans, cross_sell_impressions, payouts, delivery_fees, audit_log, drivers, currency_rates) |
| **Error handling** | 21 try + 24 catch + 8 console.error |
| **Auth guards** | 24 requireAdmin/auth() calls across 14 admin routes |
| **Zod schemas** | 16 validation sites |
| **Raw SQL** | 0 (Drizzle-only, no injection risk) |
| **DB transactions** | 0 (compensating-delete pattern) |

## Maturity Score

```
1. Architektur / SoC         [███████░░░]  7/10
2. Error Handling            [██████░░░░]  6/10
3. Security                  [█████░░░░░]  5/10
4. Testing & CI/CD           [██░░░░░░░░]  2/10
5. Performance               [██████░░░░]  6/10
6. Code Quality & DX         [██████░░░░]  6/10
7. Data Model                [███████░░░]  7/10
8. Deployment & Ops          [█████░░░░░]  5/10
--- Consistency & Integrity ---
9. Frontend Consistency      [███████░░░]  7/10
10. Backend Integrity        [███████░░░]  7/10
11. Cross-System Consistency [███████░░░]  7/10
──────────────────────────────────
Gesamt-Score:  5.9 / 10
Reifegrad:     MVP (kurz vor Production)
Ziel:          Production (7.0+)
Gap:           1.1 Punkte
```

## Detailanalyse

### 1. Architektur / SoC — 7/10
**Stark:** Saubere 4-Schichten-Struktur actions → services → schema → components. Layout-Registry-Pattern für die 5 Shop-Varianten. Home-Komponenten sauber exportiert für cross-route-Nutzung. Middleware single-responsibility.

**Gap:** `src/app/actions/shop-admin.ts` ist auf 882 LOC angewachsen und mischt Product, Shop, Brand-Values, Template, Mockups, Payouts, Delivery Fees und Shop-Creation. Sollte in Domain-Files gesplittet werden.

### 2. Error Handling — 6/10
**Stark:** Server Actions nutzen durchgehend redirect-with-?error= Pattern mit Prefill-Query-Params. Order-Service hat compensating delete für atomicity. Zod safeParse auf allen Form-Inputs.

**Gap:** Kein globaler Error Boundary in app/layout.tsx. Keine typed Error-Klassen. Nur console.error, kein strukturiertes Logging. Keine Timeouts auf externe Calls. Kein error.tsx in den Route-Segments.

### 3. Security — 5/10
**Stark:** Drizzle ORM (kein Raw SQL). Let's Encrypt SSL. bcrypt für Password. NextAuth v5 CSRF. /api/upload auth + MIME + size cap.

**Gap:**
- Admin-Password: 4 Zeichen (brute-force trivial)
- Kein Rate-Limiting (auth callback, upload, actions)
- Keine Security Headers (CSP, HSTS, X-Frame-Options)
- Kein Audit-Log aktiviert trotz existierender Tabelle
- .env mit Plaintext secrets
- NextAuth v5 ist beta (nicht GA)

### 4. Testing & CI/CD — 2/10
Nur typecheck script. Keine Tests, kein CI, kein Linting, kein Playwright. Hard floor.

### 5. Performance — 6/10
**Stark:** Standalone bundle. React cache() dedupe. In-process delivery-fees cache. DB indexes auf hot columns. Nginx /uploads/ mit 7d cache.

**Gap:** Uploaded images via plain <img> (keine Next-Image-Optimization). Cart client-hydration via extra API roundtrip. Kein Pool-Tuning. Single PM2 instance.

### 6. Code Quality — 6/10
**Stark:** TS strict, konsistente Naming, gute Kommentare an non-obvious Stellen, Drizzle types flow sauber durch.

**Gap:** Kein ESLint/Prettier/Husky. shop-admin.ts zu groß. Kein noUncheckedIndexedAccess. Keine ADRs.

### 7. Data Model — 7/10
**Stark:** 16 Tables, FK enforced, Cascade-Deletes, JSONB für strukturierte Felder, Postgres Enums, gute Indexes, Seed-Script.

**Gap:** Kein db.transaction() (compensating delete stattdessen). Migrations via docker exec SQL (nicht drizzle-kit). variant_selection als loose TEXT. Kein pg_dump cron.

### 8. Deployment & Ops — 5/10
**Stark:** PM2 ecosystem config. Nginx + SSL + HTTP→HTTPS + /uploads/ location. Certbot timer renewal. GitHub via push-remote-commits helper.

**Gap:** Kein Healthcheck endpoint. Kein strukturiertes Logging. Kein Backup-Cron. Kein APM. Kein Alerting. Single-Server-SPOF. Kein Rollback-Playbook. .env Plaintext secrets.

### 9. Frontend Consistency — 7/10
**Stark:** 5 Shop-Layouts mit identischer Struktur (header/hero/main/footer), CSS-Variable-driven tokens, shared Button/PriceDisplay/Badge/PhotoUpload/CartIcon/AddToCartButton. Admin eigenes cohesive design. CartIcon auf allen 5 layouts.

**Gap:** Kein Design-System-Doc/Storybook. Mix <img> + next/image. Tailwind duplication. Admin sidebar inline SVGs statt lucide-react.

### 10. Backend Integrity — 7/10
**Stark:** Strikte Route→Action→Service→DB Layering. requireAdmin() auf jedem admin action (24 guards). Zod validation auf allen Form-Inputs. Keine circular imports. Middleware single responsibility.

**Gap:** Kein konsistentes API-Response-Shape. shop-admin.ts zu groß. dbSchema aliasing hack in order-actions.

### 11. Cross-System Consistency — 7/10
**Stark:** TypeScript + Drizzle → automatic type flow. Postgres Enums spiegeln sich in TS-Unions. Keine Orphan-Refs. Cart client struct matches server CartLine. project_mahelya_maybetomorrow-store.md dokumentiert Architektur.

**Gap:** Keine OpenAPI spec. Keine Contract-Tests. Dokumentations-Drift-Risiko. Nur Compile-Time-Checks, kein Runtime-Contract-Validation.

## Transformationsplan

### Phase 1 — Foundation (Woche 1)

Security + Ops + kleine Tooling-Fixes:

1. **Admin-Passwort rotieren** → stark (≥16 chars, bcrypt 12 rounds) — 30min
2. **Rate-Limiter** + **Security Headers** (CSP, HSTS, X-Frame-Options) — 1 Tag
3. **Audit-Log aktivieren** für admin mutations — 3h
4. **Healthcheck Endpoint** (/api/health) + **Backup Cron** (pg_dump 03:00, 14d retention) + **Watchdog** (analog PHIbel) — 1 Tag
5. **ESLint + Prettier + Husky + noUncheckedIndexedAccess** — 2h
6. **Error Boundaries** (global + admin + shop) + **typed errors** — 3h
7. **db.transaction()** für createOrder + createOrderFromCart — 2h

**Score-Impact:** +1.4 (5.9 → 7.3)

### Phase 2 — Tests & Tooling (Woche 2)

Erst jetzt Testing angehen, weil Phase 1 die stabile Basis liefert gegen die tests laufen:

1. **Vitest + Service-Layer unit tests** (order-service computeLine, generateOrderNumber, createOrder, createOrderFromCart, mockup-generator Zod validation) — 2 Tage
2. **Playwright + 5 E2E smoke tests**: admin login / product create+photo / mockup generate+apply / cart checkout / order status transition — 2 Tage
3. **GitHub Actions CI** (typecheck + build + vitest + playwright on PR) — half day
4. **Split shop-admin.ts** in 5 domain files (products, shops, mockups, finance, brand-values) — half day

**Score-Impact:** +0.8 (7.3 → 8.1)

### Phase 3 — Hardening (Woche 3)

1. **next/image** für uploaded photos + bundle audit — 3h
2. **variant_selection JSONB migration** — 3h
3. **Design System doc** + lucide icons im admin — 3h
4. **Unified API response shape** `{ ok, data?, error? }` — 2h
5. **NextAuth v5 GA upgrade** (sobald released) — 1h

**Score-Impact:** +0.4 (8.1 → 8.5 PROFESSIONAL)

## Methodik

Dieses Audit basiert auf 11 Dimensionen mit je 1-10 Scoring.
Analysiert: ~15 von 63 Source-Files (Sampling + Grep-basiertes Pattern Scanning).

Key-Files gelesen:
- package.json, tsconfig.json, next.config.ts, middleware.ts
- src/lib/db/schema.ts, src/lib/services/order-service.ts, src/lib/services/mockup-generator.ts
- src/app/actions/shop-admin.ts (882 LOC), src/app/actions/order-actions.ts, src/app/actions/auth.ts
- src/app/api/upload/route.ts
- src/app/shop/[slug]/cart/page.tsx (+ CartPage client), src/app/shop/[slug]/checkout/page.tsx
- src/components/ui/BrandValuesEditor.tsx, PhotoUpload.tsx, CartIcon.tsx
- 5 layouts (EarthyArtisan, VibrantMarket, OceanCalm, HeritageStory, BoldMaker)

Pattern scans:
- try/catch density, auth guard placement, zod usage, raw SQL presence
- DB transaction usage (0 found → compensating delete documented in order-service:89)
- Security middleware (grep helmet|rate.?limit|CSP → 0 hits)
- CI/CD config search (.github/workflows → empty)
- Test file discovery (0 results)

Discovery via SSH to mahelya:~/maybetomorrow-store/. PHIbel-internal database + sidebar-validator tools NICHT verwendet weil diese auf PHIbel DB schemas schauen, nicht auf mahelya's maybetomorrow DB.
