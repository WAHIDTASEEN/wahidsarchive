(()=>{
  const $=id=>document.getElementById(id);
  const nums=s=>{const text=String(s||'').trim();return text?text.split(/[\s,;]+/).map(Number):[]};
  const escXml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  function calc(a,b){
    const n=a.length,m=a.reduce((x,y)=>x+y,0)/n,ym=b.reduce((x,y)=>x+y,0)/n;
    let ss=0,sp=0,sy=0;for(let i=0;i<n;i++){ss+=(a[i]-m)**2;sp+=(a[i]-m)*(b[i]-ym);sy+=(b[i]-ym)**2}
    const slope=ss?sp/ss:0,inter=ym-slope*m,r2=sy&&ss?sp*sp/(ss*sy):1;return{slope,inter,r2}
  }
  function transformed(x,y,scale){
    if(scale==='loglog')return[x.map(v=>Math.log10(v)),y.map(v=>Math.log10(v))];
    if(scale==='semilogx')return[x.map(v=>Math.log10(v)),y];
    if(scale==='semilogy')return[x,y.map(v=>Math.log10(v))];
    return[x,y]
  }
  function niceStep(range,target=5){
    if(!Number.isFinite(range)||range<=0)return 1;
    const raw=range/target,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;
    return (f<=1?1:f<=2?2:f<=5?5:10)*p;
  }
  function fmt(v){
    if(Math.abs(v)<1e-10)return '0';
    if(Math.abs(v)>=10000||Math.abs(v)<0.001)return v.toExponential(1).replace('e+','e');
    return Number(v.toPrecision(4)).toString();
  }
  function linearTicks(min,max,forceZero=false){
    if(forceZero && min>=0) min=0;
    const step=niceStep(max-min,5),lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step;
    const vals=[];for(let v=lo,n=0;v<=hi+step*1e-6&&n<30;v+=step,n++)vals.push(Number(v.toPrecision(12)));
    return {min:lo,max:hi,vals};
  }
  function logTicks(min,max){
    // Work in log10 coordinates, but label ticks with the real engineering values.
    // Major ticks are powers of ten; minor ticks 2–9 are included within each decade.
    let lo=Math.floor(min),hi=Math.ceil(max);
    if(hi-lo<1){lo=Math.floor(min);hi=lo+1}
    const ticks=[];
    for(let p=lo;p<=hi;p++){
      for(let m=1;m<=9;m++){
        const pos=p+Math.log10(m);
        if(pos<lo-1e-9||pos>hi+1e-9)continue;
        ticks.push({pos,label:fmt(m*Math.pow(10,p)),major:m===1});
      }
    }
    return {min:lo,max:hi,vals:ticks};
  }
  let lastPlot=null, selectedSlopePoints=[];
  function queriedValues(x,y,scale){
    const want=nums($('gqueryx')?.value);if(!want.length)return [];
    const logX=scale==='loglog'||scale==='semilogx',logY=scale==='loglog'||scale==='semilogy';
    const pts=x.map((vx,i)=>({x:vx,y:y[i],tx:logX?Math.log10(vx):vx,ty:logY?Math.log10(y[i]):y[i]})).sort((a,b)=>a.x-b.x);
    return want.map(q=>{
      if((logX||logY)&&q<=0)return {x:q,error:'Log scales require positive values.'};
      if(q<pts[0].x||q>pts[pts.length-1].x)return {x:q,error:`Outside plotted X range (${fmt(pts[0].x)}–${fmt(pts[pts.length-1].x)}).`};
      const exact=pts.find(p=>Math.abs(p.x-q)<=Math.max(1,Math.abs(q))*1e-10);if(exact)return {x:q,y:exact.y,tx:exact.tx,ty:exact.ty,exact:true};
      let i=0;while(i<pts.length-1&&pts[i+1].x<q)i++;const a=pts[i],b=pts[i+1],t=((logX?Math.log10(q):q)-a.tx)/(b.tx-a.tx||1),ty=a.ty+t*(b.ty-a.ty),yy=logY?Math.pow(10,ty):ty;
      return {x:q,y:yy,tx:logX?Math.log10(q):q,ty,exact:false};
    });
  }
  function showQueryResults(values){
    const el=$('queryReadout');if(!el)return;
    if(!values.length){el.innerHTML='';return;}
    el.innerHTML=values.map(v=>v.error?`<div class="graph-query-row"><span>X = ${fmt(v.x)}</span><span>${v.error}</span></div>`:`<div class="graph-query-row"><span>X = <strong>${fmt(v.x)}</strong></span><span>Y = <strong>${fmt(v.y)}</strong><br><small>${v.exact?'Exact measured point':'Interpolated estimate'}</small></span></div>`).join('');
  }
  function drawCatmullRom(ctx,points){
    if(points.length<2)return;
    ctx.beginPath();ctx.moveTo(points[0].px,points[0].py);
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      ctx.bezierCurveTo(p1.px+(p2.px-p0.px)/6,p1.py+(p2.py-p0.py)/6,p2.px-(p3.px-p1.px)/6,p2.py-(p3.py-p1.py)/6,p2.px,p2.py);
    }
    ctx.stroke();
  }
  function padGridX(){return 35}
  function draw(){
    const x=nums($('gx').value),y=nums($('gy').value),scale=$('gscale').value,plotType=$('gplottype')?.value||'points-line',c=$('graphCanvas'),ctx=c.getContext('2d');
    if(x.length===0&&y.length===0){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#061127';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(110,133,190,.12)';ctx.lineWidth=1;for(let xx=padGridX(),i=0;xx<c.width-25;xx+=55,i++){ctx.beginPath();ctx.moveTo(xx,20);ctx.lineTo(xx,c.height-30);ctx.stroke()}for(let yy=25;yy<c.height-20;yy+=45){ctx.beginPath();ctx.moveTo(20,yy);ctx.lineTo(c.width-20,yy);ctx.stroke()}ctx.fillStyle='#8d9bc1';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='16px Arial';ctx.fillText('Your graph will appear here',c.width/2,c.height/2);if($('graphResult'))$('graphResult').textContent='Enter at least two matching X/Y values to begin.';if($('previewTitle'))$('previewTitle').textContent=$('gtitle')?.value.trim()||'';if($('pointReadout'))$('pointReadout').textContent='';lastPlot=null;showQueryResults([]);return null}
    if(x.some(v=>!Number.isFinite(v))||y.some(v=>!Number.isFinite(v))){$('graphResult').textContent='Use valid numbers only, separated by commas. Check for empty values or text.';return null}
    if(x.length!==y.length||x.length<2){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#061127';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#aab6d6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='18px Arial';if($('graphResult'))$('graphResult').textContent='';if($('previewTitle'))$('previewTitle').textContent=$('gtitle')?.value.trim()||'';if($('pointReadout'))$('pointReadout').textContent='';lastPlot=null;showQueryResults([]);return null}
    if(scale!=='linear'&&(x.some(v=>v<=0)||y.some(v=>v<=0))){$('graphResult').textContent='Log scales require every X and Y value to be positive. Choose Linear or correct the data.';lastPlot=null;return null}
    const raw=x.map((vx,i)=>({x:vx,y:y[i],index:i}));
    const sorted=[...raw].sort((a,b)=>a.x-b.x);
    const [tx,ty]=transformed(x,y,scale),r=calc(tx,ty);
    const logX=scale==='loglog'||scale==='semilogx',logY=scale==='loglog'||scale==='semilogy';
    const xr=logX?logTicks(Math.min(...tx),Math.max(...tx)):linearTicks(Math.min(...tx),Math.max(...tx),true);
    const yr=logY?logTicks(Math.min(...ty),Math.max(...ty)):linearTicks(Math.min(...ty),Math.max(...ty),true);
    const minx=xr.min,maxx=xr.max,miny=yr.min,maxy=yr.max;
    const padL=102,padR=34,padT=46,padB=78;
    const sx=v=>padL+(v-minx)/(maxx-minx||1)*(c.width-padL-padR),sy=v=>c.height-padB-(v-miny)/(maxy-miny||1)*(c.height-padT-padB);
    const css=getComputedStyle(document.body),canvasBg='#061127',ink='#cbd5f5',muted='#8f9fc6',grid='rgba(118,139,198,.23)',minorGrid='rgba(118,139,198,.10)',series='#b45cff';
    ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=canvasBg;ctx.fillRect(0,0,c.width,c.height);
    ctx.textBaseline='middle';ctx.font='14px Arial';
    xr.vals.forEach(t=>{const v=logX?t.pos:t,xx=sx(v),major=logX?t.major:true;ctx.strokeStyle=major?grid:minorGrid;ctx.lineWidth=major?1:0.7;ctx.beginPath();ctx.moveTo(xx,padT);ctx.lineTo(xx,c.height-padB);ctx.stroke();if(major||!logX){ctx.fillStyle=muted;ctx.textAlign='center';ctx.fillText(logX?t.label:fmt(v),xx,c.height-padB+21)}});
    yr.vals.forEach(t=>{const v=logY?t.pos:t,yy=sy(v),major=logY?t.major:true;ctx.strokeStyle=major?grid:minorGrid;ctx.lineWidth=major?1:0.7;ctx.beginPath();ctx.moveTo(padL,yy);ctx.lineTo(c.width-padR,yy);ctx.stroke();if(major||!logY){ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(logY?t.label:fmt(v),padL-12,yy)}});
    ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(padL,padT);ctx.lineTo(padL,c.height-padB);ctx.lineTo(c.width-padR,c.height-padB);ctx.stroke();
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='bold 16px Arial';ctx.fillText($('gxlabel')?.value||'X',(padL+c.width-padR)/2,c.height-29);
    ctx.save();ctx.translate(27,(padT+c.height-padB)/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillStyle=ink;ctx.font='bold 16px Arial';ctx.fillText($('gylabel')?.value||'Y',0,0);ctx.restore();
    const points=raw.map((p,index)=>({ ...p,index,tx:logX?Math.log10(p.x):p.x,ty:logY?Math.log10(p.y):p.y })).sort((a,b)=>a.tx-b.tx).map(p=>({...p,px:sx(p.tx),py:sy(p.ty)}));
    const queryValues=queriedValues(x,y,scale);showQueryResults(queryValues);
    const showDots=['points','points-line','points-curve','points-fit'].includes(plotType);
    const showLine=['line','points-line'].includes(plotType),showCurve=['curve','points-curve'].includes(plotType),showFit=['fit','points-fit'].includes(plotType);
    if(showLine||showCurve){ctx.strokeStyle=series;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';if(showCurve)drawCatmullRom(ctx,points);else{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.px,p.py):ctx.moveTo(p.px,p.py));ctx.stroke()}}
    if(showFit){ctx.strokeStyle=series;ctx.lineWidth=2.5;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(sx(minx),sy(r.slope*minx+r.inter));ctx.lineTo(sx(maxx),sy(r.slope*maxx+r.inter));ctx.stroke();ctx.setLineDash([])}
    if(showDots){ctx.fillStyle=series;for(const p of points){ctx.beginPath();ctx.arc(p.px,p.py,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle=canvasBg;ctx.lineWidth=1.5;ctx.stroke()}}
    // Mark requested X values using the same blue graph colour.
    queryValues.filter(q=>!q.error).forEach(q=>{const qx=sx(q.tx),qy=sy(q.ty);ctx.save();ctx.strokeStyle='#d27aff';ctx.lineWidth=1.8;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(qx,c.height-padB);ctx.moveTo(padL,qy);ctx.lineTo(qx,qy);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(qx,qy,8,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();ctx.strokeStyle=canvasBg;ctx.lineWidth=2;ctx.stroke();ctx.restore()});
    // Always order the selected endpoints from left to right. The triangle follows
    // the actual readings, so a negative slope descends left-to-right rather than
    // being accidentally flipped by the order in which the user clicked the dots.
    if(selectedSlopePoints.length===2){
      const chosen=selectedSlopePoints.map(idx=>raw[idx]).sort((a,b)=>a.x-b.x);
      const [p1,p2]=chosen;
      selectedSlopePoints=chosen.map(p=>p.index);
      selectedSlopePoints.forEach((idx,k)=>{const p=points.find(q=>q.index===idx)||points[idx];if(p){ctx.beginPath();ctx.arc(p.px,p.py,10,0,Math.PI*2);ctx.strokeStyle='#f08bff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#f08bff';ctx.font='bold 14px Arial';ctx.textAlign='left';ctx.fillText(k===0?'A':'B',p.px+12,p.py-12)}})
    } else if(selectedSlopePoints.length){selectedSlopePoints.forEach((idx,k)=>{const p=points.find(q=>q.index===idx)||points[idx];if(p){ctx.beginPath();ctx.arc(p.px,p.py,10,0,Math.PI*2);ctx.strokeStyle='#f08bff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#f08bff';ctx.font='bold 14px Arial';ctx.textAlign='left';ctx.fillText('A',p.px+12,p.py-12)}})
    }
    if(selectedSlopePoints.length===2){const p1=raw[selectedSlopePoints[0]],p2=raw[selectedSlopePoints[1]],x1=logX?Math.log10(p1.x):p1.x,x2=logX?Math.log10(p2.x):p2.x,y1=logY?Math.log10(p1.y):p1.y,y2=logY?Math.log10(p2.y):p2.y;
      ctx.save();ctx.strokeStyle='#f08bff';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2.8;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(sx(x1),sy(y1));ctx.lineTo(sx(x2),sy(y1));ctx.lineTo(sx(x2),sy(y2));ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(sx(x1),sy(y1));ctx.lineTo(sx(x2),sy(y2));ctx.stroke();ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText('ΔX', (sx(x1)+sx(x2))/2, sy(y1)+18);ctx.textAlign='left';ctx.fillText('ΔY',sx(x2)+8,(sy(y1)+sy(y2))/2);ctx.restore();
      const dx=x2-x1,dy=y2-y1,m=dx?dy/dx:NaN;
      $('slopeReadout').innerHTML=`<b>Point A:</b> (${fmt(p1.x)}, ${fmt(p1.y)})<br><b>Point B:</b> (${fmt(p2.x)}, ${fmt(p2.y)})<br><b>ΔX:</b> ${fmt(scale==='linear'?p2.x-p1.x:x2-x1)} · <b>ΔY:</b> ${fmt(scale==='linear'?p2.y-p1.y:y2-y1)}${scale!=='linear'?' (transformed units)':''}<br><b>Slope:</b> ${Number.isFinite(m)?m.toFixed(5):'undefined (ΔX = 0)'}${scale!=='linear'?'<br><small>Triangle is drawn in transformed axis coordinates; slope value uses transformed coordinates.</small>':''}`;
    } else if($('slopeReadout')) $('slopeReadout').textContent=selectedSlopePoints.length?'Point A selected. Click a second plotted dot.':'Slope triangle is off. Turn it on to choose two points.';
    const title=$('gtitle')?.value||'Laboratory Graph';if($('previewTitle'))$('previewTitle').textContent=title;
    const typeNames={line:'Line through all points', 'points-line':'Dots + line through all points',curve:'Smooth curve through all points','points-curve':'Dots + smooth curve',points:'Dots only (scatter)',fit:'Best-fit / regression line only','points-fit':'Dots + best-fit line'};
    $('graphResult').innerHTML=`<b>Plot:</b> ${typeNames[plotType]||plotType} · <b>Data points:</b> ${raw.length}${showFit?`<br><b>Regression slope:</b> ${r.slope.toFixed(4)} · <b>Intercept:</b> ${r.inter.toFixed(4)} · <b>R²:</b> ${r.r2.toFixed(4)}`:''}`;
    window.WahidFeatures?.track('tool_use',{tool:'graph-generator'});
    lastPlot={x,y,tx,ty,r,scale,plotType,points,queryValues,coords:{sx,sy,minx,maxx,miny,maxy,padL,padR,padT,padB}};return lastPlot;
  }
  const colName=n=>{let s='';do{s=String.fromCharCode(65+(n%26))+s;n=Math.floor(n/26)-1}while(n>=0);return s};
  const cell=(ref,v,type='n')=>type==='s'?`<c r="${ref}" t="inlineStr"><is><t>${escXml(v)}</t></is></c>`:`<c r="${ref}"><v>${Number(v)||0}</v></c>`;
  function sheetData(data){
    let rows=[];rows.push(`<row r="1">${[$('gxlabel')?.value||'X',$('gylabel')?.value||'Y','Transformed X','Transformed Y'].map((v,i)=>`<c r="${colName(i)}1" t="inlineStr"><is><t>${v}</t></is></c>`).join('')}</row>`);
    data.x.forEach((v,i)=>{const r=i+2;rows.push(`<row r="${r}">${cell(`A${r}`,v)}${cell(`B${r}`,data.y[i])}${cell(`C${r}`,data.tx[i])}${cell(`D${r}`,data.ty[i])}</row>`)})
    const base=data.x.length+4;rows.push(`<row r="${base}">${cell(`A${base}`,'Scale','s')}${cell(`B${base}`,data.scale,'s')}</row>`);rows.push(`<row r="${base+1}">${cell(`A${base+1}`,'Slope','s')}${cell(`B${base+1}`,data.r.slope)}</row>`);rows.push(`<row r="${base+2}">${cell(`A${base+2}`,'Intercept','s')}${cell(`B${base+2}`,data.r.inter)}</row>`);rows.push(`<row r="${base+3}">${cell(`A${base+3}`,'R²','s')}${cell(`B${base+3}`,data.r.r2)}</row>`);return rows.join('')
  }
  function chartXml(data){
    const n=data.x.length+1,title=escXml($('gtitle').value||'Laboratory Graph');
    const xlabel=escXml($('gxlabel')?.value||'X'),ylabel=escXml($('gylabel')?.value||'Y');
    const series='Measured data',color='2166D1';
    const xp=data.tx.map((v,i)=>`<c:pt idx="${i}"><c:v>${Number(v)}</c:v></c:pt>`).join('');
    const yp=data.ty.map((v,i)=>`<c:pt idx="${i}"><c:v>${Number(v)}</c:v></c:pt>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr b="1" sz="1600"/><a:t>${title}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:layout/><c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${series}</c:v></c:tx><c:marker><c:symbol val="circle"/><c:size val="7"/><c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr></c:marker><c:trendline><c:trendlineType val="linear"/><c:dispRSqr val="1"/><c:dispEq val="1"/></c:trendline><c:xVal><c:numRef><c:f>'Graph Data'!$C$2:$C$${n}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${data.tx.length}"/>${xp}</c:numCache></c:numRef></c:xVal><c:yVal><c:numRef><c:f>'Graph Data'!$D$2:$D$${n}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${data.ty.length}"/>${yp}</c:numCache></c:numRef></c:yVal></c:ser><c:axId val="-2010000"/><c:axId val="-2010001"/></c:scatterChart><c:valAx><c:axId val="-2010000"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${xlabel}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:crossAx val="-2010001"/><c:crosses val="autoZero"/></c:valAx><c:valAx><c:axId val="-2010001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${ylabel}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:crossAx val="-2010000"/><c:crosses val="autoZero"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`
  }
  async function makeWorkbook(data){
    const JSZip=window.JSZip;if(!JSZip)throw new Error('Excel export library is still loading.');
    const zip=new JSZip();const png=$('graphCanvas').toDataURL('image/png').split(',')[1];
    const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF12243D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0"/></cellXfs></styleSheet>`;
    const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Graph Data" sheetId="1" r:id="rId1"/><sheet name="Graph" sheetId="2" r:id="rId2"/></sheets></workbook>`;
    const wbrels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const sheet1=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="4" width="20" customWidth="1"/></cols><sheetData>${sheetData(data)}</sheetData></worksheet>`;
    const sheet2=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>${escXml($('gtitle').value||'Laboratory Graph')}</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Editable graph with measured data, transformed values and a native Excel scatter chart.</t></is></c></row></sheetData><drawing r:id="rId1"/></worksheet>`;
    const sheet2rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;
    const drawing=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>29</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Laboratory Graph"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor><xdr:twoCellAnchor><xdr:from><xdr:col>11</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>19</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>29</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="3" name="Graph Preview"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;
    const drawingrels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/graph.png"/></Relationships>`;
    const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>`;
    zip.file('[Content_Types].xml',types);zip.file('_rels/.rels',rels);zip.file('xl/workbook.xml',wb);zip.file('xl/_rels/workbook.xml.rels',wbrel);zip.file('xl/styles.xml',styles);zip.file('xl/worksheets/sheet1.xml',sheet1);zip.file('xl/worksheets/sheet2.xml',sheet2);zip.file('xl/worksheets/_rels/sheet2.xml.rels',sheet2rels);zip.file('xl/drawings/drawing1.xml',drawing);zip.file('xl/drawings/_rels/drawing1.xml.rels',drawingrels);zip.file('xl/charts/chart1.xml',chartXml(data));zip.file('xl/media/graph.png',png,{base64:true});return zip.generateAsync({type:'blob'})
  }
  function downloadPdf(data){const js=window.jspdf?.jsPDF;if(!js)return;const pdf=new js({orientation:'landscape',unit:'pt',format:'a4'});const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight();const margin=34;pdf.setFillColor(16,36,61);pdf.rect(0,0,pageW,58,'F');pdf.setTextColor(255,248,236);pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.text($('gtitle').value||'Laboratory Graph',margin,35);pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.text(`Scale: ${data.scale} | Slope: ${data.r.slope.toFixed(4)} | R²: ${data.r.r2.toFixed(4)}`,pageW-300,35);const img=$('graphCanvas').toDataURL('image/png');const iw=pageW-margin*2,ih=iw*0.62;pdf.addImage(img,'PNG',margin,78,iw,Math.min(ih,pageH-120));pdf.setTextColor(90,98,108);pdf.setFontSize(8);pdf.text('Wahid Academic Atelier · Graph Studio',margin,pageH-20);pdf.save(`${safe($('gtitle').value||'laboratory-graph')}.pdf`)}
  async function exportExcel(auto=false){const data=draw();if(!data)return;try{const blob=await makeWorkbook(data),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${safe($('gtitle').value||'laboratory-graph')}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);if(auto)downloadPdf(data);$('graphResult').innerHTML+=auto?' · <b>Excel workbook with native graph + PDF created automatically.</b>':' · <b>Excel workbook created.</b>'}catch(e){console.error(e);alert('Excel creation failed: '+(e?.message||e))}}
  function downloadPng(){const data=draw();if(!data)return;const a=document.createElement('a');a.download=`${safe($('gtitle').value||'laboratory-graph')}.png`;a.href=$('graphCanvas').toDataURL('image/png');a.click()}
  function safe(n){return String(n||'laboratory-graph').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'laboratory-graph'}
  $('generateGraph').onclick=()=>{const x=nums($('gx').value),y=nums($('gy').value);if(x.length!==y.length||x.length<2||x.some(v=>!Number.isFinite(v))||y.some(v=>!Number.isFinite(v))){$('graphResult').textContent='Enter at least two valid numeric X values and the same number of numeric Y values.';return}draw();};
  $('clearGraph')?.addEventListener('click',()=>{
    ['gx','gy','gqueryx','gtitle','gxlabel','gylabel','gunits'].forEach(id=>{const el=$(id);if(el)el.value='';});
    selectedSlopePoints=[];lastPlot=null;if($('gslopeon'))$('gslopeon').checked=false;
    if($('slopeReadout'))$('slopeReadout').textContent='';
    if($('pointReadout'))$('pointReadout').textContent='';
    if($('queryReadout'))$('queryReadout').innerHTML='';if($('previewTitle'))$('previewTitle').textContent='';
    draw();
  });$('downloadGraph').onclick=downloadPng;$('downloadExcel').onclick=()=>exportExcel(false);$('printGraph').onclick=()=>{const data=draw();if(data){if(window.jspdf?.jsPDF)downloadPdf(data);else window.print()}};
  ['gx','gy','gtitle','gxlabel','gylabel','gscale','gplottype'].forEach(id=>{ $(id)?.addEventListener('input',()=>{selectedSlopePoints=[];draw()}); $(id)?.addEventListener('change',()=>{selectedSlopePoints=[];draw()}); });
  $('findGraphValues')?.addEventListener('click',()=>draw());
  $('gqueryx')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw();}});
  $('gslopeon')?.addEventListener('change',()=>{selectedSlopePoints=[];if($('slopeReadout'))$('slopeReadout').textContent='';draw();});
  $('clearSlope')?.addEventListener('click',()=>{selectedSlopePoints=[];if($('slopeReadout'))$('slopeReadout').textContent='';draw();});
  $('graphCanvas')?.addEventListener('click',e=>{
    const data=lastPlot;if(!data)return;const c=$('graphCanvas'),rect=c.getBoundingClientRect(),px=(e.clientX-rect.left)*(c.width/rect.width),py=(e.clientY-rect.top)*(c.height/rect.height);
    let best=-1,dist=Infinity;data.points.forEach((p,i)=>{const d=Math.hypot(p.px-px,p.py-py);if(d<dist){dist=d;best=i}});
    if(best<0||dist>42){if($('pointReadout'))$('pointReadout').textContent='No data point nearby. Click directly on a blue dot.';return}
    const p=data.points[best];if($('pointReadout'))$('pointReadout').innerHTML=`<b>Selected point ${best+1}</b><br>X = ${fmt(p.x)} · Y = ${fmt(p.y)}`;
    if($('gslopeon')?.checked){const originalIndex=p.index;if(Number.isInteger(originalIndex)){if(selectedSlopePoints.length>=2)selectedSlopePoints=[];selectedSlopePoints.push(originalIndex);if($('slopeReadout'))$('slopeReadout').textContent=selectedSlopePoints.length===1?'Point A selected. Click a second blue dot.':'Two points selected.';}}
    draw();
  });
  // Start with an empty plotting sheet: users supply all measurements themselves.
  draw();
})();
