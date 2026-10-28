(()=>{
  const $=id=>document.getElementById(id);
  const esc=window.WahidSite?.esc||String;
  const fallback=[];
  const pct=v=>Math.max(0,Math.min(100,Number(v)||0));
  const projectCard=p=>{
    const progress=pct(p.progress);
    const cover=p.cover_url||'';
    return `<article class="progress-project-card ${p.active===false?'is-muted':''}">
      ${cover?`<div class="progress-cover"><img src="${esc(cover)}" alt="${esc(p.title||'Project')} cover" loading="lazy"></div>`:`<div class="progress-cover progress-cover-fallback"><span>PROJECT</span></div>`}
      <div class="progress-card-body">
        <div class="progress-card-top"><span class="progress-status">${esc(p.status||'In progress')}</span><span>${esc(p.year||'')}</span></div>
        <h3>${esc(p.title||'Untitled project')}</h3>
        <p>${esc(p.description||'Academic project in progress.')}</p>
        ${(p.tags||[]).length?`<div class="progress-tags">${p.tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
        <div class="progress-label"><span>Progress</span><strong>${progress}%</strong></div>
        <div class="progress-track" aria-label="${progress}% complete"><span style="width:${progress}%"></span></div>
      </div>
    </article>`;
  };
  async function load(){
    const section=$('projectProgressSection'),grid=$('homeProjectProgress');
    if(!section||!grid)return;
    try{
      const rows=await WahidPublic.request('site_settings?select=value&key=eq.projects&limit=1');
      let projects=[]; try{projects=JSON.parse(rows?.[0]?.value||'[]')}catch{}
      projects=(Array.isArray(projects)?projects:[]).filter(p=>p.active!==false).slice(0,4);
      if(!projects.length){section.classList.add('hidden');return;}
      grid.innerHTML=projects.map(projectCard).join('');
    }catch{section.classList.add('hidden')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
