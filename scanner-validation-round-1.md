# Scanner Validation Round 1

This summary is updated after the latest validation sweep.

- Total tested: 29
- Successful scans: 17
- Failed scans: 12
- Platform matches: 11
- Platform mismatches: 6

## Common issues

- Mobile Readability May Be Crowded (12)
- Mobile CTA Visibility Needs Review (6)
- Product Discovery Clarity Needs Review (4)
- Cart / Checkout Path Needs Review (2)
- Store Search Visibility Needs Review (2)

## Evidence-Based Recommendation Layer

- Top-priority generic category labels decreased to `0` across 33 successful-scan top-priority risks. The scanner preserved specific issue labels rather than falling back to `Conversion Issues`, `UX/UI Issues`, or `Ecommerce Operations Issues`.
- Recommendations now include evidence-backed structure: issue title, category, severity, confidence, evidence summary, business impact, and recommended first action.
- Category score explanations are present for UX/UI, Conversion, Technical, Tracking, and Ecommerce Operations. Each explanation states why the score was assigned, which evidence influenced it, and what would improve the score.
- Deterministic score variation improved. The 17 successful scans produced 17 unique category score combinations, compared with prior repeated combinations such as `65 / 61 / 62 / 64 / 70`.
- Platform confidence explanations are clearer. High-confidence detections include concrete supporting signals, while low-confidence or uncertain platform results tell auditors why manual confirmation is needed before platform-specific recommendations.
- `What to Review First` is generated from highest business-impact findings and now carries the specific issue title, evidence clue, why it matters, and the first action.

## Sites needing manual review

- Stone Equinox (https://www.stoneequinox.com)
- Perlin Packaging (https://perlpackaging.com)
- Omni Sponsors (https://omnisponsors.com)
- Shop Barbershop (https://shopbarbershop.org)
- Cafe Appliances (https://cafeappliances.com)
- Career Step (https://careerstep.com)
- LifeEasy Store (https://store.lifeeasy.com)
- US Pilot Store (https://store.pfu-us.icoh.com)
- Penn Retail (https://store.pennretail.com.au)
- Precious Moments (https://preciousmoments.com)
- Destaco (https://destaco.com)
- TruLite Tools (https://trulitetools.com)
- Donald Russell (https://donaldrussell.com)
- ColdB Custom (https://coldb.com)
- Americas Bossa (https://americas.bossard.com)
- Garnet Popcorn (https://garnetpopcorn.com)
- Shop NFL (https://shop.nfl.com)
- Coin Circuit (https://coincircuit.com)
