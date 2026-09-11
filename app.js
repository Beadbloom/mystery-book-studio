const $=id=>document.getElementById(id);
let designs=JSON.parse(localStorage.getItem('mbs-designs')||'[]');
let current=null, img=null;
const original=$('original'),seg=$('segmented'),mystery=$('mystery');
const octx=original.getContext('2d',{willReadFrequently:true}),sctx=seg.getContext('2d'),mctx=mystery.getContext('2d');

function save(){localStorage.setItem('mbs-designs',JSON.stringify(designs));renderList();renderGallery();renderStructure()}
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===id));scrollTo(0,0)}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>switchView(t.dataset.view));
$('backLibrary').onclick=()=>switchView('libraryView');

for(const id of ['colors','blur','region']){const e=$(id),v=$(id+'Val');e.oninput=()=>v.textContent=e.value}

$('upload').onchange=e=>{
 const f=e.target.files?.[0];if(!f)return;
 const r=new FileReader();r.onload=()=>{
   const im=new Image();im.onload=()=>{
    designs.push({id:Date.now(),number:designs.length+1,name:`Design ${designs.length+1}`,original:r.result,aspect:im.width/im.height,status:'draft',segmented:null,mystery:null,palette:null});
    save();openDesign(designs.at(-1).id);
   };im.src=r.result;
 };r.readAsDataURL(f);
};

