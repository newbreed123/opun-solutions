# Scanner Validation Quality Review

Based on `scanner-validation-results.json` and `scanner-validation-round-1.md`.

## Evaluation

### 1. Did generic labels decrease?

- Rating: needs improvement
- Findings:
  - Top-level risk labels are more specific than generic category titles. Examples:
    - `Shop Delta` uses `Tracking Stack Appears Limited`
    - `Career Step` uses `Cart / Checkout Path Needs Review`
    - `Blue Force Gear` uses `Product Discovery Clarity Needs Review`
  - However, category statuses still use broad labels such as `Needs Review` and `High Priority` across nearly every successful scan.
- Recommended fixes:
  - Preserve the more specific risk labels while reducing reliance on generic status text.
  - Replace or augment `Needs Review` / `High Priority` with richer context such as `Missing trust signals` or `Navigation friction detected`.
  - Add a second-line descriptor for category scores so auditors see why a category is flagged.

### 2. Are top risks more specific?

- Rating: pass
- Findings:
  - The top risk labels are clearly more diagnosis-oriented than earlier generic descriptions.
  - Examples:
    - `Mobile CTA Visibility Needs Review` for `Mizuno USA` and `Lions Shop`
    - `Store Search Visibility Needs Review` for `Donald Russell` and `Blue Force Gear`
    - `Tracking Stack Appears Limited` for `Shop Delta`
- Recommended fixes:
  - Continue refining the risk label taxonomy to avoid repeated phrasing while preserving specificity.
  - Add targeted evidence support to each top risk label, e.g. `Store Search Visibility Needs Review because search is absent from mobile header`.
  - Where possible, surface a primary driver for the risk within the label itself.

### 3. Did scores stay believable?

- Rating: needs improvement
- Findings:
  - The raw numbers are plausible for a human ecommerce audit: 50s–60s for problem stores, 70s for less urgent issues.
  - Examples:
    - `Career Step` overall 59 with category scores 58 / 61 / 59 / 66 / 52
    - `LifeEasy Store` overall 54 with category scores 56 / 45 / 65 / 56 / 46
  - But many successful sites repeat identical score combinations and category values, which weakens credibility.
    - Several sites show exactly the same category scores and statuses, e.g. 65 / 61 / 62 / 64 / 70 for `Steve Madden`, `Real Tree`, and `Donald Russell`.
- Recommended fixes:
  - Increase score differentiation by using more site-specific signals or weight adjustments.
  - Add a confidence or explanation note per category score so auditors understand why the number differs.
  - Avoid templated score outputs when the underlying page evidence is different.

### 4. Did false platform confidence stay controlled?

- Rating: needs improvement
- Findings:
  - Some scans still report platform mismatches with high confidence.
  - Examples:
    - `Precious Moments`: expected `BigCommerce`, detected `Shopify`, confidence `95`
    - `Donald Russell`: expected `BigCommerce`, detected `Shopify`, confidence `95`
    - `Destaco`: expected `Magento / Adobe Commerce`, detected `BigCommerce`, confidence `88`
  - There are also many failed scans with `Unknown` and confidence `0`, which is controlled for failures but not an indication of quality across successful scans.
- Recommended fixes:
  - Lower confidence or require stronger signal aggregation when detected platform disagrees with expected platform.
  - Introduce a `platformConfidenceReason` or evidence field for high-confidence detections.
  - Treat ambiguous platform matches as partial or uncertain rather than full `yes`/`no` binaries.

### 5. Are recommendations useful enough for a human ecommerce audit?

- Rating: needs improvement
- Findings:
  - Recommendations are generally audit-friendly in direction, but many are too generic and repeated.
  - Examples:
    - `Review the mobile screenshot for spacing, competing messages, and whether the primary action remains visually dominant.` appears across many sites.
    - `Confirm whether search is visible on mobile and desktop, especially for larger catalogs.` is useful, but still high-level.
  - The guidance lacks more precise next steps and evidence-based specificity.
- Recommended fixes:
  - Make recommendations more concrete by referencing expected page areas or behaviors.
  - If possible, include a short evidence clue: `search is not visible in mobile header` or `checkout CTA hidden below the fold`.
  - Introduce a human-readable “why this matters” line to make recommendations audit-ready.

## Summary

### Strongest improvements

- Top risk labels are much more specific and audit-relevant than generic defect names.
- The scanner now produces clearer business-impact framing, e.g. `Cart / Checkout Path Needs Review` and `Tracking Stack Appears Limited`.
- Score ranges remain plausible for ecommerce health checks, with low 50s–60s correctly mapped to usability and conversion risk.

### Weakest remaining issue

- Persistent genericness in category statuses plus repeated review recommendations makes the output feel templated rather than truly tailored.
- High-confidence platform mismatches also remain a significant risk to credibility.

### Next 3 product priorities

1. Strengthen platform detection handling and confidence signaling, especially for mismatches with high confidence.
2. Add more nuanced, evidence-backed category score explanations to reduce repeated score patterns.
3. Make recommendations more actionable and specific, avoiding repeated `review screenshot` boilerplate.
