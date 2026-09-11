// Mystery Book Studio — illustrated mystery renderer v9
// Creates composition-aware paint-by-number geometry from a reduced structural palette,
// then assigns each closed region back to the full approved palette.
(function(){
  const btn=document.getElementById('buildLine');
  if(!btn)return;

  const d2=(a,b)=>{const r=a[0]-b[0],g=a[1]-b[1],bb=a[2]-b[2];return r*r+g*g+bb*bb;};
  function nearest(rgb,pal){let b=0,bd=Infinity;for(let i=0;i<pal.length;i++){const d=d2(rgb,pal[i]);if(d<bd){bd=d;b=i;}}return b;}
  function drawOriginal(im){const w=Math.min(1000,im.naturalWidth),h=Math.round(w*im.naturalHeight/im.naturalWidth);cvs.segmented.width=w;cvs.segmented.height=h;ctx.segmented.clearRect(0,0,w,h);ctx.segmented.imageSmoothingEnabled=true;ctx.segmented.imageSmoothingQuality='high';ctx.segmented.drawImage(im,0,0,w,h);}

  function reducedPalette(pal,n){
    if(pal.length<=n)return pal.map((c,i)=>({c,i}));
    const out=[];for(let k=0;k<n;k++){const i=Math.round(k*(pal.length-1)/(n-1));out.push({c:pal[i],i});}return out;
  }
  function majority(L,w,h,r=1){const O=new Uint8Array(L.length),cnt=new Uint16Array(32);for(let y=0;y<h;y++)for(let x=0;x<w;x++){cnt.fill(0);for(let yy=Math.max(0,y-r);yy<=Math.min(h-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(w-1,x+r);xx++)cnt[L[yy*w+xx]]++;let b=L[y*w+x],bn=cnt[b];for(let k=0;k<cnt.length;k++)if(cnt[k]>bn){b=k;bn=cnt[k];}O[y*w+x]=b;}return O;}
  function components(L,w,h){const seen=new Uint8Array(L.length),q=new Int32Array(L.length),out=[];for(let s=0;s<L.length;s++){if(seen[s])continue;const lab=L[s];let hd=0,tl=0,sx=0,sy=0,minx=w,maxx=0,miny=h,maxy=0;const pts=[];q[tl++]=s;seen[s]=1;while(hd<tl){const i=q[hd++],x=i%w,y=(i/w)|0;pts.push(i);sx+=x;sy+=y;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&L[n]===lab){seen[n]=1;q[tl++]=n;}}out.push({lab,pts,size:pts.length,cx:sx/pts.length,cy:sy/pts.length,minx,maxx,miny,maxy});}return out;}
  function mergeSmall(L,w,h,minArea){const cs=components(L,w,h).sort((a,b)=>a.size-b.size);for(const c of cs){if(c.size>=minArea)break;const adj=new Map();for(const i of c.pts){const x=i%w,y=(i/w)|0;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&L[n]!==c.lab)adj.set(L[n],(adj.get(L[n])||0)+1);}let best=c.lab,bc=-1;for(const [lab,n] of adj)if(n>bc){bc=n;best=lab;}if(best!==c.lab)for(const i of c.pts)L[i]=best;}}
  function labelPoint(c,L,w,h){let best={x:Math.round(c.cx),y:Math.round(c.cy),r:0};const step=Math.max(1,Math.floor(Math.min(c.maxx-c.minx,c.maxy-c.miny)/10));for(let y=c.miny;y<=c.maxy;y+=step)for(let x=c.minx;x<=c.maxx;x+=step){if(L[y*w+x]!==c.lab)continue;let r=1;outer:for(;r<18;r++){if(x-r<0||x+r>=w||y-r<0||y+r>=h)break;for(let xx=x-r;xx<=x+r;xx++)if(L[(y-r)*w+xx]!==c.lab||L[(y+r)*w+xx]!==c.lab)break outer;for(let yy=y-r;yy<=y+r;yy++)if(L[yy*w+x-r]!==c.lab||L[yy*w+x+r]!==c.lab)break outer;}if(r>best.r)best={x,y,r};}return best;}
  function structuralEdges(data,w,h){const lum=new Float32Array(w*h),mag=new Float32Array(w*h);for(let i=0;i<w*h;i++){const j=i*4;lum[i]=data[j]*.299+data[j+1]*.587+data[j+2]*.114;}for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,gx=(-lum[i-w-1]-2*lum[i-1]-lum[i+w-1])+(lum[i-w+1]+2*lum[i+1]+lum[i+w+1]),gy=(-lum[i-w-1]-2*lum[i-w]-lum[i-w+1])+(lum[i+w-1]+2*lum[i+w]+lum[i+w+1]);mag[i]=Math.sqrt(gx*gx+gy*gy);}return mag;}

  function render(L,w,h,cs,data,fullPal,outW,outH,strong){
    const out=document.createElement('canvas');out.width=outW;out.height=outH;const c=out.getContext('2d'),sx=outW/w,sy=outH/h;c.fillStyle='#fff';c.fillRect(0,0,outW,outH);
    // Closed colouring-region boundaries.
    c.strokeStyle='#202020';c.lineWidth=1.15;c.lineCap='round';c.lineJoin='round';c.beginPath();
    for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){const i=y*w+x,l=L[i];if(L[i+1]!==l){const xx=(x+1)*sx;c.moveTo(xx,y*sy);c.lineTo(xx,(y+1)*sy);}if(L[i+w]!==l){const yy=(y+1)*sy;c.moveTo(x*sx,yy);c.lineTo((x+1)*sx,yy);}}c.stroke();
    // Sparse high-contrast composition lines make the subject/castle/moon readable without tracing texture.
    if(strong){const G=structuralEdges(data,w,h);c.strokeStyle='rgba(20,20,20,.62)';c.lineWidth=1.7;c.beginPath();const th=145;for(let y=2;y<h-2;y+=2)for(let x=2;x<w-2;x+=2){const i=y*w+x;if(G[i]<th)continue;let n=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(G[(y+yy)*w+x+xx]>th*.82)n++;if(n<5)continue;c.moveTo(x*sx,y*sy);c.lineTo((x+1.5)*sx,(y+.4)*sy);}c.stroke();}
    c.textAlign='center';c.textBaseline='middle';
    for(const z of cs){if(z.size<22)continue;const p=labelPoint(z,L,w,h);if(p.r<4)continue;let rs=0,gs=0,bs=0,n=0;const step=Math.max(1,Math.floor(z.pts.length/180));for(let k=0;k<z.pts.length;k+=step){const i=z.pts[k],j=i*4;rs+=data[j];gs+=data[j+1];bs+=data[j+2];n++;}const idx=nearest([rs/n,gs/n,bs/n],fullPal),code=typeof codeFor==='function'?codeFor(idx):String(idx+1),px=p.x*sx,py=p.y*sy,fs=Math.max(7,Math.min(13,Math.floor(p.r*sx*.9)));c.font=`700 ${fs}px system-ui`;const tw=c.measureText(code).width;if(tw>p.r*sx*1.9)continue;c.fillStyle='rgba(255,255,255,.96)';c.fillRect(px-tw/2-2,py-fs/2-1,tw+4,fs+2);c.fillStyle='#222';c.fillText(code,px,py+.2);}
    return out;
  }

  btn.onclick=async()=>{
    if(!current?.keyApproved||!current.palette)return alert('Approve the Colour Key first.');
    btn.disabled=true;const status=document.getElementById('lineStatus');status.innerHTML='<small>Building an illustrated mystery page from the composition…</small>';
    try{
      artImg=await loadImage(current.artwork);drawOriginal(artImg);
      const detail=document.getElementById('detail').value,strong=document.getElementById('outline').value==='strong';
      const workW=detail==='simple'?240:detail==='standard'?300:360,scale=Math.min(1,workW/artImg.naturalWidth),w=Math.max(120,Math.round(artImg.naturalWidth*scale)),h=Math.max(120,Math.round(artImg.naturalHeight*scale));
      const work=document.createElement('canvas');work.width=w;work.height=h;const wc=work.getContext('2d',{willReadFrequently:true});wc.imageSmoothingEnabled=true;wc.imageSmoothingQuality='high';wc.filter=detail==='simple'?'blur(2.8px)':detail==='standard'?'blur(2.1px)':'blur(1.6px)';wc.drawImage(artImg,0,0,w,h);const data=wc.getImageData(0,0,w,h).data;
      // Geometry uses only a small structural colour set so gradients do not become topographic rings.
      const geomCount=detail==='simple'?6:detail==='standard'?7:8,geomPal=reducedPalette(current.palette,geomCount);let L=new Uint8Array(w*h);
      for(let i=0;i<L.length;i++){const j=i*4,rgb=[data[j],data[j+1],data[j+2]];let b=0,bd=Infinity;for(let k=0;k<geomPal.length;k++){const d=d2(rgb,geomPal[k].c);if(d<bd){bd=d;b=k;}}L[i]=b;}
      const passes=detail==='simple'?4:detail==='standard'?3:2;for(let p=0;p<passes;p++)L=majority(L,w,h,1);
      const areas=detail==='simple'?[20,35,55,85,125]:detail==='standard'?[14,24,38,58,86]:[10,17,27,40,58,80];
      for(const a of areas){mergeSmall(L,w,h,a);L=majority(L,w,h,1);}
      let cs=components(L,w,h),limit=detail==='simple'?260:detail==='standard'?420:620,a=areas[areas.length-1];while(cs.length>limit&&a<240){a=Math.round(a*1.28);mergeSmall(L,w,h,a);L=majority(L,w,h,1);cs=components(L,w,h);}
      const outW=Math.min(1000,artImg.naturalWidth),outH=Math.round(outW*artImg.naturalHeight/artImg.naturalWidth),line=render(L,w,h,cs,data,current.palette,outW,outH,strong);
      cvs.mystery.width=outW;cvs.mystery.height=outH;ctx.mystery.clearRect(0,0,outW,outH);ctx.mystery.drawImage(line,0,0);
      current.segmented=current.artwork;current.mystery=cvs.mystery.toDataURL('image/png');current.lineApproved=false;current.finalApproved=false;current.status='key approved';current.mysteryRegionCount=cs.length;if(typeof save==='function')save();document.getElementById('approveLine').disabled=false;
      status.innerHTML=`<small><strong>${cs.length} illustrated colouring regions.</strong> The page now uses broad composition-aware shapes first, then assigns each region to the full approved palette. Fine photographic texture is ignored.</small>`;
    }catch(err){console.error(err);status.innerHTML='<small>Illustrated mystery generation failed. Please try again.</small>';}finally{btn.disabled=false;}
  };
})();