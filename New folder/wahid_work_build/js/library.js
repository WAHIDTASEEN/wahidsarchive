const {$,esc}=window.WahidSite;
const params=new URLSearchParams(location.search);
const selectedId=params.get('id');
let works=[];
let active=(params.get('category')||'').split(',').filter(Boolean);
let activeCourse=params.get('course')||'';
let activeYear='';
let sortMode='newest';
const fileUrl=w=>{
  if(w?.file_url) return w.file_url;
  if(w?.storage_path && window.SUPABASE_URL) return `${String(window.SUPABASE_URL).replace(/\/$/,'')}/storage/v1/object/public/documents/${w.storage_path.split('/').map(encodeURIComponent).join('/')}`;
  return '';
};
const fileType=w=>{const name=String(w.storage_path||w.file_url||'').split('?')[0];const ext=name.includes('.')?name.split('.').pop().toUpperCase():'FILE';return ext.slice(0,5)};
const courseLabel=w=>[w.course_code,w.course_name||w.course].filter(Boolean).join(' · ')||'Unassigned course';
const detailUrl=id=>`work.html?id=${encodeURIComponent(id)}`;
const card=w=>`<article class="material-card">${['Lab Report','Assignment','Project'].includes(w.category)&&w.cover_url?`<div class="material-cover"><img src="${esc(w.cover_url)}" alt="${esc(w.title||'Academic work')} cover" loading="lazy"></div>`:''}<div><div class="material-top"><span class="badge">${esc(w.category||'Other')}</span><div class="material-top-right"><small>${esc(fileType(w))} · ${w.work_date?new Date(w.work_date+'T00:00:00').toLocaleDateString(undefined,{month:'short',year:'numeric'}):''}</small>${w.status&&['Lab Report','Assignment','Project'].includes(w.category)?`<span class="showcase-badge ${w.status==='Completed'?'completed':'progress'}">${esc(w.status)}</span>`:''}</div></div><h3>${esc(w.title||'Untitled work')}</h3><div class="course">${esc(courseLabel(w))}</div>${w.description?`<p class="desc">${esc(w.description)}</p>`:''}</div><div class="material-bottom"><small>${esc(w.category||'Other')}</small><div class="card-actions"><a class="open-link" href="${detailUrl(w.id)}">Open →</a></div></div></article>`;
function renderStats(){
  const count=$('statWorks');if(count)count.textContent=works.length;
  const courses=$('statCourses');if(courses){const keys=new Set(works.map(w=>`${(w.course_code||'').trim()}|${(w.course_name||w.course||'').trim()}`).filter(x=>x!=='|'));courses.textContent=keys.size;}
  const cats=$('statCategories');if(cats)cats.textContent=new Set(works.map(w=>w.category||'Other')).size;
  const years=[...new Set(works.map(w=>{const d=w.work_date||w.created_at;return d?String(d).slice(0,4):''}).filter(y=>/^\d{4}$/.test(y)))].sort((a,b)=>b.localeCompare(a));
  const select=$('yearFilter');if(select){const old=activeYear;select.innerHTML='<option value="">All years</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');select.value=old;}
}
function renderCourses(){
  const wrap=$('courseDirectory'); if(!wrap)return;
  const map=new Map();
  works.forEach(w=>{const code=(w.course_code||'').trim();const name=(w.course_name||w.course||'').trim();const key=(code+'|'+name).toLowerCase();if(!code&&!name)return;if(!map.has(key))map.set(key,{code,name,count:0});map.get(key).count++;});
  const arr=[...map.values()].sort((a,b)=>(a.code||a.name).localeCompare(b.code||b.name));
  wrap.innerHTML=arr.map(c=>`<button class="course-tile ${activeCourse.toLowerCase()===(c.code+'|'+c.name).toLowerCase()?'active':''}" type="button" data-course="${esc(c.code+'|'+c.name)}"><strong>${esc(c.code||'COURSE')}</strong><span>${esc(c.name||'Course materials')}</span><small>${c.count} ${c.count===1?'document':'documents'}</small></button>`).join('');
  wrap.querySelectorAll('.course-tile').forEach(b=>b.addEventListener('click',()=>{const next=b.dataset.course||'';activeCourse=activeCourse.toLowerCase()===next.toLowerCase()?'':next;syncListUrl();renderCourses();render();}));
}
function syncListUrl(){const q=new URLSearchParams();if(active.length)q.set('category',active.join(','));if(activeCourse)q.set('course',activeCourse);const u=`work.html${q.toString()?'?'+q.toString():''}`;history.replaceState({},'',u);}
function render(){
  const q=($('librarySearch')?.value||'').toLowerCase().trim();
  let arr=works.filter(w=>{
    const year=String(w.work_date||w.created_at||'').slice(0,4);
    return (!active.length||active.includes(w.category))&&(!activeCourse||`${w.course_code||''}|${w.course_name||w.course||''}`.toLowerCase()===activeCourse.toLowerCase())&&(!activeYear||year===activeYear)&&`${w.title||''} ${w.course||''} ${w.course_name||''} ${w.course_code||''} ${w.description||''} ${w.category||''}`.toLowerCase().includes(q);
  });
  arr.sort((a,b)=>{if(sortMode==='title')return String(a.title||'').localeCompare(String(b.title||''));const da=Date.parse(a.work_date||a.created_at||'')||0,db=Date.parse(b.work_date||b.created_at||'')||0;return sortMode==='oldest'?da-db:db-da;});
  const grid=$('libraryGrid');const browsing=!!active.length||!!activeCourse||!!activeYear||!!q;if(grid)grid.innerHTML=arr.map(card).join('');
  $('libraryEmpty')?.classList.toggle('hidden',arr.length!==0||!browsing);
  if($('libraryEmpty')&&!browsing)$('libraryEmpty').textContent='';
  const results=$('resultsCount');if(results)results.innerHTML=`Showing <strong>${arr.length}</strong> ${arr.length===1?'document':'documents'}`;const summary=$('resultsSummary');if(summary)summary.textContent=works.length?`${works.length} published resources`:'';const label=$('selectedCourseLabel');if(label)label.textContent=activeCourse?`Selected: ${activeCourse.replace('|',' · ')}`:'';
}
function errorBox(e){const grid=$('libraryGrid');if(grid)grid.innerHTML=`<div class="empty" style="display:block;grid-column:1/-1"><strong>We couldn't load the archive.</strong><br><small>${esc(e.message||'Unknown error')}</small><br><button id="retryWorks" class="chip" type="button">Retry</button></div>`;$('retryWorks')?.addEventListener('click',load);}
async function load(){try{const [data,coverRows]=await Promise.all([WahidPublic.request('works?select=id,title,course,course_code,course_name,category,description,work_date,file_url,storage_path,created_at&published=eq.true&order=work_date.desc.nullslast,created_at.desc'),WahidPublic.request('site_settings?select=value&key=eq.work_covers&limit=1')]);let covers={};try{covers=JSON.parse(coverRows?.[0]?.value||'{}')||{}}catch{}works=(Array.isArray(data)?data:[]).map(w=>({...w,...(covers[w.id]||{})}));try{localStorage.setItem('wahid-work-cache',JSON.stringify(works))}catch{}renderStats();renderCourses();render();if(!works.length){$('libraryGrid').innerHTML='';}}catch(e){try{works=JSON.parse(localStorage.getItem('wahid-work-cache')||'[]');if(works.length){renderStats();renderCourses();render();$('libraryEmpty').textContent='Offline mode: showing your last cached library.';return}}catch{}errorBox(e)}}
function setDetailSEO(w){
  const course=courseLabel(w), title=`${w.title||'Academic Work'} — Work`;
  document.title=title;
  const description=(w.description||`${w.category||'Academic material'} from ${course}. Published in Wahid's academic archive.`).replace(/\s+/g,' ').slice(0,155);
  let m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}m.content=description;
  let c=document.querySelector('link[rel="canonical"]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href=new URL(detailUrl(w.id),location.href).href;
  const ld={"@context":"https://schema.org","@type":"CreativeWork","name":w.title||'Academic Work','description':description,'author':{'@type':'Person','name':'Wahid'},'isPartOf':{'@type':'CollectionPage','name':"Work",'url':new URL('work.html',location.href).href}};
  if(w.work_date)ld.datePublished=w.work_date;
  if(w.file_url)ld.url=w.file_url;
  let s=document.querySelector('#workStructuredData');if(!s){s=document.createElement('script');s.id='workStructuredData';s.type='application/ld+json';document.head.appendChild(s)}s.textContent=JSON.stringify(ld);
}
function relatedMarkup(w){
  const same=works.filter(x=>String(x.id)!==String(w.id)&&((w.course_code&&x.course_code===w.course_code)||(w.course_name&&x.course_name===w.course_name)||x.category===w.category)).slice(0,4);
  return same.length?`<section class="related-work"><div class="section-heading"><div><span class="eyebrow"><span></span> CONTINUE</span><h2>Related <i>work.</i></h2></div></div><div class="related-grid">${same.map(x=>`<a class="related-card" href="${detailUrl(x.id)}"><span>${esc(x.category||'Other')}</span><strong>${esc(x.title||'Untitled work')}</strong><small>${esc(courseLabel(x))}</small><b>Open →</b></a>`).join('')}</div></section>`:'';
}
async function detail(id){const box=$('libraryGrid');try{const rows=await WahidPublic.request(`works?select=id,title,course,course_code,course_name,category,description,work_date,file_url,storage_path,created_at&published=eq.true&id=eq.${encodeURIComponent(id)}&limit=1`);const w=rows?.[0];if(!w){box.innerHTML='<div class="empty" style="display:block"><strong>Material not found.</strong><br><small>This material may be unpublished or the link is invalid.</small><br><a class="line-btn" href="work.html">← Back to archive</a></div>';return}try{const cr=await WahidPublic.request('site_settings?select=value&key=eq.work_covers&limit=1');const cm=JSON.parse(cr?.[0]?.value||'{}')||{};Object.assign(w,cm[w.id]||{})}catch{}setDetailSEO(w);const url=fileUrl(w);const actions=url?`<a class="gold-btn" href="${esc(url)}" target="_blank" rel="noopener">Open file ↗</a><a class="line-btn" href="${esc(url)}" download>Download</a><button class="line-btn" id="shareWork" type="button">Copy link</button>`:'<span class="line-btn">File link unavailable</span>';const preview=url?`<div class="viewer-head"><strong>Document preview</strong><span>${esc(fileType(w))}</span></div><iframe class="pdf-frame" src="${esc(url)}" title="${esc(w.title)}" loading="lazy"></iframe>`:'<div class="empty" style="margin-top:15px">This record does not have a public file URL yet.</div>';box.innerHTML=`<article class="work-detail"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><a href="work.html">Work</a><span>›</span><span>${esc(w.category||'Material')}</span></nav>${w.cover_url?`<div class="work-detail-cover"><img src="${esc(w.cover_url)}" alt="${esc(w.title||'Academic work')} cover"></div>`:''}<div class="work-meta"><span class="badge">${esc(w.category||'Other')}</span>${w.status&&['Lab Report','Assignment','Project'].includes(w.category)?`<span class="showcase-badge ${w.status==='Completed'?'completed':'progress'}">${esc(w.status)}</span>`:''}<span>${esc(courseLabel(w))}</span><span>${w.work_date?esc(new Date(w.work_date+'T00:00:00').toLocaleDateString()):''}</span></div><h1>${esc(w.title)}</h1>${w.description?`<p class="work-description">${esc(w.description)}</p>`:''}<div class="work-actions">${actions}<a class="line-btn" href="work.html">← Archive</a></div>${preview}<div id="relatedSlot"></div></article>`;document.getElementById('shareWork')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);const b=$('shareWork');if(b){b.textContent='Copied ✓';setTimeout(()=>b.textContent='Copy link',1400)}}catch{}});try{const [all,cr]=await Promise.all([WahidPublic.request('works?select=id,title,course,course_code,course_name,category,description,work_date,file_url,storage_path,created_at&published=eq.true&order=work_date.desc.nullslast,created_at.desc'),WahidPublic.request('site_settings?select=value&key=eq.work_covers&limit=1')]);let cm={};try{cm=JSON.parse(cr?.[0]?.value||'{}')||{}}catch{}works=(Array.isArray(all)?all:[]).map(x=>({...x,...(cm[x.id]||{})}));$('relatedSlot').innerHTML=relatedMarkup(w)}catch{}}catch(e){box.innerHTML=`<div class="empty" style="display:block"><strong>Unable to load this material.</strong><br><small>${esc(e.message)}</small><br><a class="line-btn" href="work.html">← Back to archive</a></div>`}}
function init(){
  if(selectedId){$('librarySearch')?.closest('.archive-tools')?.classList.add('hidden');$('courseSection')?.classList.add('hidden');$('libraryOverview')?.classList.add('hidden');$('libraryBrowseNote')?.classList.add('hidden');$('resultsCount')?.classList.add('hidden');$('pageTitle')?.replaceChildren(document.createTextNode('Material'));$('pageSub')?.replaceChildren(document.createTextNode(''));const mark=document.querySelector('.library-hero-mark');if(mark)mark.classList.add('hidden');detail(selectedId);return;}
  $('librarySearch')?.addEventListener('input',render);
  $('yearFilter')?.addEventListener('change',e=>{activeYear=e.target.value;render()});
  $('sortWorks')?.addEventListener('change',e=>{sortMode=e.target.value;render()});
  $('clearCourse')?.addEventListener('click',()=>{activeCourse='';syncListUrl();renderCourses();render()});
  document.querySelectorAll('#libraryFilters .chip').forEach(b=>{b.classList.toggle('active',active.includes(b.dataset.cat));b.addEventListener('click',()=>{const cat=b.dataset.cat;if(active.includes(cat))active=active.filter(x=>x!==cat);else active.push(cat);b.classList.toggle('active',active.includes(cat));syncListUrl();render()})});
  $('clearFilters')?.addEventListener('click',()=>{active=[];activeCourse='';activeYear='';sortMode='newest';if($('librarySearch'))$('librarySearch').value='';if($('yearFilter'))$('yearFilter').value='';if($('sortWorks'))$('sortWorks').value='newest';document.querySelectorAll('#libraryFilters .chip').forEach(x=>x.classList.remove('active'));syncListUrl();renderCourses();render()});
  load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
