# MaybeTomorrow.store — Implementation Progress

**Last updated:** 2026-04-09 12:25 UTC (live, autonomous autopilot session)
**Session status:** Active — main implementation + live deployment + mermaid fix DONE; DE regen pending in background
**Deployment target:** Mahelya server (87.106.127.232) — NOT PHIbel
**Concept on PHIbel:** `user_concepts` #106, user_id=5 (Frank), `status=in_progress`
**English HTML preview:** Generated and cached (30,619 bytes) at 2026-04-09 11:54:48 UTC

---

## Crash-Recovery — Quick Resume

If the current Claude Code session crashes or is interrupted:

1. **Read this file first** — complete state is here
2. **Concept doc:** `~/maybetomorrow-store/CONCEPT.md` on Mahelya; also `user_concepts` #106 on PHIbel
3. **Check subagent status:** Look at `/home/claude-admin/.claude/projects/-home-claude-admin/370cbbf7-ee2a-458c-ab40-b59d64c27723/subagents/agent-*.jsonl` for stop_reason
4. **Resume from "Next actions"** section below

## Verification Commands

```bash
# SSH works?
ssh mahelya "whoami && pwd"

# DB has 5 shops, 25 products, 5 discounted (one per shop)?
ssh mahelya "docker exec -i \$(docker ps --filter 'publish=5432' -q) psql -U claudeadmin -d maybetomorrow -c \"SELECT s.slug, s.layout_variant, (SELECT COUNT(*) FROM products WHERE shop_id=s.id) pc, (SELECT COUNT(*) FROM products WHERE shop_id=s.id AND discount_pct>0) dc FROM shops s ORDER BY s.id\""

# File tree check:
ssh mahelya "cd ~/maybetomorrow-store && find src -type f -name '*.ts*' | wc -l"

# Build works?
ssh mahelya "cd ~/maybetomorrow-store && npm run typecheck 2>&1 | tail -5"
ssh mahelya "cd ~/maybetomorrow-store && npm run build 2>&1 | tail -15"

# PM2 status:
ssh mahelya "pm2 list"

# Smoke test:
ssh mahelya "curl -s http://127.0.0.1:3003/ | head -c 500"
ssh mahelya "curl -s http://127.0.0.1:3003/shop/shoezaa | head -c 500"

# GitHub:
gh repo view eiselt-bot/maybetomorrow-store

# PHIbel concept #106:
cd ~/claude-platform && scripts/db-query.sh "SELECT id, user_id, title, status FROM user_concepts WHERE id=106"

# English HTML preview:
cd ~/claude-platform && scripts/db-query.sh "SELECT concept_id, language, LENGTH(html_content) FROM concept_html_previews WHERE concept_id=106"
```

---

## Locked-In Architecture Decisions

| Topic | Decision |
|---|---|
| Pilot size | B = 3–5 vendors |
| Legal owner | Claurice's registered Kenya business (Option A) |
| Payment MVP | Cash on Delivery (A), architecturally prepared for Stripe + M-Pesa (B) |
| Delivery zones | Diani Strip 300 / South Coast 600 / Mombasa 1200 KES / Further = WhatsApp quote |
| Bundle rule | Initial shop pays full delivery; cross-sell shops = full net (Piggyback pay-it-forward) |
| Vendor payout | Same-day M-Pesa after delivery confirmation (B2) |
| Trust/Incidents | Soft-launch + Yellow/Red card for vendors AND drivers |
| International | Kenya only MVP; rest = WhatsApp quote (B) |
| Admin | Single admin = Claurice (A); Frank silent tech partner |
| Tech stack | Sibling Next.js 16 + Drizzle + NextAuth v5 beta + postgres.js |
| AI generation | Theming + 5 Layout Picks + Sonnet 4.6 (B) |
| Business cards | Print-ready PDF + PNG preview (both) |
| Onboarding device | Separate tablet PWA (A2) |
| Vendor login MVP | NONE — Claurice Admin-Proxy (B3); Phase 2 = WhatsApp Magic Link |
| WhatsApp channel | Private WhatsApp Click-to-Chat via `wa.me` links (C2) |
| KPI focus | Discovery funnel (A1) |
| Shop directory sort | Random shuffle per visit (B1) |
| MVP Scope | Sharp — no reviews, affiliate, marketing tools |
| **Deployment** | **Mahelya (NOT PHIbel)**, sibling architecture |
| **Port** | **3003** |
| **Database** | New DB `maybetomorrow` on Mahelya Docker Postgres |
| **Mahelya sibling** | `mahelya.maybetomorrow.store` → `127.0.0.1:3000` (existing platform). Clean subdomain, no /mahelya path redirect. |
| **Concept location** | PHIbel user_concepts #106, user_id=5 (Frank) |
| A2 skill used | Hollywood Facades active for the 5 mockup shops + landing + admin |

