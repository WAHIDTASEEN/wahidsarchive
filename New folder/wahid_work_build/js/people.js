/* PEOPLE DIRECTORY
   Add or remove people by editing the PEOPLE array below.
   Each person can have: name, role, phone, photo, bio and active.
   Set active:false to hide someone without deleting their entry.
*/
(() => {
  const PEOPLE = [
    {
      id: 'friend-assistant',
      active: true,
      name: 'Friend + Assistant',
      role: 'Project Collaborator',
      phone: '01742256153',
      photo: 'assets/friend.jpg',
      bio: 'Working alongside Wahid on selected projects and ideas.'
    }
    // Add another person like this:
    // ,{
    //   id: 'person-02',
    //   active: true,
    //   name: 'Full Name',
    //   role: 'Project Partner',
    //   phone: '01XXXXXXXXX',
    //   photo: 'assets/people/person-02.jpg',
    //   bio: 'Short description.'
    // }
  ];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const wa = n => { const d=String(n||'').replace(/\D/g,''); if(!d)return ''; const x=d.startsWith('0')?'88'+d:d.startsWith('880')?d:'88'+d; return `https://wa.me/${x}`; };
  const tel = n => { const d=String(n||'').replace(/\D/g,''); if(!d)return ''; const x=d.startsWith('0')?'+880'+d.slice(1):d.startsWith('880')?'+'+d:'+'+d; return `tel:${x}`; };
  const grid=document.getElementById('peopleGrid'); if(!grid)return;
  async function render(){
    let people=PEOPLE;
    try{
      if(window.WahidPublic){
        const rows=await window.WahidPublic.request('site_settings?select=key,value&key=eq.people');
        if(rows?.[0]?.value){const remote=JSON.parse(rows[0].value);if(Array.isArray(remote))people=remote;}
      }
    }catch(e){ console.warn('People directory fallback:',e.message); }
    const active=people.filter(p=>p.active!==false);
    grid.innerHTML=active.map((p,i)=>`<article class="person-card"><div class="person-photo"><img src="${esc(p.photo||'')}" alt="${esc(p.name)}" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"><span class="person-fallback">${esc((p.name||'P').trim().charAt(0).toUpperCase())}</span><small>${String(i+1).padStart(2,'0')}</small></div><div class="person-copy"><span class="person-role">${esc(p.role||'Collaborator')}</span><h2>${esc(p.name)}</h2><p>${esc(p.bio||'')}</p><div class="person-actions">${p.phone?`<a class="line-btn" href="${tel(p.phone)}">Call ↗</a><a class="gold-btn" href="${wa(p.phone)}" target="_blank" rel="noopener">WhatsApp ↗</a>`:''}</div></div></article>`).join('') || '<div class="people-empty">No collaborators are currently listed.</div>';
  }
  render();
})();
