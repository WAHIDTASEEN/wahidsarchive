(()=>{
  const $=id=>document.getElementById(id);
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}
    }),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));

  $('newsletterForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const field=$('newsletterEmail'), msg=$('newsletterFeedback'), email=field?.value.trim()||'';
    if(!field||!field.checkValidity()||!email){if(msg)msg.textContent='Enter a valid email address.';return;}
    if(msg)msg.textContent='Newsletter sign-up is not connected yet.';
    e.target.reset();
  });

  async function stats(){
    try{
      if(window.WahidPublic?.request){
        const rows=await window.WahidPublic.request('works?select=id,course_code&published=eq.true');
        if(Array.isArray(rows)){
          if($('statDocuments'))$('statDocuments').textContent=String(rows.length).padStart(2,'0')+'+';
          const courses=new Set(rows.map(row=>String(row.course_code||'').trim()).filter(Boolean));
          if($('statResources'))$('statResources').textContent=String(courses.size||rows.length).padStart(2,'0')+'+';
        }
      }
    }catch{}
  }
  stats();
})();
