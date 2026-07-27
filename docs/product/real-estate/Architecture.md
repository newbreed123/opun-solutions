# Real Estate Platform Architecture

Status: Product Strategy

Owner: Opzix

## Purpose

Define the architecture for the Opzix Real Estate Platform as a reusable industry layer on top of the shared Opzix platform core.

## Architecture

External and industry inputs:

- MLS Grid
- Licensed listing data
- Brokerage back-office systems
- CRM and calendar systems
- Agent and brokerage content

Real estate modules:

- IDX Module
- Community Intelligence
- Buyer Journey
- Seller Journey
- Brokerage BO Module

Shared platform core:

- Zora AI
- Analytics
- Scheduling
- CRM and automation
- Dashboards
- Website Engine
- Integrations

Deployments:

- Agent
- Team
- Brokerage

## Product Rules

- BrittanyFlannigan.com is an in-progress reference design and example implementation.
- Features should be designed as real estate platform capabilities before being configured for Brittany.
- Do not introduce full multi-tenant SaaS complexity until required by multiple customers or brokerage workflows.
- Customer-specific copy, branding, markets, communities, and lead routing should be configuration where possible.

## Initial Implementation Bias

Start with modules that improve launch value and future reuse:

- Community Intelligence
- Buyer and seller journeys
- Native scheduling
- Zora real estate assistant behavior
- Analytics events for buyer, seller, valuation, and appointment intent
- MLS/IDX integration planning
