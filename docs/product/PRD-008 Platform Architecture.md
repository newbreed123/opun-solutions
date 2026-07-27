# PRD-008 Platform Architecture

Version: 1.0

Status: Product Strategy

Owner: Opzix

## Purpose

Define the reusable platform architecture that supports Opzix implementations across industries.

## Architecture Model

Shared platform core:

- Zora AI
- Analytics
- Scheduling
- CRM and automation
- Dashboards
- Website and experience engine
- Integrations
- Diagnostics

Industry layers:

- Ecommerce
- Service business
- Real estate
- Future verticals

Deployments:

- Customer websites
- Internal dashboards
- Customer dashboards
- Industry-specific journeys

## Product Rules

- Shared modules should remain reusable across industries when practical.
- Industry modules should adapt the platform to real workflows.
- Avoid building multi-tenant SaaS abstractions until customer and operational demand require them.
- Configuration should come before hardcoded customer-specific logic.

## Real Estate Implication

The Real Estate Platform should connect MLS/IDX, community intelligence, buyer journeys, seller journeys, scheduling, AI, analytics, dashboards, CRM, and automation through reusable modules.
