# IDX Module

Status: Product Strategy

Owner: Opzix

## Purpose

The IDX Module turns licensed listing data into branded property discovery experiences that connect search intent to lead capture, AI assistance, scheduling, and analytics.

## Goals

- Provide property search inside the customer experience.
- Support listing and property detail views.
- Connect property interest to buyer inquiry and follow-up workflows.
- Track search and property engagement for dashboards.
- Reuse the module across agents, teams, and brokerages.

## Core Capabilities

- Search entry points
- Listing results
- Map search
- Property detail pages
- Saved search planning
- Listing alert planning
- Property inquiry forms
- Zora buyer-assistant context
- Analytics events for search, detail views, and inquiries

## Product Rules

- IDX UI should be configured by customer brand, market, and available MLS data.
- Search behavior should not assume every market has the same fields.
- Property inquiry should preserve listing context for follow-up.
- Platform-specific improvements should be implemented as reusable IDX capabilities, not Brittany-only components.
- MLS Grid IDX is the required data-use path for Brittany's public listing display.
- Any legacy IDX Broker integration is a temporary fallback only. Deprecate and remove it after MLS Grid-powered search reaches production readiness.
- Do not treat removal of legacy IDX Broker as cancellation or removal of the MLS Grid IDX subscription.

## Metrics

- Searches started
- Property detail views
- Listing inquiries
- Saved search requests
- Listing alert requests
- Buyer consultations booked
