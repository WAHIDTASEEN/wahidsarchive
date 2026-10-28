(() => {
  const $ = id => document.getElementById(id);
  const base = String(window.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = window.SUPABASE_ANON_KEY || '';
  const SESSION_KEY = 'wahid-admin-session'; // shared session key
  const ATTEMPT_KEY = 'wahid-login-attempts-v1';
  const ATTEMPT_LIMIT = 5, ATTEMPT_WINDOW_MS = 60_000;
  function attemptState() { try { const x=JSON.parse(localStorage.getItem(ATTEMPT_KEY)||'null'); return x && Array.isArray(x.times) ? x : {times:[]}; } catch { return {times:[]}; } }
  function remainingLockMs() { const now=Date.now(), x=attemptState(); x.times=x.times.filter(t=>Number.isFinite(t)&&now-t<ATTEMPT_WINDOW_MS); try{localStorage.setItem(ATTEMPT_KEY,JSON.stringify(x));}catch{} return x.times.length>=ATTEMPT_LIMIT ? Math.max(0,ATTEMPT_WINDOW_MS-(now-x.times[0])) : 0; }
  function canAttempt() { const ms=remainingLockMs(); if(ms>0){status(`Too many sign-in attempts. Try again in ${Math.ceil(ms/1000)} seconds.`, 'error');return false;} return true; }
  function recordAttempt() { const now=Date.now(), x=attemptState(); x.times=x.times.filter(t=>Number.isFinite(t)&&now-t<ATTEMPT_WINDOW_MS); x.times.push(now); try{localStorage.setItem(ATTEMPT_KEY,JSON.stringify(x));}catch{} }
  const loadSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
  const saveSession = s => localStorage.setItem(SESSION_KEY, JSON.stringify(s));

  async function api(path, { method = 'GET', body = null, token = null } = {}) {
    const r = await fetch(base + path, {
      method, cache: 'no-store',
      headers: { apikey: anon, Accept: 'application/json', Authorization: `Bearer ${token || anon}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
    if (!r.ok) { const e = new Error(d?.msg || d?.message || d?.error_description || d?.error || 'Request failed'); e.status = r.status; throw e; }
    return d;
  }
  const normalize = raw => {
    const id = String(raw || '').trim();
    if (id.includes('@')) return id;
    const digits = id.replace(/\D/g, '');
    if (digits.startsWith('01') && digits.length === 11) return '+880' + digits.slice(1);
    if (digits.startsWith('880')) return '+' + digits;
    return id;
  };
  const friendly = e => {
    const m = String(e?.message || '');
    if (/invalid login|invalid credentials/i.test(m)) return 'That email/phone or password doesn’t look right.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Too many tries — please wait a moment and try again.';
    if (/failed to fetch|network/i.test(m)) return 'Can’t reach the server. Check your connection.';
    return m || 'Something went wrong. Please try again.';
  };
  const status = (msg, kind = '') => { const el = $('loginStatus'); el.textContent = msg; el.className = 'login-status' + (kind ? ' ' + kind : ''); };
  const busy = (btn, on, label) => { if (!btn) return; if (on) { btn.dataset.l = btn.innerHTML; btn.innerHTML = label; } else if (btn.dataset.l) { btn.innerHTML = btn.dataset.l; } btn.disabled = on; };

  // Only allow redirecting to a local .html page (no open redirects).
  function nextUrl() {
    const n = new URLSearchParams(location.search).get('next') || '';
    try { const u=new URL(n, location.origin); return u.origin===location.origin && /^\/(?:[a-z0-9_-]+|resources\/[a-z0-9_-]+|tools\/[a-z0-9_-]+)\.html$/i.test(u.pathname) ? u.pathname.replace(/^\//,'')+u.search+u.hash : 'index.html'; } catch { return 'index.html'; }
  }
  const done = () => { try{localStorage.removeItem(ATTEMPT_KEY)}catch{} status('Signed in — opening the archive…', 'ok'); setTimeout(() => location.assign(nextUrl()), 250); };

  // Account mode: sign in or create an account.
  function setAccountMode(name) {
    const signup = name === 'signup';
    $('tabSignIn').classList.toggle('active', !signup);
    $('tabSignUp').classList.toggle('active', signup);
    $('tabSignIn').setAttribute('aria-selected', String(!signup));
    $('tabSignUp').setAttribute('aria-selected', String(signup));
    $('signInArea').classList.toggle('hidden', signup);
    $('signUpPanel').classList.toggle('hidden', !signup);
    status('');
  }
  $('tabSignIn').addEventListener('click', () => setAccountMode('signin'));
  $('tabSignUp').addEventListener('click', () => setAccountMode('signup'));

  $('signUpPanel').addEventListener('submit', async e => {
    e.preventDefault();
    const email = String($('signupEmail').value || '').trim().toLowerCase();
    const password = $('signupPw').value;
    const confirm = $('signupConfirm').value;
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      status('Enter a valid email address.', 'error'); $('signupEmail').focus(); return;
    }
    if (password.length < 8) {
      status('Choose a password with at least 8 characters.', 'error'); $('signupPw').focus(); return;
    }
    if (password !== confirm) {
      status('The passwords do not match.', 'error'); $('signupConfirm').focus(); return;
    }
    if (!canAttempt()) return;
    recordAttempt();
    busy($('signupSubmit'), true, 'Creating account…'); status('');
    try {
      const result = await api('/auth/v1/signup', { method: 'POST', body: { email, password } });
      if (result?.access_token) {
        saveSession(result);
        done();
      } else {
        status('Account created. Check your email for a confirmation link, then return here to sign in.', 'ok');
        $('signupPw').value = ''; $('signupConfirm').value = '';
        setAccountMode('signin');
        $('loginId').value = email;
      }
    } catch (err) {
      const message = friendly(err);
      status(/already registered|already exists|user already/i.test(message)
        ? 'An account may already exist for this email. Try signing in or resetting your password.'
        : message, 'error');
    } finally { busy($('signupSubmit'), false); }
  });

  // Tabs
  function setTab(name) {
    const pw = name === 'password';
    $('tabPassword').classList.toggle('active', pw); $('tabCode').classList.toggle('active', !pw);
    $('tabPassword').setAttribute('aria-selected', String(pw)); $('tabCode').setAttribute('aria-selected', String(!pw));
    $('passwordPanel').classList.toggle('hidden', !pw); $('codePanel').classList.toggle('hidden', pw);
    status('');
  }
  $('tabPassword').addEventListener('click', () => setTab('password'));
  $('tabCode').addEventListener('click', () => setTab('code'));

  // Show / hide password
  $('pwToggle').addEventListener('click', () => {
    const input = $('loginPw'); const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    $('pwToggle').textContent = show ? 'Hide' : 'Show';
    $('pwToggle').setAttribute('aria-pressed', String(show));
    $('pwToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  // Password sign-in
  $('passwordPanel').addEventListener('submit', async e => {
    e.preventDefault();
    const id = normalize($('loginId').value), pw = $('loginPw').value;
    if (!id || !pw) { status('Enter your email or phone and your password.', 'error'); return; }
    if (!canAttempt()) return;
    recordAttempt();
    busy($('loginSubmit'), true, 'Signing in…'); status('');
    try {
      const body = id.includes('@') ? { email: id, password: pw } : { phone: id, password: pw };
      saveSession(await api('/auth/v1/token?grant_type=password', { method: 'POST', body }));
      done();
    } catch (err) { status(friendly(err), 'error'); busy($('loginSubmit'), false); }
  });

  // Forgot password (email only)
  $('forgotBtn').addEventListener('click', async () => {
    const id = normalize($('loginId').value);
    if (!id.includes('@')) { status('Type your email above first, then tap “Forgot password?”.', 'error'); $('loginId').focus(); return; }
    status('Sending a reset link…');
    try { await api('/auth/v1/recover', { method: 'POST', body: { email: id } }); status('If that email has an account, a reset link is on its way.', 'ok'); }
    catch (err) { status(friendly(err), 'error'); }
  });

  // One-time code
  $('sendCode').addEventListener('click', async () => {
    const id = normalize($('codeId').value);
    if (!id) { status('Enter your email or phone first.', 'error'); return; }
    busy($('sendCode'), true, 'Sending…'); status('');
    try { await api('/auth/v1/otp', { method: 'POST', body: id.includes('@') ? { email: id, create_user: false } : { phone: id, create_user: false } }); status('Code sent — check your email or SMS.', 'ok'); $('codeValue').focus(); }
    catch (err) { status(friendly(err), 'error'); }
    busy($('sendCode'), false);
  });
  $('verifyCode').addEventListener('click', async () => {
    const id = normalize($('codeId').value), token = $('codeValue').value.trim();
    if (!id || !token) { status('Enter your email/phone and the code.', 'error'); return; }
    busy($('verifyCode'), true, 'Verifying…'); status('');
    try {
      if (!canAttempt()) { busy($('verifyCode'), false); return; }
      recordAttempt();
      const body = id.includes('@') ? { type: 'email', email: id, token } : { type: 'sms', phone: id, token };
      saveSession(await api('/auth/v1/verify', { method: 'POST', body })); done();
    } catch (err) { status(friendly(err), 'error'); busy($('verifyCode'), false); }
  });

  // Already signed in?
  async function currentUser() {
    let s = loadSession(); if (!s?.access_token) return null;
    try { return await api('/auth/v1/user', { token: s.access_token }); }
    catch {
      if (!s.refresh_token) return null;
      try { s = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } }); saveSession(s); return s.user || null; }
      catch { return null; }
    }
  }
  $('signOut').addEventListener('click', async () => {
    const s = loadSession();
    try { if (s?.access_token) await api('/auth/v1/logout', { method: 'POST', token: s.access_token }); } catch {}
    localStorage.removeItem(SESSION_KEY);
    $('signedCard').classList.add('hidden'); $('loginCard').classList.remove('hidden'); status('You’ve been signed out.', 'ok');
  });
  (async () => {
    $('goDash').setAttribute('href', nextUrl());
    const u = await currentUser();
    if (u) { $('signedAs').textContent = u.email ? `Signed in as ${u.email}.` : 'Your session is active on this device.'; $('loginCard').classList.add('hidden'); $('signedCard').classList.remove('hidden'); $('goDash').textContent='Enter the archive →'; }
  })();
})();
