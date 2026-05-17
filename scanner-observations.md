# Scanner Observations

Internal notes on the Opun Ecommerce Audit Scanner performance and improvements.

## False Positives

- A few enterprise sites are classified as Shopify when the expected platform is BigCommerce or Magento, indicating Shopify pattern matches can be too broad.
- Example: `Precious Moments` was detected as Shopify with 100% confidence even though expected platform is BigCommerce.
- Example: `Donald Russell` was also detected as Shopify with 100% confidence while expected platform is BigCommerce.

## False Negatives

- Several BigCommerce sites returned `Unknown` instead of the expected platform, suggesting missing or weak BigCommerce heuristics.
- Example: `Career Step` and `LifeEasy Store` were expected to be BigCommerce but detected as Unknown with 0% confidence.
- Example: `Destaco` and `Americas Bossa` were expected to be Magento / Adobe Commerce but detected as BigCommerce.

## Useful Insights

- Shopify detection is reliable when clear Shopify asset/script patterns are present.
- Google Analytics / GA4 and Google Tag Manager detection is working well when gtag, GTM IDs, or dataLayer snippets are visible.
- Meta Pixel detection is effective when fbq or facebook pixel script signatures are present.

## Useless Sections

- The current summary section is useful, but duplicate or overly generic issue labels can obscure the most actionable findings.
- The existing live diagnostics section should avoid surfacing too many generic console messages unless they directly affect platform/tracking visibility.

## Recurring Problems

- Network-inaccessible or blocked URLs caused many failed scans, reducing validation coverage.
- BigCommerce and Magento detection repeatedly failed or mismatched on enterprise sites.
- Sites with minimal or deferred script metadata often degrade to Unknown instead of a likely platform guess.

## Missing Heuristics

- Stronger BigCommerce storefront heuristics are needed for sites using non-standard asset domains or newer stencil deployments.
- More comprehensive Magento / Adobe Commerce indicators are needed, especially for sites that do not expose obvious `mage.js` or `Magento` strings.
- A fallback heuristic for platform detection when only business-critical page patterns exist (cart/checkout URLs, product collections) should be added.
- Better handling for hidden/deferred tracking scripts and tag managers that are loaded after initial DOM render.

## Strong Detection Patterns

- Shopify asset/script references remain the most reliable platform signal.
- GA4 and GTM script pattern detection is strong for standard implementations.
- Meta Pixel detection is strong for visible Facebook pixel request patterns.
- CTA and commerce signal detection works well when pages expose cart, checkout, or product collection links in visible markup.

## Round 1 Fixes Implemented

- Added conservative platform confidence scoring with high/moderate/low/needs-review bands.
- Strengthened BigCommerce detection for stencil assets, bcData, and BigCommerce-specific cart/checkout patterns.
- Reduced Shopify false positives by requiring Shopify-specific assets, globals, or CDN references instead of generic `/products/` or `/collections/` cues.
- Added Magento vs BigCommerce conflict handling so ambiguous storefront signals now fall back to manual review.
- Improved recommendation specificity with more targeted labels for CTA visibility, checkout/cart path review, platform visibility, and backend workflow mapping.

## Round 2 Heuristic Intelligence Plan Implemented

- Added mobile customer journey heuristics for above-fold CTA visibility, mobile CTA labels, dense first-screen content, and action clarity.
- Added trust and purchase-confidence heuristics for reviews/testimonials, shipping and returns wording, warranty/guarantee language, payment reassurance, support/contact visibility, and policy visibility.
- Added product discovery heuristics for product/category navigation, collection/product link visibility, search visibility, and unclear browsing paths.
- Added marketing visibility heuristics for GA4/GTM, Meta Pixel, Klaviyo/Mailchimp, missing supported marketing tools, and limited tracking stack visibility.
- Added operational continuity heuristics for cart visibility, checkout visibility, support/contact paths, order/shipping/returns language, and lead/contact workflow cues.
- Added weighted recommendation logic so Critical and High findings drive top risks, action-plan ordering, and category score adjustments before lower-impact metadata items.
- Kept uncertainty honest by using `Needs Review` when visual or public-page evidence is suggestive but not conclusive.

