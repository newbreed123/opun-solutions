# Opzix Visual Identity System

Version: 1.0  
Status: Active direction  
Owner: Opzix Product and Brand

## Purpose

Opzix imagery should make the company feel like a premium technology platform, not a digital agency. The visual language is a family of cinematic command-center environments where founders, operators, brokers, and business owners run intelligent systems through one connected platform.

The uploaded reference image defines the direction: dark luxury, modern architecture, glass interfaces, business intelligence, blue and violet accents, and an operator in control. It should inspire the system, not be copied directly across the site.

## Core Principles

- Every image should communicate control, intelligence, growth, confidence, innovation, business visibility, and operational excellence.
- Images should feel like a CEO, founder, broker, or operator using a powerful platform.
- Avoid laptop-only scenes, handshakes, generic office photography, overt sci-fi, cyberpunk, gaming aesthetics, and busy SaaS collage art.
- Do not bake website headlines, buttons, navigation, logos, marketing copy, or CTA text into the image.
- Interface details may suggest maps, funnels, analytics, scheduling, AI, and automation, but should not contain readable product labels or claims.

## Visual Language

- Mood: dark luxury, quiet confidence, cinematic depth.
- Environment: modern command center, executive workspace, glass displays, architectural panels, city or global intelligence ambience.
- Light: soft cyan, electric blue, restrained violet, subtle warm accents.
- Materials: glass, matte graphite, brushed metal, dark polished surfaces.
- Camera: wide cinematic framing, shallow depth of field where useful, premium editorial composition.
- UI language: abstract dashboards, charts, maps, flows, journey paths, scheduling grids, and intelligence nodes.

## Asset Library

### 1. Homepage Hero

Purpose: Immediate "technology company" signal with simple executive workspace energy.

Scene: Sophisticated command-center office with one operator or implied workstation, monitors on the right, strong negative space on the left for live HTML headline and CTAs.

Recommended dimensions: 2400 x 1350 or larger, 16:9.

Crop guidance:
- Desktop: focal point around 70-78% x, 50% y.
- Tablet: focal point around 76-82% x, 50% y.
- Mobile: focal point around 82-88% x, 50% y, with busy monitor detail away from headline.

Overlay: Use a left-to-right navy gradient. Keep the left copy field protected and the right side visible.

Prompt seed: "Dark luxury executive technology workspace, cinematic command center, clean negative space on the left, glass interfaces and analytics on the right, AI, automation, maps, customer journeys, business intelligence, no text, no logos, no buttons."

### 2. Platform Hero

Purpose: Present Opzix as one connected platform powering multiple industries.

Current asset: `/opzix-platform-command-center.png`

Scene: Command center with one operator, global intelligence wall, abstract industry dashboards, glass workstation, and cross-industry operating signals.

Recommended dimensions: 2400 x 1350 or larger, 16:9.

Crop guidance:
- Desktop: focal point around 56-62% x, 50% y.
- Tablet: focal point around 60-66% x, 50% y.
- Mobile: use a simpler crop or hide behind a stronger gradient if the image competes with copy.

Overlay: For framed hero image use a lighter overlay:

```css
linear-gradient(
  90deg,
  rgba(7, 16, 36, 0.38) 0%,
  rgba(7, 16, 36, 0.16) 45%,
  rgba(7, 16, 36, 0.04) 100%
)
```

### 3. Real Estate Hero

Purpose: Show Opzix Real Estate as a premium growth platform, not a template website.

Scene: Same command-center architecture with property search, MLS-style map regions, buyer journey, seller journey, lead pipeline, scheduling, analytics, and luxury market intelligence.

Recommended dimensions: 2400 x 1350, 16:9.

Crop guidance:
- Desktop: operator and primary displays on right, clean left copy area if used as hero background.
- Mobile: prefer display details and architectural lighting over a cropped human figure.

Prompt seed: "Premium real estate command center, abstract property map, buyer and seller journey paths, lead pipeline, scheduling, analytics, luxury brokerage atmosphere, no readable text, no logos."

### 4. Ecommerce Hero

Purpose: Show commerce as an intelligent operating system for conversion and operations.

Scene: Command center with conversion funnel, order movement, revenue analytics, inventory intelligence, customer journey paths, and AI shopping-assistant signals.

Recommended dimensions: 2400 x 1350, 16:9.