function renderList(){
 const el=$('designList');$('progress').textContent=`${designs.filter(d=>d.status==='approved').length} of 40 designs approved`;
 if(!designs.length){el.className='empty';el.textContent='No artwork added yet.';return}
 el.className='';el.innerHTML='';
 designs.forEach(d=>{
  const x=document.createElement('div');x.className='design';
  x.innerHTML=`<div class="thumb"><img src="${d.original}"></div><div><strong>#${d.number} ${d.name}</strong><br><span class="badge ${d.status==='approved'?'approved':d.status==='review'?'review':''}">${d.status}</span><small>${d.aspect>1.12?'Landscape':d.aspect<.88?'Portrait':'Square'} artwork</small><button data-open="${d.id}" style="margin-top:7px">Open editor</button></div>`;
  el.appendChild(x);
 });
 el.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDesign(Number(b.dataset.open)));
}
function openDesign(id){
 current=designs.find(d=>d.id===id);if(!current)return;
 $('editTitle').textContent=`Page Editor — #${current.number}`;
 img=new Image();img.onload=()=>{
  const max=800,scale=Math.min(1,max/img.width);original.width=Math.round(img.width*scale);original.height=Math.round(img.height*scale);
  seg.width=mystery.width=original.width;seg.height=mystery.height=original.height;octx.drawImage(img,0,0,original.width,original.height);
  if(current.segmented){let a=new Image();a.onload=()=>sctx.drawImage(a,0,0,seg.width,seg.height);a.src=current.segmented}
  if(current.mystery){let a=new Image();a.onload=()=>mctx.drawImage(a,0,0,mystery.width,mystery.height);a.src=current.mystery}
 };img.src=current.original;
 $('approve').disabled=!current.mystery;switchView('editorView');
}
const d2=(a,b)=>{let x=a[0]-b[0],y=a[1]-b[1],z=a[2]-b[2];return x*x+y*y+z*z};
function pixels(){
 const t=document.createElement('canvas');t.width=original.width;t.height=original.height;let c=t.getContext('2d',{willReadFrequently:true});
 c.filter=Number($('blur').value)?`blur(${$('blur').value}px)`:'none';c.drawImage(img,0,0,t.width,t.height);return c.getImageData(0,0,t.width,t.height);
}
function kmeans(data,k,w,h){
 const p=data.data,n=w*h,s=[],stride=Math.max(1,Math.floor(n/10000));for(let i=0;i<n;i+=stride){let j=i*4;s.push([p[j],p[j+1],p[j+2]])}
 let C=[];for(let i=0;i<k;i++)C.push(s[Math.floor((i+.5)*s.length/k)%s.length].slice());
 for(let z=0;z<6;z++){let sums=Array.from({length:k},()=>[0,0,0,0]);for(const q of s){let b=0,bd=1e20;for(let c=0;c<k;c++){let d=d2(q,C[c]);if(d<bd){bd=d;b=c}}let a=sums[b];a[0]+=q[0];a[1]+=q[1];a[2]+=q[2];a[3]++}for(let c=0;c<k;c++)if(sums[c][3])C[c]=sums[c].slice(0,3).map(x=>x/sums[c][3])}
 let L=new Uint8Array(n);for(let i=0;i<n;i++){let j=i*4,q=[p[j],p[j+1],p[j+2]],b=0,bd=1e20;for(let c=0;c<k;c++){let d=d2(q,C[c]);if(d<bd){bd=d;b=c}}L[i]=b}return{C,L}
}
function comps(L,w,h,min){
 let seen=new Uint8Array(L.length),q=new Int32Array(L.length),all=[];
 function flood(st){let lab=L[st],a=0,b=0,pts=[],sx=0,sy=0,minx=w,maxx=0,miny=h,maxy=0;q[b++]=st;seen[st]=1;
  while(a<b){let i=q[a++],x=i%w,y=i/w|0;pts.push(i);sx+=x;sy+=y;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);
   for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&L[n]===lab){seen[n]=1;q[b++]=n}}
  return{lab,pts,size:b,cx:sx/b,cy:sy/b,minx,maxx,miny,maxy}}
 for(let i=0;i<L.length;i++)if(!seen[i])all.push(flood(i));
 for(const c of all)if(c.size<min){let counts=new Map();for(const i of c.pts){let x=i%w,y=i/w|0;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&L[n]!==c.lab)counts.set(L[n],(counts.get(L[n])||0)+1)}let best=c.lab,bn=0;for(const [l,n]of counts)if(n>bn){best=l;bn=n}for(const i of c.pts)L[i]=best}
 seen.fill(0);all=[];for(let i=0;i<L.length;i++)if(!seen[i])all.push(flood(i));return all
}
function safe(c,L,w,h){
 let best={x:Math.round(c.cx),y:Math.round(c.cy),r:0},step=Math.max(1,Math.floor(Math.min(c.maxx-c.minx,c.maxy-c.miny)/14)),max=Math.min(30,Math.floor(Math.min(c.maxx-c.minx,c.maxy-c.miny)/2));
 for(let y=c.miny;y<=c.maxy;y+=step)for(let x=c.minx;x<=c.maxx;x+=step){if(L[y*w+x]!==c.lab)continue;let r=0;outer:for(r=1;r<=max;r++){let x0=x-r,x1=x+r,y0=y-r,y1=y+r;if(x0<0||x1>=w||y0<0||y1>=h)break;for(let xx=x0;xx<=x1;xx++)if(L[y0*w+xx]!==c.lab||L[y1*w+xx]!==c.lab)break outer;for(let yy=y0;yy<=y1;yy++)if(L[yy*w+x0]!==c.lab||L[yy*w+x1]!==c.lab)break outer}if(r>best.r)best={x,y,r}}return best
}
$('convert').onclick=async()=>{
 if(!current||!img)return;$('convert').disabled=true;$('convertStatus').innerHTML='<small>Building segmented master…</small>';await new Promise(r=>setTimeout(r,30));
 let w=original.width,h=original.height,{C,L}=kmeans(pixels(),Number($('colors').value),w,h),cs=comps(L,w,h,Number($('region').value));
 let si=sctx.createImageData(w,h);for(let i=0;i<L.length;i++){let c=C[L[i]],j=i*4;si.data[j]=c[0];si.data[j+1]=c[1];si.data[j+2]=c[2];si.data[j+3]=255}sctx.putImageData(si,0,0);
 mctx.fillStyle='#fff';mctx.fillRect(0,0,w,h);let bd=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=y*w+x,l=L[i];if((x<w-1&&L[i+1]!==l)||(y<h-1&&L[i+w]!==l))bd[i]=1}
 let mi=mctx.getImageData(0,0,w,h);for(let i=0;i<bd.length;i++)if(bd[i]){let x=i%w,y=i/w|0;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){let j=(yy*w+xx)*4;mi.data[j]=mi.data[j+1]=mi.data[j+2]=25;mi.data[j+3]=255}}mctx.putImageData(mi,0,0);
 mctx.textAlign='center';mctx.textBaseline='middle';for(const c of cs){let p=safe(c,L,w,h),font=Math.min(17,Math.floor(p.r*1.4));if(font<7)continue;let text=String(c.lab+1);mctx.font=`700 ${font}px system-ui`;let tw=mctx.measureText(text).width,max=p.r*1.5;while(font>7&&tw>max){font--;mctx.font=`700 ${font}px system-ui`;tw=mctx.measureText(text).width}if(tw>max)continue;mctx.fillStyle='rgba(255,255,255,.94)';mctx.fillRect(p.x-tw/2-2,p.y-font/2-2,tw+4,font+4);mctx.fillStyle='#222';mctx.fillText(text,p.x,p.y)}
 $('palette').innerHTML=C.map((c,i)=>`<span class="sw"><span class="dot" style="background:rgb(${c.map(Math.round).join(',')})"></span>${i+1}</span>`).join('');
 current.segmented=seg.toDataURL('image/jpeg',.86);current.mystery=mystery.toDataURL('image/png');current.palette=C;current.status='review';save();$('approve').disabled=false;$('convertStatus').innerHTML=`<small>${cs.length} cleaned regions. The numbered page is generated from this exact segmented master.</small>`;$('convert').disabled=false;
};
$('approve').onclick=()=>{if(!current?.mystery)return;current.status='approved';save();renderGallery();alert(`Design #${current.number} approved and added to Completed Images.`)};