---

## Completed Phases

### ✅ Phase 0 — Brainstorming + Design (10 clarifying Qs)

### ✅ Phase 1 — Concept Documentation
- `/tmp/maybetomorrow-concept.md` (local) + `~/maybetomorrow-store/CONCEPT.md` (Mahelya)
- PHIbel user_concepts #106, user_id=5 (**fixed from initial user_id=1**)
- English HTML preview generated: 30,619 bytes, cached in concept_html_previews

### ✅ Phase 2 — Environment Bootstrap
- GitHub repo: https://github.com/eiselt-bot/maybetomorrow-store ✓
- Mahelya verified: Node 22, Docker Postgres, PM2 backend+dashboard, port 3003 free
- `~/maybetomorrow-store/` on Mahelya, git init, remote added
- DB `maybetomorrow` created in Docker Postgres
- Credentials: `postgres://claudeadmin:Zukunft.2323@localhost:5432/maybetomorrow`

### ✅ Phase 3 — Next.js 16 Scaffold
- Next.js 16.2.3, React 19.2.4, Tailwind 4, TypeScript strict
- Dependencies installed (drizzle, next-auth beta, anthropic sdk, zod, bcryptjs, cva, lucide, date-fns, qrcode, tsx, dotenv)
- `.env` with DB URL, NextAuth secrets, placeholders

### ✅ Phase 4 — Database Layer
- `src/lib/db/schema.ts` (14 tables, 10 enums, relations, types)
- `src/lib/db/client.ts`
- `drizzle.config.ts`
- Migration `drizzle/0000_init.sql` generated and applied via psql
- **14 tables exist in `maybetomorrow`** (verified)
- `package.json` scripts: dev (3003), build, start, typecheck, db:push, db:seed, currency:fetch

### ✅ Phase 5 — SA1 Seed Script (5 shops + products)
- `src/lib/db/seed.ts` (566 lines)
- **5 shops seeded:**
  - shoezaa (earthy-artisan) — John Mwangi — leather sandals
  - mzizi (heritage-story) — Musa Mwakio — wood carvings
  - pwani-beads (vibrant-market) — Neema Leparmarai — Maasai beadwork
  - kanga-dreams (ocean-calm) — Asha Juma — kanga textiles
  - coco-grove (bold-maker) — Ali Kombo — coconut crafts
- **Each shop: 5 products, exactly 1 discounted** (verified via DB query)
- Admin user Claurice seeded (phone +254700000001, password `mt2026demo`)
- Driver Hassan seeded
- Currency rates today seeded

### ✅ Phase 6 — SA2 UI Layers (Hollywood Facades)
- `src/lib/currency.ts`, `src/lib/cn.ts`, `src/lib/layout-registry.ts`
- `src/components/ui/` (Button, Card, Badge, PriceDisplay)
- **5 layout variants** (200–220 lines each):
  - EarthyArtisan — Aesop-like boutique, Fraunces + Inter, warm cream bg
  - VibrantMarket — dense grid, Space Grotesk + Work Sans, color blocks
  - OceanCalm — polaroid frames, Cormorant + DM Sans
  - HeritageStory — full-width photos, Playfair + Inter, pullquotes
  - BoldMaker — brutalist, Outfit + DM Mono, hard edges
- `src/app/shop/[slug]/` pages (layout, page, about, product/[id], checkout)
- `src/app/shop/[slug]/_loaders.ts` with React `cache()` for dedup
- TypeScript strict: passes typecheck clean

### ✅ Phase 7 — SA3 Landing + Admin + Auth + Middleware
- `src/middleware.ts` (55 lines, subdomain routing, mahelya added to RESERVED)
- `src/lib/auth.ts` (NextAuth v5 beta, Credentials provider, bcrypt)
- `src/app/layout.tsx`, `src/app/page.tsx` (316 lines — landing with shop directory), `src/app/not-found.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/admin/` (layout, login, dashboard, shops list, orders, incidents, payouts, onboard, kpi — all stubs or basic)
- `src/app/actions/auth.ts` (Server Action signInAction)
- `src/lib/env.ts`

