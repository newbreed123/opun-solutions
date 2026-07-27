# Agents Guide

## Project

Opun Solutions is a Next.js app with an internal Ecommerce Audit Scanner for public storefront reviews.

Opzix is also moving toward a reusable Real Estate Platform. BrittanyFlannigan.com is the first production deployment of that platform, not a standalone custom website.

## Working Rules

- Do not log in to websites or access private/admin areas.
- Do not probe servers, bypass protections, test security, or scrape private data.
- Scanner validation should use public ecommerce homepage URLs only.
- Keep scanner validation runs polite, with short delays between requests.
- Do not modify scanner logic unless the task explicitly asks for implementation changes.
- Avoid over-tuning detection behavior for one site.
- For real estate work, evaluate each new feature as a reusable platform capability before implementing it for Brittany.
- Avoid Brittany-specific implementations when a configurable platform module is appropriate.
- Do not over-engineer real estate work into a multi-tenant SaaS yet; prefer reusable modules with configuration for the Brittany flagship deployment and future real estate customers.

## Common Commands

- `npm run dev` starts the local app on `localhost:3000`.
- `npm run build` verifies the production build.
- `node scanner-validation-runner.js` runs the scanner validation set.
- `node scanner-validation-summary.js` summarizes validation output.

## Validation Files

- `scanner-validation-sites.json` contains storefront inputs.
- `scanner-validation-results.json` contains structured validation results.
- `scanner-validation-results.md` contains the generated markdown report.
- `scanner-validation-round-1.md` contains the round summary.
- `scanner-observations.md` tracks product observations from validation.

## Product Notes

- Unknown or low-confidence platform results should be treated as needing manual review, not as scanner failures.
- Manual review is appropriate for custom, headless, enterprise, or heavily modified storefronts.
- Platform-specific recommendations should wait until platform visibility is confidently confirmed.
- Real estate platform modules should emphasize recurring customer value, growth, operational efficiency, AI, analytics, scheduling, CRM, automation, dashboards, MLS/IDX, community intelligence, and buyer/seller journeys.
- BrittanyFlannigan.com should serve as the reference implementation for reusable real estate platform modules.
