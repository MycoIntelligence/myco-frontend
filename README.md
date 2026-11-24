# VELDT Marketing Platform

VELDT is a production-grade, single-page marketing website and release reliability platform built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and motion.

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Variables:
- `NEXT_PUBLIC_APP_URL`: The destination URL for "Sign in" buttons (default: `https://app.veldt.dev`).
- `NEXT_PUBLIC_SITE_URL`: The canonical URL for SEO metadata, Open Graph tags, and sitemaps (default: `https://veldt.dev`).

### Free trial emails

1. Verify a sending domain in [Resend](https://resend.com/docs/dashboard/domains/introduction) and create an API key with Sending access.
2. Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender on the verified domain), and `TRIAL_REQUEST_TO` (the Myco team inbox) as server-only variables in the deployment environment.
3. Redeploy, submit a trial request using a work inbox you control, and check both inboxes and the Resend email activity log.

A valid trial request sends the team the application details and sends the applicant a receipt. The team reviews the request and sends the onboarding guide. When a Resend key is configured, trial requests use Resend. The existing lead webhook handles demo requests and handles trial requests when the Resend key is unset.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Production Build

```bash
npm run build
npm start
```

### Quality Gates and Testing

```bash
# Check for emojis (strict zero-emoji policy)
node scripts/check-no-emoji.mjs

# Check for forbidden reference phrases
node scripts/check-no-reference-copy.mjs

# Run Vitest unit tests
npm test

# Run TypeScript type check
npm run typecheck
```

## Content Configuration

All site copy, customer claims, partner marks, and pricing details live in a single centralized configuration file:

`lib/content.ts`

To rebrand or update copy:
1. Open `lib/content.ts`.
2. Update the brand name, taglines, section headlines, statements, and FAQ answers.
3. Replace placeholder figures with verified, audited customer data before launch.
4. Components automatically consume these values without requiring JSX edits.

## Connecting pilot requests

The pilot form sends validated requests to a server-side HTTPS webhook. Set `LEAD_WEBHOOK_URL` in the deployment environment to an endpoint you control that accepts JSON POST requests and returns a 2xx response only after accepting the request. Optionally set `LEAD_WEBHOOK_TOKEN` for a bearer authorization header. These values must remain server-side; do not use a `NEXT_PUBLIC_` prefix.

The payload contains `id`, `timestamp`, `fullName`, `workEmail`, `company`, `industry`, `teamSize`, and `message`. The endpoint must handle and store this personal information appropriately. The form reports failure if delivery is unconfigured, times out after ten seconds, redirects, or returns a non-2xx response. A timeout can be ambiguous if the receiver accepted the request before the connection failed; the receiver should deduplicate using `id` where possible. Configure monitoring and test a real submission end to end before launch. The existing in-memory rate limit is per server instance and is not a distributed abuse control.

## Image Pipeline and Fallbacks

1. The site includes zero-asset procedural SVG fallbacks (`components/ui/PhotoFallback.tsx`) that generate motion-blurred and sharp duotone graphics directly from code.
2. To use custom photography, place source images into `public/images/` as specified in section 16 of the prompt (`industry-01.webp` through `industry-06.webp`, sharp variants, and blog images).
3. The sharp image pipeline can be run via `scripts/make-variants.mjs` using the Sharp image processor.

## Architecture Highlights

- Fixed two-layer header with a dynamic clip-path seam cutting through logos and pills at section boundaries.
- Continuous pinned timeline state machine driven by scroll progress.
- Procedural streak texture canvas generator running entirely in memory with parallax translation.
- Bitmapped dash-glyph rendering engine for numerals and custom pictograms.
- Full screen reader accessibility landmarks, accessible names, skip links, and reduced-motion fallbacks.

