# PRD-007 Native Scheduling

Version: 1.0

Status: Product Strategy

Owner: Opzix

## Purpose

Native Scheduling reduces friction between interest and booked consultation by keeping appointment selection inside the Opzix experience.

## Goals

- Allow visitors to book strategy sessions from Opzix pages and Zora flows.
- Support availability windows, booking records, confirmations, reminders, and meeting preparation.
- Provide a fallback path when native scheduling is disabled or integrations are incomplete.
- Reuse scheduling as a platform module for service, ecommerce, and real estate journeys.

## Core Capabilities

- Availability API
- Appointment creation
- Booking conversion tracking
- Confirmation page
- Email confirmations
- Reminder processing
- Calendar and meeting link integration

## Product Rules

- Scheduling should remain available as a reusable module.
- Real estate scheduling should support buyer consultation, seller consultation, valuation discussion, and strategy session contexts.
- Failed calendar integration should not block core booking capture.
- Booking flows should preserve source and service-requested context.

## Metrics

- Booking starts
- Booking completions
- Booking completion rate
- Reminder success
- Calendar integration status
- Meeting link creation status
