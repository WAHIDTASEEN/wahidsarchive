(async()=>{
  const $=id=>document.getElementById(id),esc=window.WahidSite.esc;
  const fallback=[];
  const pct=v=>Math.max(0,Math.min(100,Number(v)||0));
  let data=fallback;
  try{const r=await WahidPublic.request('site_settings?select=key,value&key=eq.projects');if(r?.[0]?.value)data=JSON.parse(r[0].value)}catch{}
  const people=[];try{const r=await WahidPublic.request('site_settings?select=value&key=eq.people');people.push(...JSON.parse(r?.[0]?.value||'[]'))}catch{}
  const grid=$('projectGrid');
  const visible=(Array.isArray(data)?data:[]).filter(x=>x.active!==false);
  grid.innerHTML=visible.map((p,i)=>{
    const progress=pct(p.progress);
    const cover=p.cover_url||'';
    return `<article class="showcase-card project-progress-card">
      ${cover?`<div class="project-cover"><img src="${esc(cover)}" alt="${esc(p.title||'Project')} cover" loading="lazy"></div>`:''}
      <div class="showcase-number">${String(i+1).padStart(2,'0')}</div>
      <div class="project-card-head"><span class="badge">${esc(p.status||p.year||'Academic project')}</span><span class="project-percent">${progress}%</span></div>
      <h2>${esc(p.title||'Untitled project')}</h2>
      <p>${esc(p.description||'')}</p>
      <div class="tag-row">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
      <div class="project-progress-block"><div class="progress-label"><span>Progress</span><strong>${progress}%</strong></div><div class="progress-track"><span style="width:${progress}%"></span></div></div>
      <div class="contributors"><strong>Contributors</strong><div>${(p.contributors||[]).map(n=>{const person=people.find(x=>x.name===n);return `<span class="person-mini">${person?.photo?`<img src="${esc(person.photo)}" alt="">`:''}${esc(n)}</span>`}).join('')}</div></div>
      ${p.link?`<a class="small-gold" href="${esc(p.link)}" target="_blank" rel="noopener">Open project ↗</a>`:''}
    </article>`;
  }).join('')||'<div class="empty" style="grid-column:1/-1">No active projects right now. Add one from the private dashboard when work begins.</div>';
})();
