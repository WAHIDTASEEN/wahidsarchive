# WAHID Academic Atelier — Monetization / Google Visibility V2

This package is built from Monetization Foundation V1 and keeps the existing visual design and feature set intact.

## What changed
- Fixed and hardened the shared SEO runtime so pages receive valid titles, descriptions, canonical URLs and structured data.
- Added canonical site configuration in `js/config.js`.
- Added optional Google Search Console verification support via `GOOGLE_SITE_VERIFICATION`.
- Added optional GA4 support via `GOOGLE_ANALYTICS_ID`. Analytics is OFF until you add a valid `G-...` Measurement ID.
- Added WebSite/WebApplication + BreadcrumbList structured data.
- Expanded the sitemap to public academic/resource pages and all five standalone engineering tools.
- Kept admin, memory and handwritten-converter routes out of search indexing.
- Kept the existing lightweight local analytics counter.

## Before publishing
1. Test the package locally.
2. Keep `window.SITE_URL` equal to the real canonical public URL. If the domain changes, update it before deployment.
3. In Google Search Console, verify the site and submit `/sitemap.xml`.
4. If using GA4, put your Measurement ID in `window.GOOGLE_ANALYTICS_ID` in `js/config.js`.
5. If Search Console gives you an HTML meta verification token, put it in `window.GOOGLE_SITE_VERIFICATION` in `js/config.js`.

## Important
No Google account credentials, service keys or tracking IDs are included in this package. Do not add Supabase service-role keys to client-side files.
