/* v28 chart geometry reader: reads coloured code boxes, not page-wide clustering */
(()=>{
 const LEFT=['1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','j','k'];
 const RIGHT=['m','n','p','q','r','s','t','u','w','x','y','z','§','¶','$','¥','£','€','#','@'];
 function median(a){a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]}
 function sample(g,w,h,cx,cy,bw,bh){
   const rs=[],gs=[],bs=[];for(const ox of [-.22,.22])for(const oy of [-.22,.22]){
    const x=Math.max(0,Math.round((cx+ox*bw)*w)),y=Math.max(0,Math.round((cy+oy*bh)*h)),rw=Math.max(2,Math.round(bw*w*.12)),rh=Math.max(2,Math.round(bh*h*.12));
    const d=g.getImageData(Math.max(0,x-rw),Math.max(0,y-rh),Math.min(w,x+rw)-Math.max(0,x-rw),Math.min(h,y+rh)-Math.max(0,y-rh)).data;
    for(let i=0;i<d.length;i+=4){rs.push(d[i]);gs.push(d[i+1]);bs.push(d[i+2])}
   }return [median(rs),median(gs),median(bs)]
 }
 async function read(){
  if(!current?.swatchSource)return;const im=await img(current.swatchSource),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const n=Math.max(1,Math.min(40,+document.getElementById('v28Count').value||40)),leftN=Math.min(20,n),rightN=Math.max(0,n-leftN),pal=[],codes=[];
  /* geometry measured from user's My color chart: 20 rows per column */
  const y0=.151, step=.04075, bw=.031, bh=.0215, lx=.091, rx=.548;
  for(let i=0;i<leftN;i++){pal.push(sample(g,c.width,c.height,lx,y0+i*step,bw,bh));codes.push(LEFT[i])}
  for(let i=0;i<rightN;i++){pal.push(sample(g,c.width,c.height,rx,y0+i*step,bw,bh));codes.push(RIGHT[i])}
  current.palette=pal;current.codes=codes;current.swatchCount=n;renderPalette();await save();
 }
 function install(){const old=document.getElementById('v27Count');if(old)old.closest('.v27Control')?.remove();const btn=document.getElementById('readPalette');if(!btn||document.getElementById('v28Count'))return;btn.style.display='none';const d=document.createElement('div');d.className='v28';d.innerHTML='<label>How many colour boxes are filled on this chart?</label><div><input id="v28Count" type="number" min="1" max="40" value="40"><button id="v28Read" class="primary">Read exact chart boxes</button></div><small>This reads each coloured code square in its actual row and column. It does not scan or sort colours from the rest of the page.</small>';btn.parentElement.insertBefore(d,btn);document.getElementById('v28Read').onclick=read}
 const s=document.createElement('style');s.textContent='.v28{padding:10px;border:1px solid var(--line);border-radius:10px;margin:10px 0}.v28>div{display:grid;grid-template-columns:90px 1fr;gap:8px}';document.head.appendChild(s);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();