## Evidence-Based Recommendation Layer

- Added a structured recommendation model across scanner findings: `title`, `category`, `severity`, `confidence`, `evidenceSummary`, `businessImpact`, and `recommendedFirstAction`.
- Reduced boilerplate by grounding recommendations in observed signals such as mobile CTA presence, first-screen link count, visible search, trust-signal groups, cart/checkout visibility, marketing-tool count, platform confidence, console errors, and failed requests.
- Preserved specific top-risk labels such as `Mobile CTA Visibility Needs Review`, `Product Discovery Clarity Needs Review`, `Trust Signal Visibility Needs Review`, `Cart / Checkout Path Needs Review`, and `Marketing Attribution Visibility Appears Limited`.
- Avoided generic top-risk fallbacks like `Conversion Issues`, `UX/UI Issues`, and `Ecommerce Operations Issues`; the latest validation run reported `0` generic category labels across top-priority risks.
- Added category score explanations for UX/UI, Conversion, Technical, Tracking, and Ecommerce Operations. Each score now explains why it was assigned, which evidence influenced it, and what would improve it.
- Added deterministic score variation from observed evidence counts. The latest successful validation scans produced unique category score combinations across all 17 successful scans, reducing repeated-score credibility issues.
- Improved platform confidence explanations. High-confidence labels now list supporting evidence such as Shopify CDN/theme signals or BigCommerce stencil/CDN signals; uncertain or conflicting signals are positioned for manual review instead of platform-specific recommendations.
- Generated `What to Review First` from the highest business-impact findings, with each item carrying the issue title, evidence clue, business reason, and first action.

## Audit Narrative Refinement

- Added an `Audit Narrative` section near the top of the report to connect the highest-impact findings into one cohesive ecommerce audit story.
- Improved `What to Review First` into a clearer prioritized action plan using `First`, `Next`, and `Then` ordering, with issue title, evidence clue, business reason, and first action.
- Reordered the visible report hierarchy around executive readability: Executive Summary, Audit Narrative, What to Review First, Score Cards, Platform & Marketing Visibility, Live Diagnostics, Detailed Findings, and CTA.
- Simplified category score cards so they show score, status, a short contextual explanation, and the main evidence driver without duplicating the full finding text.
- Added a lightweight `Benchmark Notes` placeholder for future internal comparison across strong and weak ecommerce stores.

## Recommendation Narrative Cohesion

- Updated the audit narrative so it connects the top related findings into a strategic ecommerce story instead of listing isolated issues.
- Added `Connected Insight` logic for common relationship patterns such as mobile CTA plus trust visibility, discovery plus checkout continuity, tracking plus conversion, and product discovery plus search clarity.
- Improved `Primary Operational Concern` so it explains the main business concern, the supporting findings behind it, and why it should be addressed before lower-impact refinements.
- Reworked `What to Review First` ordering so the plan starts with the highest-impact customer journey issue, moves to a supporting trust or discovery issue, then follows with measurement, operations, or technical follow-through.
- Preserved category ownership rules so related findings can shape the strategic story without reintroducing duplicate full finding cards across categories.

## Benchmark Intelligence Foundation

- Added deterministic `benchmarkTags` for mobile clarity, CTA visibility, product discovery, trust signals, checkout continuity, tracking visibility, and operational clarity.
- Added comparative benchmark context to the report with conservative, evidence-backed notes instead of percentile claims or fake market positioning.
- Added recurring positive and negative operational pattern tracking so validation sweeps can identify which storefront qualities appear repeatedly across strong and weak examples.
- Created `benchmark-observations.md` as the internal structure for recording strong and weak ecommerce patterns over time.
- Updated validation scripts so future validation runs capture benchmark tags, strongest examples, weakest examples, and recurring operational patterns.
