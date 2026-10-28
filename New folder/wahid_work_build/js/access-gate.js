/* Site entry gate: UX gate only; Supabase RLS/server authorization remains authoritative. */
(() => {
  const loginPath = /\/login\.html$/i.test(location.pathname);
  if (loginPath) return;
  document.documentElement.classList.add('auth-checking');
  const KEY = 'wahid-admin-session';
  const base = String(window.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = window.SUPABASE_ANON_KEY || '';
  const hideStyle = document.createElement('style');
  hideStyle.textContent = 'html.auth-checking body{visibility:hidden!important}';
  document.head.appendChild(hideStyle);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const write = value => { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {} };
  const validUser = async token => {
    const response = await fetch(`${base}/auth/v1/user`, {headers:{apikey:anon,Authorization:`Bearer ${token}`},cache:'no-store'});
    return response.ok;
  };
  const goLogin = () => {
    const next = location.pathname.replace(/^\//,'') + location.search + location.hash;
    const login = /\/(?:resources|tools)\//i.test(location.pathname) ? '../login.html' : 'login.html';
    location.replace(`${login}?next=${encodeURIComponent(next)}`);
  };
  (async () => {
    try {
      if (!base || !anon) throw new Error('Authentication configuration is missing.');
      let session = read();
      if (session?.access_token && await validUser(session.access_token)) {
        document.documentElement.classList.remove('auth-checking');
        return;
      }
      if (session?.refresh_token) {
        const response = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
          method:'POST', headers:{apikey:anon,'Content-Type':'application/json'},
          body:JSON.stringify({refresh_token:session.refresh_token}), cache:'no-store'
        });
        if (response.ok) {
          session = await response.json(); write(session);
          if (session?.access_token && await validUser(session.access_token)) {
            document.documentElement.classList.remove('auth-checking'); return;
          }
        }
      }
    } catch (_) { /* Fail closed: protected pages never display while auth is uncertain. */ }
    try { localStorage.removeItem(KEY); } catch {}
    goLogin();
  })();
})();
