// Mystery Book Studio — abstract mystery-region renderer v8
// Builds a deliberately non-literal organic mesh, then samples the artwork beneath each region to assign its palette code.
(function(){
  const btn=document.getElementById('buildLine');
  if(!btn)return;

  const dist2=(a,b)=>{const r=a[0]-b[0],g=a[1]-b[1],bb=a[2]-b[2];return r*r+g*g+bb*bb;};
  function nearestColour(rgb,palette){let best=0,bd=Infinity;for(let i=0;i<palette.length;i++){const d=dist2(rgb,palette[i]);if(d<bd){bd=d;best=i;}}return best;}
  function hashString(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

  function drawOriginal(im){
    const w=Math.min(1000,im.naturalWidth),h=Math.round(w*im.naturalHeight/im.naturalWidth);
    cvs.segmented.width=w;cvs.segmented.height=h;ctx.segmented.clearRect(0,0,w,h);
    ctx.segmented.imageSmoothingEnabled=true;ctx.segmented.imageSmoothingQuality='high';ctx.segmented.drawImage(im,0,0,w,h);
  }

  function buildSeeds(w,h,target,rand){
    const aspect=w/h,cols=Math.max(8,Math.round(Math.sqrt(target*aspect))),rows=Math.max(10,Math.round(target/cols));
    const cw=w/cols,ch=h/rows,seeds=[];
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const jx=(rand()-.5)*cw*.72,jy=(rand()-.5)*ch*.72;
      seeds.push({x:(c+.5)*cw+jx,y:(r+.5)*ch+jy,row:r,col:c});
    }
    return{seeds,cols,rows,cw,ch};
  }

  function makeOrganicRegions(w,h,grid,rand){
    const {seeds,cols,rows,cw,ch}=grid,L=new Uint16Array(w*h);
    const ampX=cw*.42,ampY=ch*.40;
    const f1=24+rand()*18,f2=31+rand()*20,f3=18+rand()*16;
    const p1=rand()*Math.PI*2,p2=rand()*Math.PI*2,p3=rand()*Math.PI*2,p4=rand()*Math.PI*2;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const wx=x + Math.sin(y/f1+p1)*ampX + Math.sin((x+y)/f2+p2)*ampX*.28;
      const wy=y + Math.sin(x/f3+p3)*ampY + Math.cos((x-y)/f2+p4)*ampY*.26;
      const gc=Math.max(0,Math.min(cols-1,Math.floor(wx/cw))),gr=Math.max(0,Math.min(rows-1,Math.floor(wy/ch)));
      let best=0,bd=Infinity;
      for(let rr=Math.max(0,gr-2);rr<=Math.min(rows-1,gr+2);rr++)for(let cc=Math.max(0,gc-2);cc<=Math.min(cols-1,gc+2);cc++){
        const id=rr*cols+cc,s=seeds[id];
        if(!s)continue;
        const dx=wx-s.x,dy=wy-s.y;
        // Unequal weighting prevents a sterile honeycomb look.
        const d=dx*dx*(.82+((id%5)*.045))+dy*dy*(.88+((id%7)*.03));
        if(d<bd){bd=d;best=id;}
      }
      L[y*w+x]=best;
    }
    return L;
  }

  function regionStats(L,w,h,data,seedCount){
    const count=new Uint32Array(seedCount),rs=new Float64Array(seedCount),gs=new Float64Array(seedCount),bs=new Float64Array(seedCount),xs=new Float64Array(seedCount),ys=new Float64Array(seedCount);
    for(let i=0;i<L.length;i++){
      const id=L[i],j=i*4,x=i%w,y=(i/w)|0;count[id]++;rs[id]+=data[j];gs[id]+=data[j+1];bs[id]+=data[j+2];xs[id]+=x;ys[id]+=y;
    }
    const out=[];
    for(let id=0;id<seedCount;id++)if(count[id])out.push({id,count:count[id],rgb:[rs[id]/count[id],gs[id]/count[id],bs[id]/count[id]],cx:xs[id]/count[id],cy:ys[id]/count[id]});
    return out;
  }

  function sobelHints(im,outW,outH,strong){
    if(!strong)return null;
    const w=120,h=Math.max(80,Math.round(w*im.naturalHeight/im.naturalWidth)),c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d',{willReadFrequently:true});g.filter='blur(1.7px)';g.drawImage(im,0,0,w,h);
    const d=g.getImageData(0,0,w,h).data,lum=new Float32Array(w*h),mag=new Float32Array(w*h);
    for(let i=0;i<w*h;i++){const j=i*4;lum[i]=d[j]*.299+d[j+1]*.587+d[j+2]*.114;}
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x,gx=(-lum[i-w-1]-2*lum[i-1]-lum[i+w-1])+(lum[i-w+1]+2*lum[i+1]+lum[i+w+1]),gy=(-lum[i-w-1]-2*lum[i-w]-lum[i-w+1])+(lum[i+w-1]+2*lum[i+w]+lum[i+w+1]);
      mag[i]=Math.sqrt(gx*gx+gy*gy);
    }
    const o=document.createElement('canvas');o.width=outW;o.height=outH;const oc=o.getContext('2d'),sx=outW/w,sy=outH/h;
    oc.strokeStyle='rgba(20,20,20,.55)';oc.lineWidth=1.45;oc.lineCap='round';oc.beginPath();
    const threshold=155;
    for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
      const i=y*w+x;if(mag[i]<threshold)continue;
      let neighbours=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(mag[(y+yy)*w+x+xx]>=threshold*.85)neighbours++;
      if(neighbours<4)continue;
      // Sparse sampling leaves only the strongest long-form hints instead of retracing the photograph.
      if((x+y)%2)continue;
      oc.moveTo(x*sx,y*sy);oc.lineTo((x+1.3)*sx,(y+.2)*sy);
    }
    oc.stroke();return o;
  }

  function renderMystery(L,w,h,stats,palette,outW,outH,strong,im){
    const out=document.createElement('canvas');out.width=outW;out.height=outH;const c=out.getContext('2d'),sx=outW/w,sy=outH/h;
    c.fillStyle='#fff';c.fillRect(0,0,outW,outH);c.strokeStyle='#242424';c.lineWidth=1.2;c.lineCap='round';c.lineJoin='round';c.beginPath();
    for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
      const i=y*w+x,id=L[i];
      if(L[i+1]!==id){const xx=(x+1)*sx;c.moveTo(xx,y*sy);c.lineTo(xx,(y+1)*sy);}
      if(L[i+w]!==id){const yy=(y+1)*sy;c.moveTo(x*sx,yy);c.lineTo((x+1)*sx,yy);}
    }
    c.stroke();
    const hints=sobelHints(im,outW,outH,strong);if(hints)c.drawImage(hints,0,0);
    c.textAlign='center';c.textBaseline='middle';
    for(const s of stats){
      if(s.count<20)continue;
      const pal=nearestColour(s.rgb,palette),code=typeof codeFor==='function'?codeFor(pal):String(pal+1),px=s.cx*sx,py=s.cy*sy;
      const approx=Math.sqrt(s.count*sx*sy),fs=Math.max(7,Math.min(13,Math.floor(approx*.13)));c.font=`700 ${fs}px system-ui`;
      const tw=c.measureText(code).width;if(tw>approx*.48)continue;
      c.fillStyle='rgba(255,255,255,.96)';c.fillRect(px-tw/2-2,py-fs/2-1,tw+4,fs+2);c.fillStyle='#222';c.fillText(code,px,py+.2);
    }
    return out;
  }

  btn.onclick=async()=>{
    if(!current?.keyApproved||!current.palette)return alert('Approve the Colour Key first.');
    btn.disabled=true;const status=document.getElementById('lineStatus');status.innerHTML='<small>Building an abstract mystery pattern and assigning each region from the artwork underneath…</small>';
    try{
      artImg=await loadImage(current.artwork);drawOriginal(artImg);
      const detail=document.getElementById('detail').value,outline=document.getElementById('outline').value==='strong';
      const target=detail==='simple'?220:detail==='standard'?360:520;
      const workW=detail==='simple'?230:detail==='standard'?280:330,scale=Math.min(1,workW/artImg.naturalWidth),w=Math.max(100,Math.round(artImg.naturalWidth*scale)),h=Math.max(120,Math.round(artImg.naturalHeight*scale));
      const work=document.createElement('canvas');work.width=w;work.height=h;const wc=work.getContext('2d',{willReadFrequently:true});wc.imageSmoothingEnabled=true;wc.imageSmoothingQuality='high';wc.drawImage(artImg,0,0,w,h);const data=wc.getImageData(0,0,w,h).data;
      const seed=hashString(String(current.id||'design')+'-'+Date.now()),rand=rng(seed),grid=buildSeeds(w,h,target,rand),L=makeOrganicRegions(w,h,grid,rand),stats=regionStats(L,w,h,data,grid.seeds.length);
      const outW=Math.min(1000,artImg.naturalWidth),outH=Math.round(outW*artImg.naturalHeight/artImg.naturalWidth),line=renderMystery(L,w,h,stats,current.palette,outW,outH,outline,artImg);
      cvs.mystery.width=outW;cvs.mystery.height=outH;ctx.mystery.clearRect(0,0,outW,outH);ctx.mystery.drawImage(line,0,0);
      current.segmented=current.artwork;current.mystery=cvs.mystery.toDataURL('image/png');current.lineApproved=false;current.finalApproved=false;current.status='key approved';current.mysteryRegionCount=stats.length;
      if(typeof save==='function')save();document.getElementById('approveLine').disabled=false;
      status.innerHTML=`<small><strong>${stats.length} abstract mystery regions.</strong> These regions are intentionally not traced from colour or object boundaries. Each one samples the finished image underneath and receives the nearest approved palette code.</small>`;
    }catch(err){console.error(err);status.innerHTML='<small>Mystery pattern generation failed. Please try again.</small>';}finally{btn.disabled=false;}
  };
})();