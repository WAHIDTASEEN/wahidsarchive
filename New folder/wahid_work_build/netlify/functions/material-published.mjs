const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
export default async request=>{
 if(request.method!=='POST')return json(405,{error:'Method not allowed.'});
 const get=k=>globalThis.Netlify?.env?.get?.(k)||process.env[k]||'';const base=get('SUPABASE_URL').replace(/\/$/,'');const key=get('SUPABASE_SERVICE_ROLE_KEY');const resend=get('RESEND_API_KEY');const adminId=get('NEWSLETTER_ADMIN_USER_ID');const from=get('NEWSLETTER_FROM');
 if(!base||!key||!resend||!adminId||!from)return json(503,{error:'Email notifications are not configured.'});
 const auth=request.headers.get('authorization')||'';const token=auth.replace(/^Bearer\s+/i,'');if(!token)return json(401,{error:'Sign in required.'});
 const userRes=await fetch(`${base}/auth/v1/user`,{headers:{apikey:get('SUPABASE_ANON_KEY')||key,Authorization:`Bearer ${token}`}});if(!userRes.ok)return json(401,{error:'Invalid session.'});const user=await userRes.json();if(user.id!==adminId)return json(403,{error:'Not authorized.'});
 let d;try{d=JSON.parse(request.body||'{}')}catch{return json(400,{error:'Invalid request.'})}const title=String(d.title||'').trim().slice(0,200),course=String(d.course||'').trim().slice(0,200),url=new URL('/work.html',request.url).href;if(!title)return json(400,{error:'Material title required.'});
 try{const subs=await fetch(`${base}/rest/v1/newsletter_subscribers?select=email,unsubscribe_token&active=eq.true`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});if(!subs.ok)throw new Error('Could not load subscribers.');const list=await subs.json();let sent=0,failed=0;
  for(const sub of list){const unsub=new URL('/.netlify/functions/newsletter-unsubscribe',request.url);unsub.searchParams.set('token',sub.unsubscribe_token);const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17152a"><h2>New material on Wahid’s Archive</h2><p><strong>${title.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</strong></p><p>${course.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p><p><a href="${url}">Open the Library</a></p><hr><p style="font-size:12px;color:#666">You received this because you subscribed to new-material updates. <a href="${unsub.href}">Unsubscribe</a></p></div>`;
   const send=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[sub.email],subject:`New material: ${title}`,html})});if(send.ok)sent++;else failed++;
  }
  return json(200,{ok:true,sent,failed});
 }catch(e){return json(500,{error:e.message||'Notification delivery failed.'})}
};
