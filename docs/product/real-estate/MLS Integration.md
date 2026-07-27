# MLS Integration

Status: Product Strategy

Owner: Opzix

## Purpose

MLS integration gives the Real Estate Platform access to listing data through approved, licensed, and compliant data relationships.

## Goals

- Support property search and listing experiences.
- Preserve compliance, attribution, and licensing requirements.
- Provide reliable data freshness expectations.
- Keep MLS integration reusable for future real estate customers.

## Scope

Potential data areas:

- Active listings
- Listing details
- Photos and media
- Property metadata
- Open houses
- Status changes
- Brokerage and agent attribution

## Product Rules

- MLS access must follow licensing, attribution, display, and compliance rules.
- Do not scrape listing data from public sites as a substitute for licensed integration.
- Data models should support future markets without hardcoding one agent or one MLS.
- MLS availability, usage rights, and implementation cost should be confirmed per customer.

## Open Questions

- Which MLS Grid markets are required for the Brittany deployment?
- What fields are available and approved for display?
- What attribution and refresh rules apply?
- What listing alert and saved-search rules are allowed?
- What fallback experience should appear before MLS access is live?

## Metrics

- MLS uptime
- Data freshness
- Search result load time
- Property detail engagement
- Listing inquiry conversion