Crop guidance:
- Desktop: funnel and analytics displays to the right or center-right.
- Mobile: crop to abstract funnel and glowing commerce dashboards, avoiding tiny unreadable UI.

Prompt seed: "Premium ecommerce intelligence command center, abstract conversion funnel, revenue dashboards, orders, inventory, customer journey, AI shopping assistant signal, dark luxury, no text, no logos."

### 5. Service Business Hero

Purpose: Show service businesses operating with lead flow, scheduling, CRM, and field operations visibility.

Scene: Command center with appointment grid, routing map, CRM pipeline, lead management, automation nodes, field operations signals, and analytics.

Recommended dimensions: 2400 x 1350, 16:9.

Crop guidance:
- Desktop: appointment and operations displays right side.
- Mobile: crop around scheduling and routing visuals, keeping people secondary.

Prompt seed: "Premium service operations command center, appointments, CRM pipeline, lead routing, field operations map, automation, analytics, dark blue glass interface, no readable text, no logos."

### 6. Founder Dashboard Banner

Purpose: Minimal banner for internal intelligence and operational clarity.

Scene: Elegant business intelligence wall or desk display with lead activity, assistant conversations, bookings, scans, and operational signals abstracted into charts and nodes.

Recommended dimensions: 2200 x 900, wide banner.

Crop guidance:
- Keep center simple.
- Avoid a busy wall of dashboards.
- Use restrained depth and negative space.

Prompt seed: "Minimal founder dashboard command-center banner, elegant business intelligence visualization, subtle charts and operating signals, premium dark interface, no readable text, no logos."

### 7. Zora AI Concept

Purpose: Show a founder collaborating with AI as a strategic advisor, not chatting with a widget.

Scene: Founder at a command surface with a subtle AI intelligence presence represented by glass interface patterns, knowledge graph, and strategic recommendations.

Recommended dimensions: 2400 x 1350, 16:9.

Crop guidance:
- Keep the human and AI interface in dialogue.
- Avoid anthropomorphic robots and chat bubbles.

Prompt seed: "Founder collaborating with AI business advisor through glass intelligence interface, strategic planning environment, knowledge graph, calm premium technology lighting, no chatbot bubbles, no readable text, no logos."

## Overlay Recommendations

Homepage background overlay:

```css
linear-gradient(
  90deg,
  rgba(3, 12, 31, 0.97) 0%,
  rgba(3, 12, 31, 0.88) 30%,
  rgba(3, 12, 31, 0.52) 58%,
  rgba(3, 12, 31, 0.22) 82%,
  rgba(3, 12, 31, 0.10) 100%
)
```

Framed image overlay:

```css
linear-gradient(
  90deg,
  rgba(7, 16, 36, 0.38) 0%,
  rgba(7, 16, 36, 0.16) 45%,
  rgba(7, 16, 36, 0.04) 100%
)
```

Recommended image filter range:

```css
filter: brightness(0.72-0.84) contrast(1.03-1.08) saturate(0.9-1.05);
```

## Responsive Cropping

- Design every hero image with a clear safe text area.
- Keep the primary human/operator and interface details away from the left headline zone when the image is used as a full hero background.
- For mobile, use `object-position` deliberately. Do not allow the most detailed interface area to sit directly behind the headline.
- Prefer a separate mobile source only when object-position cannot preserve both readability and meaningful image detail.

## Performance

- Use `next/image` for all project imagery.
- Use `priority` only for above-the-fold hero images on the route.
- Use `sizes` that match the rendered width, for example `(min-width: 1024px) 45vw, 100vw` for a two-column hero.
- Avoid loading a full-width desktop source for small decorative mobile images.
- Keep generated hero assets compressed and avoid adding multiple heavy hero images to the same first viewport.

## Accessibility

- Use empty `alt=""` for decorative atmosphere images when the page copy communicates the content.
- Use meaningful alt text only when the image conveys information unavailable elsewhere.
- Do not put critical claims, CTAs, or labels only inside images.
- Preserve keyboard focus and link semantics for all real CTAs.
- Do not place text over busy image areas without a tested contrast overlay.

## Implementation Rules

- Website copy remains real HTML.
- Buttons and CTAs remain real links or buttons with existing analytics behavior.
- Image UI should be atmospheric, abstract, and non-essential.
- Imagery should support the platform story but never replace product content or accessibility.
