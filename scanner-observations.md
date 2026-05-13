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
