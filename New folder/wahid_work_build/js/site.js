(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const safeUrl = raw => { const value=String(raw||'').trim(); if(!value)return ''; try{const u=new URL(value,location.href);return ['http:','https:','mailto:','tel:'].includes(u.protocol)?u.href:''}catch{return ''} };
  const waUrl = number => { const digits=String(number||'').replace(/\D/g,''); if(!digits)return ''; const normalized=digits.startsWith('0')?'88'+digits:digits.startsWith('880')?digits:'88'+digits; return `https://wa.me/${normalized}`; };
  const icon = name => { const paths={
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    work:'<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    graph:'<path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/><circle cx="7" cy="15" r=".8" fill="currentColor" stroke="none"/><circle cx="10" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r=".8" fill="currentColor" stroke="none"/><circle cx="17" cy="7" r=".8" fill="currentColor" stroke="none"/>',
    tools:'<path d="M14.7 6.3a4 4 0 0 0-5.1 5.1L4 17a2.1 2.1 0 0 0 3 3l5.6-5.6a4 4 0 0 0 5.1-5.1l-2.5 2.5-2.1-.4-.4-2.1z"/>',
    projects:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.4 2.5-5 5.5-5s4.9 1.6 5.5 5"/><circle cx="17" cy="10" r="2.5"/><path d="M14.5 20c.4-2.5 1.7-3.8 4-4"/>',
    about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none"/>',
    updates:'<path d="M5 19 19 5"/><path d="M8 5h11v11"/>',
    message:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8h8M8 11h5"/>'
  }; return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]||paths.about}</svg>`; };
  const basePrefix = /\/(tools|resources)\//.test(location.pathname) ? '../' : '';
  const nav = `<header class="lux-header academic-sidebar" aria-label="Wahid’s Archive navigation">
    <a class="brand-lockup" href="${basePrefix}index.html"><span class="brand-mark">W</span><span class="brand-copy"><strong>Wahid’s Archive</strong><em>LEARN · BUILD · GROW</em></span></a>
    <nav class="lux-nav" aria-label="Primary navigation">
      <a class="nav-item" data-nav="home" href="${basePrefix}index.html"><span class="nav-icon">⌂</span><span>Home</span></a>
      <a class="nav-item" data-nav="graph" href="${basePrefix}graph.html"><span class="nav-icon">${icon('graph')}</span><span>Graph Studio</span></a>
      <a class="nav-item" data-nav="toolkit" href="${basePrefix}toolkit.html"><span class="nav-icon">${icon('tools')}</span><span>Tools</span></a>
      <a class="nav-item" data-nav="work" href="${basePrefix}work.html"><span class="nav-icon">${icon('work')}</span><span>Resources</span></a>
      <a class="nav-item message-nav" data-nav="message" href="${basePrefix}message.html"><span class="nav-icon">✉</span><span>Contact</span></a>
    </nav>
    <div class="sidebar-tools"><a class="nav-login" href="${basePrefix}login.html" data-nav="login" aria-label="Log in"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.9-3.9 3.7-6 7.5-6s6.6 2.1 7.5 6"/></svg><span class="nl-label">Log in</span></a><a class="whatsapp-header" href="https://wa.me/8801821996439" target="_blank" rel="noopener noreferrer" aria-label="Contact on WhatsApp" title="WhatsApp"><svg class="whatsapp-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.4L.8 23.2l6-1.6a11.4 11.4 0 0 0 5.4 1.4h.1A11.4 11.4 0 0 0 20.2 3.8ZM12.3 21a9.4 9.4 0 0 1-4.8-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.4 9.4 0 1 1 12.3 21Zm5.2-7c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a7.7 7.7 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5.2-.5c.1-.2 0-.4 0-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4a11.8 11.8 0 0 0 4.5 4c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.2-1.4-.2-.3-.5-.5Z"/></svg><span>WhatsApp</span></a></div>
    <button id="mobileMenu" class="mobile-menu" type="button" aria-label="Open navigation" aria-expanded="false">☰</button>
  </header>`;
  const footer = `<footer class="lux-footer"><div class="footer-main"><div><b>Wahid’s Archive</b><span> · Learn · Build · Grow</span></div><div><span>© 2026 Wahid. All rights reserved.</span></div></div><div class="footer-contact"><div><span class="footer-label">CONNECT</span><div id="socialLinks" class="social-links"></div></div><div class="footer-direct"><a id="footerEmail" class="footer-contact-link" href="mailto:wahidbinalitaseen22@gmail.com">✉ Email</a><a id="footerWhatsApp" class="footer-contact-link" href="https://wa.me/8801821996439" target="_blank" rel="noopener">◉ WhatsApp</a></div></div></footer>`;
  function socialData(s){let x={};try{x=JSON.parse(s?.socials||'{}')}catch{}return {facebook:x.facebook||'',linkedin:x.linkedin||'',github:x.github||'',youtube:x.youtube||'',x:x.x||'',googleScholar:x.googleScholar||'',orcid:x.orcid||''};}
  function customLinksData(s){let x=[];try{x=JSON.parse(s?.custom_links||'[]')}catch{}return Array.isArray(x)?x:[];}
  function socialHTML(s){const socials=socialData(s);const labels=[['facebook','Facebook'],['linkedin','LinkedIn'],['github','GitHub'],['youtube','YouTube'],['x','X'],['googleScholar','Google Scholar'],['orcid','ORCID']];const fixed=labels.map(([key,label])=>{const url=safeUrl(socials[key]);return url?`<a class="social-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${label}</span><b>↗</b></a>`:''}).join('');const custom=customLinksData(s).map(item=>{const url=safeUrl(item.url);const label=String(item.label||'Link').trim();return url&&label?`<a class="social-link active-social" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${esc(label)}</span><b>↗</b></a>`:''}).join('');return fixed+custom;}
  function hydrateFooter(s){const box=$('socialLinks');if(box)box.innerHTML=socialHTML(s);const email=safeUrl(`mailto:${s.email||window.CONTACT_EMAIL||'wahidbinalitaseen22@gmail.com'}`);const e=$('footerEmail');if(e&&email)e.href=email;const w=$('footerWhatsApp');if(w){const u=waUrl(s.whatsapp||window.WHATSAPP_NUMBER);if(u)w.href=u;}const aboutBox=$('aboutSocials');if(aboutBox)aboutBox.innerHTML=`<a class="social-link active-social" href="${esc(waUrl(s.whatsapp||window.WHATSAPP_NUMBER))}" target="_blank" rel="noopener"><span>WhatsApp</span><b>↗</b></a><a class="social-link active-social" href="${esc(email)}"><span>Email</span><b>↗</b></a>`+socialHTML(s);if($('aboutContact')&&s.contact)$('aboutContact').textContent=s.contact;}
  function theme(){
    const key='wahid-theme';
    let saved='light';try{saved=localStorage.getItem(key)||'light'}catch{}
    const apply=(mode)=>{
      document.body.classList.toggle('light-theme',mode==='light');
      document.body.classList.toggle('light',mode==='light');
      document.body.classList.toggle('dark',mode==='dark');
      document.documentElement.dataset.theme=mode;
      const btn=$('themeToggle');
      const meta=document.querySelector('meta[name=theme-color]');
      if(meta)meta.setAttribute('content',mode==='dark'?'#1a1535':'#efe9ff');
      if(btn){const icon=btn.querySelector('.theme-icon'),label=btn.querySelector('.theme-label');if(icon)icon.textContent=mode==='dark'?'☀':'☾';if(label)label.textContent=mode==='dark'?'Light mode':'Dark mode';btn.setAttribute('aria-label',mode==='dark'?'Switch to light theme':'Switch to dark theme');btn.title=mode==='dark'?'Switch to light mode':'Switch to dark mode';btn.setAttribute('aria-pressed',String(mode==='dark'));}
    };
    apply(saved==='dark'?'dark':'light');
    $('themeToggle')?.addEventListener('click',()=>{const next=document.body.classList.contains('light-theme')?'dark':'light';try{localStorage.setItem(key,next)}catch{}apply(next)});
  }
  async function settings(){try{const rows=await WahidPublic.request('site_settings?select=key,value');return Object.fromEntries((rows||[]).map(x=>[x.key,x.value]));}catch{return {};}}
  function renderHomeBanner(s){
    const page=document.body.dataset.page;
    if(page!=='home')return;
    const old=$('homePalestineBanner'); if(old)old.remove();
    let cfg={enabled:true,text:'Free Palestine'};
    try{const parsed=JSON.parse(s?.home_banner||'');if(parsed&&typeof parsed==='object')cfg={...cfg,...parsed};}catch{}
    if(cfg.enabled===false || !String(cfg.text||'').trim())return;
    const header=$('siteHeader');
    if(!header)return;
    const text=esc(String(cfg.text).trim());
    header.insertAdjacentHTML('afterend',`<section id="homePalestineBanner" class="home-palestine-banner" aria-label="Home announcement"><div class="home-palestine-track"><div class="home-palestine-item"><img src="./assets/palestine-flag.png" alt=""><span>${text}</span></div><div class="home-palestine-item" aria-hidden="true"><img src="./assets/palestine-flag.png" alt=""><span>${text}</span></div></div></section>`);
  }
  async function profile(){try{const s=await settings();if(s.profile_photo){const img=$('headerProfilePhoto');if(img){img.src=s.profile_photo;img.parentElement.classList.add('has-photo');}}hydrateFooter(s);renderHomeBanner(s);}catch{hydrateFooter({email:window.CONTACT_EMAIL,whatsapp:window.WHATSAPP_NUMBER,socials:'{}'});renderHomeBanner({});}}
  async function notifications(){return;}
  function init(){
    $('siteHeader')?.insertAdjacentHTML('afterbegin',nav);
    $('siteFooter')?.insertAdjacentHTML('afterbegin',footer);
    const page=document.body.dataset.page||(location.pathname.includes('graph')?'graph':location.pathname.includes('admin')?'dashboard':location.pathname.includes('work')?'work':location.pathname.includes('about')?'about':location.pathname.includes('toolkit')?'toolkit':location.pathname.includes('projects')?'projects':location.pathname.includes('people')?'people':location.pathname.includes('message')?'message':location.pathname.includes('updates')?'updates':'home');
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));
    $('mobileMenu')?.addEventListener('click',()=>{const nav=document.querySelector('.lux-nav');const open=nav?.classList.toggle('open')||false;$('mobileMenu')?.setAttribute('aria-expanded',String(open));$('mobileMenu')?.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
    document.querySelectorAll('.lux-nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.lux-nav')?.classList.remove('open');$('mobileMenu')?.setAttribute('aria-expanded','false');}));
    theme();profile();
  }
  window.WahidSite={$,esc,settings,notifications,safeUrl,waUrl,socialHTML,customLinksData};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
