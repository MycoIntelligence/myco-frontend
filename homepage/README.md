# Lifecycle homepage

Next.js, Tailwind CSS, shadcn/ui and free MIT-licensed Magic UI components. No Pro template or paid dependency.

Run `npm ci`, then `npm run dev` to edit locally. To publish into this repository's existing static hosting setup:

```
npm run build
node export-homepage.mjs
```

Commit the updated root index.html, _next and brands directories alongside source changes. No root framework/build configuration is required. Existing api/leads.js remains unchanged.

This branch is a design preview: booking opens a placeholder dialog; no lead is submitted. PR review is marked Live; other stages are Pilot direction, not guaranteed availability. Review examples are illustrative. Search indexing is disabled for this preview.
