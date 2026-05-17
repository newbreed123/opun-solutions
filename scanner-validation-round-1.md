# Scanner Validation Round 1

This summary is updated after the latest validation sweep.

- Total tested: 29
- Successful scans: 17
- Failed scans: 12
- Platform matches: 11
- Platform mismatches: 6

## Common issues

- Mobile Readability May Be Crowded (11)
- Mobile CTA Visibility Needs Review (6)
- Product Discovery Clarity Needs Review (4)
- Cart / Checkout Path Needs Review (2)
- Store Search Visibility Needs Review (2)

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

## Benchmark Intelligence Validation

Future validation sweeps now capture benchmark fields in addition to platform, score, and priority issue data.

- `benchmarkTags` generated for strong and weak signals such as mobile clarity, CTA visibility, product discovery, trust signals, checkout continuity, tracking visibility, and operational clarity.
- Strongest benchmark examples should be reviewed by counting stores with multiple `strong-*` tags and confirming the evidence behind each tag.
- Weakest benchmark examples should be reviewed by counting stores with multiple `weak-*` tags and checking whether the action plan reflects the same operational pattern.
- Recurring operational patterns should be summarized from `benchmarkRecurringPositivePatterns` and `benchmarkRecurringNegativePatterns` in `scanner-validation-results.json`.
- Benchmark language should remain conservative: directional internal comparison only, no percentile rankings, no market-wide claims, and no unsupported revenue projections.

## Local Benchmark QA Notes

- `/` generated `strong-mobile-clarity`, `strong-cta-visibility`, `weak-product-discovery`, `strong-checkout-continuity`, `weak-tracking-visibility`, and `strong-operational-clarity`.
- `/services/ecommerce-solutions` generated mixed tags including `weak-mobile-clarity`, `strong-trust-signals`, `strong-tracking-visibility`, and `weak-product-discovery`.
- `/tools/ecommerce-audit-scanner` generated weaker journey tags including `weak-mobile-clarity`, `weak-cta-visibility`, `weak-product-discovery`, and `weak-tracking-visibility`.
- Strongest local examples came from pages with visible mobile CTA evidence, cart/checkout continuity, and operational clarity.
- Weakest local examples came from pages with missing above-fold mobile CTA evidence, weaker product discovery, and thin public tracking visibility.
- Recurring negative local pattern: product discovery remains weaker when collection/product links or search are not visible in the public-page sample.
