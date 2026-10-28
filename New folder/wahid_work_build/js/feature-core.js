(() => {
  const esc = window.WahidSite?.esc || (v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])));
  const key='wahid-favorites';
  const get=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};
  const save=a=>localStorage.setItem(key,JSON.stringify([...new Set(a)]));
  window.WahidFeatures={
    favorite(id){const a=get();const i=a.indexOf(String(id));if(i>=0)a.splice(i,1);else a.push(String(id));save(a);return a.includes(String(id));},
    isFavorite(id){return get().includes(String(id));}, favorites:get,
    toggleButton(btn){const id=btn.dataset.favoriteId;if(!id)return;const on=this.favorite(id);btn.classList.toggle('active',on);btn.textContent=on?'♥ Saved':'♡ Save';},
    share(url=location.href){if(navigator.share)return navigator.share({title:document.title,url});return navigator.clipboard?.writeText(url).then(()=>true).catch(()=>false)},
    async track(type,meta={}){try{await WahidPublic.request('site_events',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({event_type:type,path:location.pathname,metadata:meta})})}catch{}},
    initFavorites(){document.addEventListener('click',e=>{const b=e.target.closest('[data-favorite-id]');if(b)this.toggleButton(b);});document.querySelectorAll('[data-favorite-id]').forEach(b=>{const on=this.isFavorite(b.dataset.favoriteId);b.classList.toggle('active',on);b.textContent=on?'♥ Saved':'♡ Save';});}
  };
  window.WahidFeatures.initFavorites();
})();