### ✅ Phase 8 — SA4 DevOps
- `ecosystem.config.js` (PM2 `mt-store` on port 3003)
- `deploy/nginx-maybetomorrow.conf` (originally 190 lines, extended to 247 lines with **mahelya subdomain block**)
- `deploy/README.md` (IONOS DNS, certbot-dns-ionos, deployment steps)
- `scripts/currency-cron.ts`, `scripts/deploy.sh`, `scripts/setup-mahelya.sh`
- `next.config.ts` (Unsplash whitelist, standalone output, serverActions 10MB body limit)
- `README.md`, `.gitignore`, `.env.example`

### ✅ Phase 9 — Nginx Mahelya Sibling Routing
- Added to `deploy/nginx-maybetomorrow.conf`: server block for `mahelya.maybetomorrow.store` → `127.0.0.1:3000` (existing Mahelya platform)
- HTTP → HTTPS redirect, reuses wildcard cert, WebSocket support, own access logs
- Middleware `RESERVED` set extended with `mahelya`

---

## In Progress

### 🔄 SA5 — Admin Shop Management + Brand Values Edit
- Still running (stop=running, JSONL at 141KB)
- Building: `src/app/admin/shops/[id]/page.tsx` (shop edit with tabs), `src/app/admin/shops/[id]/brand-values/`, `.../template/`, `.../products/`, `src/app/actions/shop-admin.ts`

---

## Pending After SA5

### ✅ Phase 10 — A2 Anti-Slop Review (Completed)
EarthyArtisan verified clean (Aesop-style). OceanCalm has subtle ocean-to-white gradient background (acceptable — serves aesthetic, not kitschy). HeritageStory has hero photo overlay gradient (standard photo treatment, acceptable). VibrantMarket and BoldMaker have zero gradients. Overall: A2-compliant.

### ✅ Phase 11 — Build + PM2 + Smoke Test (Completed)
- `npm run typecheck` — 0 errors
- `npm run build` — 21 routes compiled in 4.6s
- PM2 `mt-store` started on port 3003 (PID 625501)
- Smoke: apex (200, 41KB), shop shoezaa (200, 14KB), admin/login (200, 12KB), admin (307 redirect)
- **Orphan trap:** killed orphan process on port 3000 via `fuser -k 3000/tcp`, then `pm2 restart dashboard`
- Both services healthy: mt-store (3003) + dashboard (3000)

### ✅ Phase 12 — Git Commit + Push (Completed)
Commit 209f797 pushed to `eiselt-bot/maybetomorrow-store` main branch. 40+ files, ~3000 lines of new code.

### ✅ Phase 13 — Nginx HTTP-only Site Live (Completed)
Temporary vhost `/etc/nginx/sites-enabled/maybetomorrow-http` with:
- `maybetomorrow.store` + wildcard → port 3003
- `mahelya.maybetomorrow.store` → port 3000 (existing Mahelya dashboard)
- No SSL yet (HTTP only)
- Nginx test passed + reloaded
- **Live verified:** apex, shoezaa subdomain, mahelya subdomain all serving correct content

### ✅ Phase 14 — Public Share Link + Telegram (Completed)
- Share token generated: `maybetomorrow-store-beach-vendor-e-comme-ab165c10fd27729d`
- Public URL tested locally + externally via phibel.app
- Telegram message sent to Frank (chat_id 599906669) with all live URLs

### ✅ Phase 15 — Mermaid Inline-SVG Fix in concept-html-service (Completed)
**Problem:** Public share showed Mermaid diagrams as raw flowchart code (cryptic), not as rendered graphics. Admin panel rendered them fine via client-side React/mermaid.js.

**Root cause:** AI-generated public HTML included `<div class="mermaid">` + `mermaid.min.js` CDN script, but client-side rendering was unreliable in public share context (CDN blocks, slow connections, or silent init failures).

**Fix:** Added `inlineMermaidDiagrams(html)` function in `/home/claude-admin/claude-platform/app/services/concept-html-service.js` that:
1. Finds all `<div class="mermaid">...</div>` blocks
2. Extracts the Mermaid source code
3. Calls `https://mermaid.ink/svg/{base64}` server-side to render to SVG
4. Inlines the SVG directly into the HTML (replacing the mermaid div)
5. Falls back to the original div if mermaid.ink fails (so client-side mermaid.js still kicks in)

