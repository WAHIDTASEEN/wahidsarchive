(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const BASE = String(window.SUPABASE_URL || '').replace(/\/$/, '');
  const BUCKET = window.SUPABASE_STORAGE_BUCKET || 'documents';
  const SETTING_KEY = 'home_image';

  function clock() {
    const date = new Intl.DateTimeFormat(undefined, {weekday:'long', month:'short', day:'numeric'});
    const time = new Intl.DateTimeFormat(undefined, {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      $('greetingText').innerHTML = h < 12 ? 'Good <em>Morning.</em>' : h < 18 ? 'Good <em>Afternoon.</em>' : 'Good <em>Evening.</em>';
      $('today').textContent = date.format(now);
      $('currentTime').textContent = time.format(now);
    };
    tick();
    setInterval(tick, 1000);
  }

  async function settings() {
    if (!BASE || !window.SUPABASE_ANON_KEY) return {};
    const url = `${BASE}/rest/v1/site_settings?select=key,value&key=in.(${encodeURIComponent(SETTING_KEY)},hero)`;
    const response = await fetch(url, {headers:{apikey:window.SUPABASE_ANON_KEY, Authorization:`Bearer ${window.SUPABASE_ANON_KEY}`}, cache:'no-store'});
    if (!response.ok) throw new Error('Unable to load site settings.');
    const rows = await response.json();
    return Object.fromEntries((rows || []).map(row => [row.key, row.value]));
  }

  function renderImage(raw) {
    const box = $('homeImage');
    const feature = $('homeFeature');
    if (!box || !feature) return;
    let data = null;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { data = null; }
    const url = typeof data === 'object' && data ? String(data.url || '') : '';
    if (!url) {
      box.classList.add('hidden');
      box.innerHTML = '';
      feature.classList.add('no-image');
      return;
    }
    const image = document.createElement('img');
    image.alt = 'Home page image';
    image.loading = 'eager';
    image.decoding = 'async';
    image.src = `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(data.version || Date.now())}`;
    image.addEventListener('error', () => {
      box.classList.add('hidden');
      box.innerHTML = '';
      feature.classList.add('no-image');
    }, {once:true});
    box.innerHTML = '';
    box.appendChild(image);
    box.classList.remove('hidden');
    feature.classList.remove('no-image');
  }

  async function loadHomeImage() {
    try {
      const s = await settings();
      renderImage(s[SETTING_KEY] || null);
      if (s.hero && $('heroText')) $('heroText').textContent = s.hero;
    } catch {
      renderImage(null);
    }
  }

  async function loadArchive() {
    try {
      const all = await WahidPublic.request('works?select=category&published=eq.true');
      const list = Array.isArray(all) ? all : [];
      const labs = list.filter(x => x.category === 'Lab Report').length;
      const projects = list.filter(x => x.category === 'Project').length;
      const assignments = list.filter(x => x.category === 'Assignment').length;
      for (const [id,value] of [['statAll',list.length],['statAll2',list.length],['statLabs',labs],['statLabs2',labs],['statProjects',projects],['statAssignments2',assignments]]) {
        if ($(id)) $(id).textContent = value;
      }
    } catch {
      for (const id of ['statAll','statAll2','statLabs','statLabs2','statProjects','statAssignments2']) {
        if ($(id)) $(id).textContent = '—';
      }
    }
  }

  async function init() {
    clock();
    await Promise.allSettled([loadHomeImage(), loadArchive()]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
