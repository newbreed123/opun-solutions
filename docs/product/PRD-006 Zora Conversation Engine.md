# PRD-006 Zora Conversation Engine

Version: 1.0

Status: Product Strategy

Owner: Opzix

## Purpose

The Zora Conversation Engine determines how Zora interprets context, selects playbooks, adapts tone, asks questions, recommends next steps, and records learning signals.

## Goals

- Provide consistent, context-aware responses.
- Separate ecommerce, service, and real estate journeys.
- Use structured lead profiles where available.
- Answer the user's direct question first.
- Capture product learning without relying on private or sensitive data.

## Core Concepts

- Lead profile
- Industry inference
- Conversation stage
- Current topic
- Detected intent
- Recommended action
- Playbook selection
- Low-confidence fallback handling

## Product Rules

- If selected industry conflicts with URL clues, acknowledge uncertainty and ask a clarification question.
- If a user asks direct pricing, scope, or explanation questions, answer directly before offering the next step.
- For real estate, separate buyer, seller, valuation, showing, recruiting, and general brand intent.
- Store reusable learning patterns rather than one-off copy fixes.

## Metrics

- Intent distribution
- Playbook usage
- Fallback rate
- Qualified lead rate
- CTA click-through
- Follow-up booking rate
