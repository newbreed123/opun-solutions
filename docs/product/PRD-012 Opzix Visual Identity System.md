# PRD-012 Opzix Visual Identity System

Version: 1.0  
Status: Active direction  
Related epic: EPIC-012 Cinematic Platform Imagery

## Summary

Opzix is moving from digital-agency positioning toward a premium AI-powered business platform. The website imagery should reinforce that shift through a consistent cinematic command-center visual system.

The uploaded visual reference establishes the brand direction: dark luxury, modern architecture, glass interfaces, business intelligence, blue and violet accent lighting, and operators running business systems through one connected platform.

## Product Intent

Imagery should make visitors feel that Opzix provides:

- Control
- Intelligence
- Growth
- Confidence
- Innovation
- Business visibility
- Operational excellence
- Premium technology

The experience should feel closer to a modern technology company than a web design agency.

## Non-Goals

- Do not redesign the whole website.
- Do not use generic SaaS illustrations as the primary visual language.
- Do not use stock office photography, handshakes, or laptop-only scenes.
- Do not bake website copy, CTAs, logos, navigation, or marketing slogans into generated images.
- Do not make imagery feel cyberpunk, gaming-oriented, or science fiction.

## Website Usage

- Homepage: simple executive workspace with strong negative space and subtle AI, analytics, automation, and business intelligence.
- Platform: cross-industry command center showing one platform powering multiple industries.
- Real Estate: MLS, community intelligence, buyer and seller journeys, lead pipeline, scheduling, and analytics.
- Ecommerce: conversion funnel, revenue, orders, inventory, customer journey, marketing analytics, and AI shopping assistant.
- Service Businesses: scheduling, appointments, CRM, field operations, automation, lead management, and analytics.
- Founder Dashboard: minimal business intelligence banner.
- Zora AI: founder collaborating with AI as a strategic business advisor, not a chatbot widget.

## Implementation Requirements

- Use `next/image` for route imagery.
- Treat most imagery as decorative with `alt=""` unless the image carries essential content.
- Keep real copy, buttons, labels, links, and analytics behavior in HTML.
- Use responsive crops and overlays so copy remains readable.
- Keep image prompts and usage guidance centralized in the visual identity system documentation.

## Active Assets

- Homepage hero: `/opzix-command-center-hero-v2.png`
- Platform hero: `/opzix-platform-command-center.png`

## Source of Truth

See [Opzix Visual Identity System](../brand/Opzix%20Visual%20Identity%20System.md) for the full imagery library, prompt seeds, overlay values, responsive cropping guidance, performance guidance, and accessibility guidance.
