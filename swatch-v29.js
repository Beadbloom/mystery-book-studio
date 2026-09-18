/* v29 source-of-truth reader: mystery artwork's bottom swatch strip */
(()=>{
 const CODES=['1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','w','x','y','z','§','¶','$','¥','£','€','#','@'];
 function median(a){a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]||0}
 function sample(g,w,h,cx,cy,bw,bh){
  const R=[],G=[],B=[];const d=g.getImageData(Math.max(0,Math.floor(cx-bw*.28)),Math.max(0,Math.floor(cy-bh*.28)),Math.max(1,Math.floor(bw*.56)),Math.max(1,Math.floor(bh*.56))).data;
  for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2];if(r>242&&gg>242&&b>242)continue;R.push(r);G.push(gg);B.push(b)}
  return R.length?[median(R),median(G),median(B)]:[245,245,245]
 }
 async function read(){
  if(!current?.line)return;const im=await img(current.line),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const n=Math.max(1,Math.min(40,+document.getElementById('v29Count').value||40));
  /* bottom strip visible in the supplied mystery artwork: one continuous left-to-right row */
  const x0=.058,x1=.943,cy=.941,slot=(x1-x0)/n,bh=.026,p=[];
  for(let i=0;i<n;i++)p.push(sample(g,c.width,c.height,(x0+slot*(i+.5))*c.width,cy*c.height,slot*c.width,bh*c.height));
  current.palette=p;current.codes=CODES.slice(0,n);current.swatchCount=n;renderPalette();await save();
 }
 function install(){
  document.querySelector('.v28')?.remove();document.querySelector('.v27Control')?.remove();const old=document.getElementById('readPalette');if(!old||document.getElementById('v29Count'))return;old.style.display='none';
  const d=document.createElement('div');d.className='v29';d.innerHTML='<label>Number of swatches shown along the bottom of the mystery page</label><div><input id="v29Count" type="number" min="1" max="40" value="40"><button id="v29Read" class="primary">Read swatch strip exactly</button></div><small>The app reads the supplied swatch strip left-to-right and keeps each colour attached to its printed code. Colours are not sorted, clustered or guessed from the artwork.</small>';old.parentElement.insertBefore(d,old);document.getElementById('v29Read').onclick=read;
 }
 const s=document.createElement('style');s.textContent='.v29{padding:10px;border:1px solid var(--line);border-radius:10px;margin:10px 0}.v29>div{display:grid;grid-template-columns:90px 1fr;gap:8px}';document.head.appendChild(s);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();