Applied in `generateHtml()` before the DB cache write, so ALL future generations auto-inline Mermaid diagrams.

**Verified:** EN preview now 91,262 bytes (was 30,619) with 3 mermaid-rendered divs containing inline SVGs. External URL `https://phibel.app/concepts/public/{token}?lang=en` renders diagrams as real graphics in any browser without JS.

**Status:** Fix applied to PHIbel backend (PID 650870). NOT yet committed to git — needs Frank's review before commit.

### ⏳ Phase 16 — DE Regen Pending
DE regeneration running in background (still in flight). Expected to finish in ~30–60s with same inline-SVG treatment.
Quick review pass:
- [x] EarthyArtisan — peeked, clean (Aesop-style, Fraunces, cream bg, no gradients)
- [ ] VibrantMarket — not yet reviewed
- [ ] OceanCalm — not yet reviewed
- [ ] HeritageStory — not yet reviewed
- [ ] BoldMaker — not yet reviewed
- Check no Tailwind gradients, no generic fonts, no purple/pink clichés, no floating blobs

### Phase 11 — First Build + PM2 Start + Smoke Test
```bash
ssh mahelya "cd ~/maybetomorrow-store && npm run typecheck"
ssh mahelya "cd ~/maybetomorrow-store && npm run build"
ssh mahelya "cd ~/maybetomorrow-store && pm2 start ecosystem.config.js && pm2 save"
ssh mahelya "curl -s http://127.0.0.1:3003/ | head -c 1000"
ssh mahelya "curl -s http://127.0.0.1:3003/shop/shoezaa | head -c 500"
ssh mahelya "curl -s -I http://127.0.0.1:3003/admin/login"
```

### Phase 12 — Git Commit + Push
```bash
ssh mahelya "cd ~/maybetomorrow-store && git add -A && git commit -m 'feat: initial MVP scaffold — 5 facade shops + admin' && git push -u origin main"
```

### Phase 13 — A2 Skill Optimization
Apply lessons from this implementation back to `~/.claude/skills/a2-hollywood-facades/SKILL.md`:
- How to dispatch multiple subagents with non-overlapping scopes
- Anti-slop verification as an explicit step
- Multi-zoom is already documented but add a specific "layout variants for themable mockups" pattern

### Phase 14 — IONOS / SSL (Frank's actions)
- DNS records: ✅ already set by Frank (`A @ 87.106.127.232` + `A * 87.106.127.232`)
- Needed: IONOS DNS API key for Let's Encrypt DNS-01 challenge
- Then: certbot issues wildcard cert, nginx site enabled, live

---

## Known Gotchas

1. drizzle-kit push needs TTY — use `drizzle-kit generate` + psql direct apply
2. Postgres role 'postgres' does not exist on Mahelya — use `claudeadmin`
3. Dev subdomain handling — middleware treats localhost as apex; use `/shop/shoezaa` path in dev
4. Next.js 16 + NextAuth v5 beta — use `handlers` export, Server Actions for login
5. Google Fonts dynamic — via link tag in head from shop layout (not `next/font/google`)
6. **Concept on PHIbel, user_id=5** — not user_id=1
7. **IONOS UI trap** — use DNS editor NOT "Domain-Weiterleitung"
8. **Mahelya sibling routing** — via nginx subdomain `mahelya.maybetomorrow.store`, NOT `/mahelya` path (avoids Next.js basePath rewrite mess)
9. **A2 Hollywood Facades** — the 5 mockup shops are production-quality facades, not rough sketches

---

## Next Actions (if session resumes here)

1. Check SA5 completion (wait for `stop_reason != 'None'`)
2. Verify SA5 files:
   ```bash
   ssh mahelya "ls ~/maybetomorrow-store/src/app/admin/shops/ 2>&1 && ls ~/maybetomorrow-store/src/app/actions/ 2>&1"
   ```
3. Run typecheck, build, pm2 start, smoke test
4. Git commit + push
5. Apply A2 skill optimization
6. Update this PROGRESS.md file marking phases completed

---

## File Paths (Mahelya)

