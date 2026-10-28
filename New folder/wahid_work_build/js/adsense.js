(function () {
  "use strict";
  var publisherId = window.ADSENSE_PUBLISHER_ID || "";
  if (!/^ca-pub-\d{16}$/.test(publisherId)) return;

  var script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(publisherId);
  document.head.appendChild(script);

  window.adsbygoogle = window.adsbygoogle || [];
  document.querySelectorAll(".wahid-ad-slot[data-ad-slot]").forEach(function (slot) {
    if (slot.dataset.adInitialized === "true") return;
    slot.dataset.adInitialized = "true";
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  });
})();
