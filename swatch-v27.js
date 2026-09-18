/* v27 variable swatch reader: 1-40 colours, avoids white background */
(()=>{
 const CODESEQ=['2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','w','x','y','z','A','B','C','D','E','F','G','H','J','K'];
 function med(a){a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]||0}
 function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])}
 function px(g,x,y,w,h){const d=g.getImageData(Math.max(0,x),Math.max(0,y),Math.max(1,w),Math.max(1,h)).data,out=[];for(let i=0;i<d.length;i+=4){const c=[d[i],d[i+1],d[i+2]];const hi=Math.max(...c),lo=Math.min(...c),sat=hi-lo;if(!(c[0]>242&&c[1]>242&&c[2]>242)&&!(hi<45)&&sat>5)out.push(c)}return out}
 function cluster(colors,n){if(!colors.length)return[];let centers=[];for(let i=0;i<n;i++)centers.push(colors[Math.floor(i*(colors.length-1)/Math.max(1,n-1))]);for(let z=0;z<7;z++){const bins=centers.map(()=>[]);for(const c of colors){let bi=0,bd=1e9;centers.forEach((m,i)=>{const d=dist(c,m);if(d<bd){bd=d;bi=i}});bins[bi].push(c)}centers=bins.map((b,i)=>b.length?[med(b.map(x=>x[0])),med(b.map(x=>x[1])),med(b.map(x=>x[2]))]:centers[i])}return centers}
 async function readChart(){
  if(!current?.swatchSource)return;const im=await img(current.swatchSource),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  let n=Math.max(1,Math.min(40,+document.getElementById('v27Count').value||29)),samples=[];
  const step=Math.max(2,Math.round(Math.min(c.width,c.height)/260));
  for(let y=Math.round(c.height*.08);y<c.height*.92;y+=step)for(let x=Math.round(c.width*.03);x<c.width*.97;x+=step){const d=g.getImageData(x,y,1,1).data,r=d[0],gg=d[1],b=d[2],hi=Math.max(r,gg,b),lo=Math.min(r,gg,b);if(!(r>238&&gg>238&&b>238)&&hi>55&&(hi-lo)>12)samples.push([r,gg,b])}
  if(samples.length>12000)samples=samples.filter((_,i)=>i%Math.ceil(samples.length/12000)===0);
  let colors=cluster(samples,n).filter(c=>!(c[0]>235&&c[1]>235&&c[2]>235));
  colors.sort((a,b)=>{const ah=Math.atan2(Math.sqrt(3)*(a[1]-a[2]),2*a[0]-a[1]-a[2]),bh=Math.atan2(Math.sqrt(3)*(b[1]-b[2]),2*b[0]-b[1]-b[2]);return ah-bh});
  current.palette=colors.slice(0,n);current.codes=CODESEQ.slice(0,current.palette.length);current.swatchCount=current.palette.length;renderPalette();await save();
 }
 function install(){
  const btn=document.getElementById('readPalette');if(!btn||document.getElementById('v27Count'))return;
  const wrap=document.createElement('div');wrap.className='v27Control';wrap.innerHTML='<label>Number of colours on this chart (up to 40)</label><div><input id="v27Count" type="number" min="1" max="40" value="'+Math.min(40,current?.swatchCount||29)+'"><button id="v27Read" class="primary">Read colour chart</button></div><small>Set this to the number of coloured boxes on this particular chart. The reader ignores white page/background pixels.</small>';
  btn.parentElement.insertBefore(wrap,btn);btn.style.display='none';document.getElementById('v27Read').onclick=readChart;
  const old=document.querySelector('#paletteStage .note');if(old)old.innerHTML='<strong>Colour chart reader:</strong> choose how many coloured boxes are on this chart (maximum 40), then read it. White paper/background is excluded from colour sampling. Review the resulting colours before approving.';
 }
 const st=document.createElement('style');st.textContent='.v27Control{margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:11px;background:#fafaff}.v27Control>div{display:grid;grid-template-columns:90px 1fr;gap:8px}.v27Control input{width:100%}';document.head.appendChild(st);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();