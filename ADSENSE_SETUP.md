# AdSense setup

This package prepares the website technically for Google AdSense, but **ads remain inactive** until you supply your real approved publisher information.

1. Add `https://wahidsarchive.netlify.app` to Google AdSense and complete Google's site review.
2. After Google gives you a publisher ID such as `ca-pub-XXXXXXXXXXXXXXXX`, put your real ID in `js/config.js`:
   `window.ADSENSE_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";`
3. Create responsive ad units in AdSense and put their real slot IDs into the prepared public ad containers.
4. After AdSense provides your exact ads.txt seller line, create `/ads.txt` at the site root using that exact line. Do not invent or use placeholder publisher IDs.
5. Configure Google AdSense Privacy & messaging settings as applicable.

Prepared ad locations are limited to public engineering resource/toolkit pages. Admin/private pages are excluded.

AdSense approval and earnings are controlled by Google; this package cannot guarantee approval or revenue.
