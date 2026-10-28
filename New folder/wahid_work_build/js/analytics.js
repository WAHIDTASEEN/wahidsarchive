(() => {
  const gaId = (window.GOOGLE_ANALYTICS_ID || '').trim();

  // Keep the existing lightweight local counter for the admin-side feature system.
  try {
    const key = 'wahid-local-analytics';
    const data = JSON.parse(localStorage.getItem(key) || '{"pages":{},"tools":{},"works":{}}');
    const path = location.pathname.replace(/^\//, '') || 'index.html';
    data.pages[path] = (data.pages[path] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}

  // GA4 is opt-in: nothing is sent to Google until a Measurement ID is added to config.js.
  if (gaId && /^G-[A-Z0-9]+$/i.test(gaId)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
  }

  window.addEventListener('load', () => {
    window.WahidFeatures?.track('page_view', { title: document.title });
    if (typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_title: document.title, page_location: location.href });
  });
})();
