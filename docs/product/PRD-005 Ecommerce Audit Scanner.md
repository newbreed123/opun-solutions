# PRD-005 Ecommerce Audit Scanner

Version: 1.0

Status: Product Strategy

Owner: Opzix

## Purpose

The Ecommerce Audit Scanner reviews public storefront pages to identify conversion, UX, tracking, platform, and operational gaps.

## Goals

- Provide a useful public audit experience.
- Surface prioritized recommendations.
- Feed scanner context into Zora for explanation and follow-up.
- Support internal validation and quality review.
- Avoid overclaiming platform detection when evidence is limited.

## Product Rules

- Use public ecommerce homepage URLs only for validation.
- Do not log in to websites or access private/admin areas.
- Do not probe, bypass protections, test security, or scrape private data.
- Keep validation runs polite.
- Treat unknown or low-confidence platform results as manual review, not scanner failure.
- Do not over-tune detection behavior for one site.

## Core Capabilities

- Platform detection confidence
- Site type classification
- Conversion and CTA review
- Tracking readiness review
- Trust and mobile readiness review
- Recommendation roadmap
- Zora audit explanation context

## Metrics

- Scan starts
- Scan completions
- Platform match rate
- Unknown or needs-review rate
- Recommendation usefulness
- Zora follow-up engagement
- Strategy call conversion from audit
