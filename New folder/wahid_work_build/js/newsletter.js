(()=>{
  const form=document.getElementById('newsletterForm');
  if(!form)return;
  const email=document.getElementById('newsletterEmail');
  const status=document.getElementById('newsletterStatus');
  const button=form.querySelector('button[type="submit"]');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const value=String(email?.value||'').trim().toLowerCase();
    if(!value||!email.checkValidity()){status.textContent='Enter a valid email address.';status.className='newsletter-status error';return;}
    button.disabled=true;button.setAttribute('aria-busy','true');status.textContent='Subscribing…';status.className='newsletter-status';
    try{
      const res=await fetch('/.netlify/functions/newsletter-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:value})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Subscription could not be saved. Please try again.');
      status.textContent='You’re subscribed. New materials will be emailed to you.';status.className='newsletter-status success';form.reset();
    }catch(err){status.textContent=err.message||'Could not subscribe right now.';status.className='newsletter-status error';}
    finally{button.disabled=false;button.removeAttribute('aria-busy');}
  });
})();
