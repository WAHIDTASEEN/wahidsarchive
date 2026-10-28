(() => {
  const fmt = (n, digits = 4) => Number.isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:digits}) : '—';
  const val = id => Number(document.getElementById(id)?.value);
  const out = (id, html) => { const e=document.getElementById(id); if(e) e.innerHTML=html; };

  const kind=document.body.dataset.tool;
  if(kind==='manning') document.getElementById('calcTool')?.addEventListener('click',()=>{
    const n=val('n'), A=val('area'), R=val('radius'), S=val('slope');
    if([n,A,R,S].some(x=>!(x>0))) return out('result','Enter positive values for n, area, hydraulic radius and slope.');
    const q=(1/n)*A*Math.pow(R,2/3)*Math.sqrt(S);
    out('result',`Discharge Q = <strong>${fmt(q,5)} m³/s</strong><br><small>Using Manning’s equation Q = (1/n) A R^(2/3) S^(1/2).</small>`);
  });

  if(kind==='reynolds') document.getElementById('calcTool')?.addEventListener('click',()=>{
    const rho=val('rho'), v=val('velocity'), d=val('diameter'), mu=val('mu');
    if([rho,v,d,mu].some(x=>!(x>0))) return out('result','Enter positive values for density, velocity, diameter and viscosity.');
    const re=rho*v*d/mu;
    const regime=re<2300?'Laminar':re<=4000?'Transitional':'Turbulent';
    out('result',`Reynolds number Re = <strong>${fmt(re,1)}</strong><br>Flow classification: <strong>${regime}</strong><br><small>For pipe flow, the common reference ranges are Re &lt; 2300, 2300–4000 and &gt; 4000.</small>`);
  });

  if(kind==='concrete') document.getElementById('calcTool')?.addEventListener('click',()=>{
    const volume=val('volume'), unit=document.getElementById('unit')?.value, mix=document.getElementById('mix')?.value.split(',').map(Number);
    if(!(volume>0)) return out('result','Enter a concrete volume greater than zero.');
    const vM3=unit==='ft3'?volume/35.3146667:volume, dry=vM3*1.54, sum=mix.reduce((a,b)=>a+b,0), cementVol=dry*mix[0]/sum, sand=dry*mix[1]/sum, agg=dry*mix[2]/sum, bags=cementVol/0.0347;
    out('result',`Approximate materials for <strong>${fmt(vM3,3)} m³</strong>:<br>• Cement: <strong>${fmt(bags,1)} bags</strong><br>• Sand: <strong>${fmt(sand,3)} m³</strong><br>• Aggregate: <strong>${fmt(agg,3)} m³</strong><br><small>Uses a 1.54 dry-volume factor and nominal mix proportions. Check local specifications before construction.</small>`);
  });

  if(kind==='brickwork') document.getElementById('calcTool')?.addEventListener('click',()=>{
    const L=val('length'), H=val('height'), T=val('thickness');
    if([L,H,T].some(x=>!(x>0))) return out('result','Enter positive wall dimensions.');
    const wall=L*H*T, bricks=wall*500, mortarWet=wall*0.25, mortarDry=mortarWet*1.33, sum=1+6, cementVol=mortarDry/sum, sand=mortarDry*6/sum, bags=cementVol/0.0347;
    out('result',`Wall volume: <strong>${fmt(wall,3)} m³</strong><br>Approx. bricks: <strong>${Math.ceil(bricks).toLocaleString()}</strong><br>Approx. mortar: <strong>${fmt(mortarWet,3)} m³ wet</strong><br>Approx. cement: <strong>${fmt(bags,1)} bags</strong><br>Approx. sand: <strong>${fmt(sand,3)} m³</strong><br><small>Illustrative estimator using 500 bricks/m³ and a 1:6 cement:sand mortar assumption. Verify brick size, joint thickness and specification.</small>`);
  });

  if(kind==='converter') document.getElementById('calcTool')?.addEventListener('click',()=>{
    const x=val('value'), from=document.getElementById('from')?.value, to=document.getElementById('to')?.value;
    const groups={length:{m:1,ft:.3048,in:.0254,mm:.001},pressure:{pa:1,kpa:1000},force:{n:1,kn:1000},volume:{m3:1,l:.001}};
    const groupOf=u=>Object.keys(groups).find(g=>u in groups[g]); const gf=groupOf(from), gt=groupOf(to);
    if(!Number.isFinite(x)||!gf||gf!==gt) return out('result','Choose units from the same measurement family.');
    const converted=x*groups[gf][from]/groups[gt][to]; out('result',`<strong>${fmt(converted,8)}</strong> ${to}<br><small>${fmt(x,8)} ${from} = ${fmt(converted,8)} ${to}</small>`);
  });
})();
