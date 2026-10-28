(() => {
  const base = String(window.SUPABASE_URL || '').replace(/\/$/, '');
  const key = window.SUPABASE_ANON_KEY || '';
  function build(path) { return `${base}/rest/v1/${path}`; }
  async function request(path, options = {}) {
    if (!base || !key) throw new Error('Supabase configuration is missing.');
    const headers = { apikey:key, Authorization:`Bearer ${key}`, Accept:'application/json', ...(options.headers||{}) };
    const res = await fetch(build(path), { cache:'no-store', ...options, headers });
    const text = await res.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new Error(`${res.status}: ${data?.message || data?.hint || data?.error || text || 'Supabase request failed'}`);
    return data;
  }
  window.WahidPublic = { request, url:base, key };
})();