```
~/maybetomorrow-store/
├── CONCEPT.md             (full concept, 800+ lines)
├── PROGRESS.md            (this file — resume state)
├── .env                   (DB, secrets)
├── .env.example
├── .gitignore
├── README.md
├── package.json           (scripts: dev 3003, build, db:push, db:seed)
├── next.config.ts         (Unsplash whitelist, standalone)
├── tsconfig.json
├── ecosystem.config.js    (PM2 mt-store port 3003)
├── drizzle.config.ts
├── drizzle/
│   ├── 0000_init.sql      (applied)
│   └── meta/
├── deploy/
│   ├── nginx-maybetomorrow.conf   (247 lines, mahelya subdomain included)
│   └── README.md
├── scripts/
│   ├── currency-cron.ts
│   ├── deploy.sh
│   └── setup-mahelya.sh
└── src/
    ├── middleware.ts                 (subdomain routing, RESERVED: www/api/_next/mahelya)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                  (landing with shop directory)
    │   ├── not-found.tsx
    │   ├── api/auth/[...nextauth]/route.ts
    │   ├── actions/
    │   │   ├── auth.ts               (signInAction)
    │   │   └── shop-admin.ts         (SA5, in progress)
    │   ├── admin/
    │   │   ├── layout.tsx            (auth guard)
    │   │   ├── page.tsx              (dashboard)
    │   │   ├── login/page.tsx
    │   │   ├── shops/page.tsx        (list)
    │   │   ├── shops/[id]/           (SA5: edit with tabs)
    │   │   ├── orders/page.tsx
    │   │   ├── incidents/page.tsx
    │   │   ├── payouts/page.tsx
    │   │   ├── onboard/page.tsx
    │   │   └── kpi/page.tsx
    │   └── shop/[slug]/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── _loaders.ts           (React cache)
    │       ├── about/page.tsx
    │       ├── product/[id]/page.tsx
    │       └── checkout/page.tsx
    ├── components/
    │   ├── ui/                       (Button, Card, Badge, PriceDisplay)
    │   └── layouts/
    │       ├── types.ts
    │       ├── EarthyArtisan.tsx
    │       ├── VibrantMarket.tsx
    │       ├── OceanCalm.tsx
    │       ├── HeritageStory.tsx
    │       └── BoldMaker.tsx
    └── lib/
        ├── auth.ts                   (NextAuth v5 beta)
        ├── cn.ts
        ├── currency.ts               (smartRoundUp, getLatestRates)
        ├── env.ts
        ├── layout-registry.ts
        └── db/
            ├── client.ts
            ├── schema.ts
            └── seed.ts
```

### ✅ Phase 16 — Empty-Shop Bug Fix (Completed 2026-04-09 ~13:25 UTC)
**Symptom:** User reported "die Shops auf der Website sind noch leer wenn ich draufklicke keine Produkte etc". All 5 shops rendered header/hero/footer but no products despite DB having 5×5 active top-5 products.

**Root cause:** In all 5 layout components (EarthyArtisan/VibrantMarket/OceanCalm/HeritageStory/BoldMaker) the main slot used `{children ?? <XHome .../>}` as a fallback pattern. This pattern is broken in Next.js App Router: `children` from a layout is never `null` — it is always a ParallelRoute wrapper element (`$L2`) that Next.js injects, even when the underlying `page.tsx` returns `null`. The fallback therefore never fired, and the home route rendered an empty `<main>`.

**Fix:**
1. Exported the inner `*Home` subcomponent from each of the 5 layout files
2. Added `resolveHomeComponent(variant)` to `src/lib/layout-registry.ts`
3. Changed all 5 layouts to render plain `{children}` in the main slot
4. Updated `src/app/shop/[slug]/page.tsx` to load shop + render the resolved Home component directly (instead of returning null)

**Verified:** All 5 shops (shoezaa, mzizi, pwani-beads, kanga-dreams, coco-grove) now render 5 product cards each on both the path route (`/shop/<slug>`) and the subdomain route (`<slug>.maybetomorrow.store`). About pages still render via the `{children}` slot. HTML size per shop grew from ~10KB (chrome-only) to ~30KB (with product grid).

**Files touched:**
- `src/components/layouts/{EarthyArtisan,VibrantMarket,OceanCalm,HeritageStory,BoldMaker}.tsx` — export `*Home`, replace fallback with `{children}`
- `src/lib/layout-registry.ts` — add `resolveHomeComponent` + `homeRegistry`
- `src/app/shop/[slug]/page.tsx` — render resolved Home component
