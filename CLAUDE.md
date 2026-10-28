# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint via Next.js
```

## Environment Setup

Copy `.env.example` to `.env.local` and populate:
- `NOTION_TOKEN` — Notion integration secret
- `NOTION_DB_PORTFOLIO` — Portfolio database ID
- `NOTION_DB_SERVIZI` — Services database ID
- `NOTION_DB_TESTI` — Text/copy database ID

## Editing Content

**All site copy, prices, links, and data live in one file:** `src/config/content.ts`

Exported constants map 1-to-1 to sections: `BRAND`, `NAV`, `HERO`, `VISION`, `SERVICES`, `PORTFOLIO`, `ABOUT`, `CONTACT`. Edit there — never hunt through component files for hardcoded strings.

The Formspree form ID is also in `CONTACT.formspreeId` in that file.

## Architecture

**Stack:** Next.js 15 App Router · React 19 · Three.js + React Three Fiber · Zustand · Notion API

### Rendering Model

A fixed R3F 3D canvas sits behind the entire page (`z-index: 0`). DOM sections scroll normally above it with semi-transparent backgrounds so the 3D scene shows through.

- `src/app/page.tsx` — Server component, assembles all sections
- `src/app/SceneLoader.tsx` — Dynamic import (`ssr: false`) wrapping `ClientExperience`
- `src/app/ClientExperience.tsx` — `"use client"`, owns the R3F `<Canvas>` and `CameraRig` that lerps camera Y based on `scrollY`

### Scroll-to-Camera Mapping

`scrollY=0` → camera `y=2` (logo), `scrollY=6000` → `y=-33` (avatar floor).

| Scroll | Section |
|--------|---------|
| 0–100vh | Hero / Logo |
| 100–200vh | Text intro |
| 200–300vh | Problem / Vision |
| 300–420vh | Services |
| 420–550vh | Portfolio |
| 550–700vh | About / Avatar |
| 700vh+ | Contact |

### Component Organization

- `src/config/content.ts` — **Single source of truth for all editable content**
- `src/components/canvas/` — R3F/Three.js components (3D only, no DOM)
- `src/components/sections/` — Full-page sections, each with a paired CSS Module
- `src/components/ui/` — Navbar and shared UI primitives
- `src/lib/notion.ts` — **Server-side only** Notion API client (`getPortfolio()`, `getServizi()`) — not yet wired to UI
- `src/stores/useStore.ts` — Zustand: `scrollY`, `currentSection`, legacy drone/game state (unused)

### Portfolio Section — Canvas 2D Interactive Map

`PortfolioSection` is a `"use client"` component running a `requestAnimationFrame` loop on an HTML `<canvas>`. Two interaction modes:

- **Click anywhere** → parabolic jump to that point; clicking a project node opens its modal
- **Slingshot** → press and drag the ball backward, release to launch. Uses `window` mousemove/mouseup listeners so drag works outside the canvas bounds.

Project data (positions, colors, copy) comes from `PORTFOLIO.projects` in `content.ts`.

### About Section — Animated Ticker

`AboutSection` is `"use client"`. The bio card is always visible above the 3D avatar. Below it, a horizontally scrolling marquee ticker shows all 6 skill groups (`ABOUT.skills`) in a continuous loop — duplicated track with `translateX(-50%)` animation. Ticker pauses on hover.

### State (Zustand)

`useStore` bridges DOM and canvas:
- `scrollY` / `currentSection` — written by `ScrollSync` in `ClientExperience`, read everywhere
- Legacy game/drone state (`score`, `health`, `lasers`, `navMode`, `isDroneViewOpen`, etc.) — **unused**, pending cleanup

### Notion Content

`getPortfolio()` and `getServizi()` exist in `src/lib/notion.ts` but are not yet called from any page. Images from Notion S3 and `www.notion.so` are whitelisted in `next.config.mjs`. Never import `lib/notion.ts` in client components.

## Design System

Defined in `src/app/globals.css`:
- **Colors:** `#F5F0E8` (bg paper), `#9DD4EE` (ice glass accent — avatar material), `#E8A8BF` (blush warm — background model), `#1A1A1A` (ink)
- **Fonts:** Fraunces (display serif, warm/editorial), Bebas Neue (condensed labels), Courier Prime (body typewriter), JetBrains Mono (UI micro labels)
- CSS path alias: `@/` → `src/`

## Deployment

Vercel. Security headers and asset cache config are in `vercel.json`.