function approved(){return designs.filter(d=>d.status==='approved')}
function renderGallery(){
 let arr=approved(),host=$('galleryPages');host.innerHTML='';if(!arr.length){host.innerHTML='<section class="card empty">Approved coloured images will appear here.</section>';return}
 let mode=$('galleryMode').value,i=0;
 while(i<arr.length){let remain=arr.length-i,count=4,cls='layout4';if(mode==='2'){count=2;cls='layout2'}else if(mode==='3'){count=3;cls='layout3'}else if(mode==='auto'){let hasLandscape=arr.slice(i,i+3).some(d=>d.aspect>1.12);if(hasLandscape&&remain>=3){count=3;cls='layout3'}else{count=Math.min(4,remain);cls=count===2?'layout2':count===3?'layout3':'layout4'}}
  let page=document.createElement('section');page.className=`galleryPage ${cls}`;arr.slice(i,i+count).forEach(d=>{let x=document.createElement('div');x.className='galleryItem';x.innerHTML=`<img src="${d.original}"><span class="num">#${d.number}</span>`;page.appendChild(x)});host.appendChild(page);i+=count;
 }
}
$('galleryMode').onchange=renderGallery;
function renderStructure(){
 let a=approved(),g=$('galleryMode').value==='2'?Math.ceil(a.length/2):$('galleryMode').value==='3'?Math.ceil(a.length/3):Math.ceil(a.length/4);
 $('structure').innerHTML=`<p><strong>Opening:</strong> dedication page</p><p><strong>Mystery pages:</strong> ${a.length} approved of 40</p><p><strong>Completed Images:</strong> approximately ${g} gallery page${g===1?'':'s'} at current layout</p><p><strong>Current book:</strong> approximately ${1+a.length+g} A4 pages</p>`;
}
$('previewBook').onclick=renderStructure;
$('printBook').onclick=()=>{renderStructure();window.print()};
renderList();renderGallery();renderStructure();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
