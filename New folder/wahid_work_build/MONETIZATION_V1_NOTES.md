# WAHID Academic Atelier — Monetization Foundation V1

This is a **separate, safe build** based on the last working Home-rebuilt package. The existing working version is not overwritten.

## Included in V1
- SEO-friendly sitemap.xml with the public archive pages and new engineering tool pages.
- Tool-specific metadata and Schema.org WebApplication structured data.
- Five standalone, indexable engineering tools:
  - Manning Flow Calculator
  - Reynolds Number Calculator
  - Concrete Material Estimator
  - Brickwork Estimator
  - Engineering Unit Converter
- Toolkit page links to the standalone tools.
- Nested `/tools/` pages use corrected relative navigation links.
- No payment system, ads, login changes or monetization UI has been added yet.
- No public AI/Aurel features added.

## Important
The sitemap currently uses `https://wahidsarchive.netlify.app/` as the canonical site host because that is the preserved public URL in the project configuration. If the final production domain changes, update sitemap.xml before submitting it to Google Search Console.

## Deployment
Deploy the complete package together. Do not mix individual V1 files into an older deployment.

## Next stage
After confirming the tools and Google indexing foundation work correctly, the next safe stage is analytics/search performance, then a small Pro feature system and payment integration. Ads should come later after useful organic traffic exists.
