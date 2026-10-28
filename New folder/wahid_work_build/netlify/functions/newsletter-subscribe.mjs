const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
export default async (request)=>{
  const allowedOrigin='https://wahidsarchive.netlify.app';
  const origin=request.headers.get('origin')||'';
  const corsHeaders={'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if(request.method==='OPTIONS')return origin && origin!==allowedOrigin ? json(403,{error:'Origin not allowed.'}) : {statusCode:204,headers:corsHeaders};
  if(origin && origin!==allowedOrigin)return json(403,{error:'Origin not allowed.'});
  if(request.method!=='POST')return json(405,{error:'Method not allowed.'});
  const env=globalThis.Netlify?.env;
  const get=k=>env?.get?.(k)||process.env[k]||'';
  const base=get('SUPABASE_URL').replace(/\/$/,'');const key=get('SUPABASE_SERVICE_ROLE_KEY');
  if(!base||!key)return json(503,{error:'Email subscriptions are not configured yet. Please try again later.'});
  let data;try{data=JSON.parse(request.body||'{}')}catch{return json(400,{error:'Invalid request.'})}
  const email=String(data.email||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(400,{error:'Enter a valid email address.'});
  try{
    const r=await fetch(`${base}/rest/v1/newsletter_subscribers?on_conflict=email`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({email,active:true,updated_at:new Date().toISOString()})});
    if(!r.ok){const msg=await r.text();throw new Error(msg.includes('newsletter_subscribers')?'Subscription database is not ready. Run newsletter.sql in Supabase first.':'Could not save subscription.');}
    return {...json(200,{ok:true}),headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}};
  }catch(e){return json(500,{error:e.message||'Could not save subscription.'});}
};
