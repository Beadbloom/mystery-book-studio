// Mystery Book Studio — edge-aware structured line-art renderer v6
// Keeps the original artwork untouched and uses original-image edges to protect important shapes while cleaning texture.
(function(){
  const btn=document.getElementById('buildLine');
  if(!btn)return;

  function dist2(a,b){const r=a[0]-b[0],g=a[1]-b[1],bl=a[2]-b[2];return r*r+g*g+bl*bl;}
  function nearestColour(rgb,palette){let best=0,bd=Infinity;for(let i=0;i<palette.length;i++){const d=dist2(rgb,palette[i]);if(d<bd){bd=d;best=i;}}return best;}

  function gradientMap(data,w,h){
    const lum=new Float32Array(w*h),g=new Float32Array(w*h);
    for(let i=0;i<w*h;i++){const j=i*4;lum[i]=data[j]*.299+data[j+1]*.587+data[j+2]*.114;}
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x;
      const gx=(-lum[i-w-1]-2*lum[i-1]-lum[i+w-1])+(lum[i-w+1]+2*lum[i+1]+lum[i+w+1]);
      const gy=(-lum[i-w-1]-2*lum[i-w]-lum[i-w+1])+(lum[i+w-1]+2*lum[i+w]+lum[i+w+1]);
      g[i]=Math.min(255,Math.sqrt(gx*gx+gy*gy));
    }
    return g;
  }

  function edgeAwareMajority(L,w,h,G,edgeProtect){
    const O=new Uint8Array(L.length),counts=new Uint16Array(32);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x;if(G[i]>=edgeProtect){O[i]=L[i];continue;}
      counts.fill(0);
      for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
        const n=yy*w+xx;if(G[n]<edgeProtect*1.25)counts[L[n]]++;
      }
      let best=L[i],bn=counts[best];for(let k=0;k<counts.length;k++)if(counts[k]>bn){best=k;bn=counts[k];}O[i]=best;
    }
    return O;
  }

  function findComponents(L,w,h){
    const seen=new Uint8Array(L.length),q=new Int32Array(L.length),comps=[];
    for(let st=0;st<L.length;st++){
      if(seen[st])continue;const lab=L[st];let head=0,tail=0,sx=0,sy=0,minx=w,maxx=0,miny=h,maxy=0;const pts=[];q[tail++]=st;seen[st]=1;
      while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;pts.push(i);sx+=x;sy+=y;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&L[n]===lab){seen[n]=1;q[tail++]=n;}}
      comps.push({lab,pts,size:pts.length,cx:sx/pts.length,cy:sy/pts.length,minx,maxx,miny,maxy});
    }
    return comps;
  }

  function mergeSmall(L,w,h,palette,G,minArea,edgeProtect){
    const comps=findComponents(L,w,h).sort((a,b)=>a.size-b.size);let changed=false;
    for(const c of comps){
      if(c.size>=minArea)break;const adj=new Map();
      for(const i of c.pts){const x=i%w,y=(i/w)|0;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&L[n]!==c.lab){let a=adj.get(L[n])||{count:0,edge:0};a.count++;a.edge+=Math.max(G[i],G[n]);adj.set(L[n],a);}}
      if(!adj.size)continue;let best=c.lab,bestScore=-Infinity;
      for(const [lab,a] of adj){const avgEdge=a.edge/a.count;if(avgEdge>edgeProtect*1.35)continue;const colourPenalty=Math.sqrt(dist2(palette[c.lab],palette[lab]))*.045;const edgePenalty=avgEdge*.20;const score=a.count-colourPenalty-edgePenalty;if(score>bestScore){bestScore=score;best=lab;}}
      if(best!==c.lab){for(const i of c.pts)L[i]=best;changed=true;}
    }
    return changed;
  }

  function cleanRegions(L,w,h,palette,G,detail){
    const edgeProtect=detail==='simple'?62:detail==='standard'?52:44;
    const target=detail==='simple'?320:detail==='standard'?520:780;
    const maxTarget=detail==='simple'?430:detail==='standard'?680:980;
    const passes=detail==='simple'?2:1;
    for(let i=0;i<passes;i++)L=edgeAwareMajority(L,w,h,G,edgeProtect);
    const schedule=detail==='simple'?[10,18,28,42,60,85]:detail==='standard'?[7,12,20,30,44,62]:[4,7,11,16,23,32,44];
    for(const area of schedule){mergeSmall(L,w,h,palette,G,area,edgeProtect);L=edgeAwareMajority(L,w,h,G,edgeProtect);if(findComponents(L,w,h).length<=target)break;}
    let comps=findComponents(L,w,h),area=schedule[schedule.length-1];
    while(comps.length>maxTarget&&area<150){area=Math.round(area*1.25);mergeSmall(L,w,h,palette,G,area,edgeProtect);comps=findComponents(L,w,h);}
    return{L,comps,edgeProtect};
  }

  function labelPoint(c,L,w,h){
    let best={x:Math.round(c.cx),y:Math.round(c.cy),r:0};const span=Math.max(1,Math.min(c.maxx-c.minx,c.maxy-c.miny)),step=Math.max(1,Math.floor(span/12));
    for(let y=c.miny;y<=c.maxy;y+=step)for(let x=c.minx;x<=c.maxx;x+=step){if(L[y*w+x]!==c.lab)continue;let r=1;outer:for(;r<=20;r++){if(x-r<0||x+r>=w||y-r<0||y+r>=h)break;for(let xx=x-r;xx<=x+r;xx++)if(L[(y-r)*w+xx]!==c.lab||L[(y+r)*w+xx]!==c.lab)break outer;for(let yy=y-r;yy<=y+r;yy++)if(L[yy*w+x-r]!==c.lab||L[yy*w+x+r]!==c.lab)break outer;}if(r>best.r)best={x,y,r};}
    return best;
  }

  function renderLine(L,w,h,comps,G,edgeProtect,detail,strong,outW,outH){
    const out=document.createElement('canvas');out.width=outW;out.height=outH;const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,outW,outH);
    const sx=outW/w,sy=outH/h;c.strokeStyle='#222';c.lineCap='round';c.lineJoin='round';c.lineWidth=strong?1.35:1.05;
    c.beginPath();
    for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
      const i=y*w+x,l=L[i];
      if(L[i+1]!==l){const xx=(x+1)*sx,yy=y*sy;const strongEdge=Math.max(G[i],G[i+1])>=edgeProtect;c.moveTo(xx,yy);c.lineTo(xx,(y+1)*sy);if(strong&&strongEdge){/* protected by same path; extra pass below */}}
      if(L[i+w]!==l){const xx=x*sx,yy=(y+1)*sy;c.moveTo(xx,yy);c.lineTo((x+1)*sx,yy);}
    }
    c.stroke();
    if(strong){
      c.strokeStyle='rgba(20,20,20,.55)';c.lineWidth=1.8;c.beginPath();
      for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
        const i=y*w+x,l=L[i];
        if(L[i+1]!==l&&Math.max(G[i],G[i+1])>=edgeProtect){const xx=(x+1)*sx;c.moveTo(xx,y*sy);c.lineTo(xx,(y+1)*sy);}
        if(L[i+w]!==l&&Math.max(G[i],G[i+w])>=edgeProtect){const yy=(y+1)*sy;c.moveTo(x*sx,yy);c.lineTo((x+1)*sx,yy);}
      }
      c.stroke();
    }
    c.textAlign='center';c.textBaseline='middle';const minArea=detail==='simple'?28:detail==='standard'?22:18;
    for(const comp of comps){if(comp.size<minArea)continue;const p=labelPoint(comp,L,w,h),code=typeof codeFor==='function'?codeFor(comp.lab):String(comp.lab+1);if(p.r<4)continue;let fs=Math.max(7,Math.min(14,Math.floor(p.r*1.05*sx)));c.font=`700 ${fs}px system-ui`;const tw=c.measureText(code).width;if(tw>Math.max(7,p.r*sx*1.8))continue;const px=p.x*sx,py=p.y*sy;c.fillStyle='rgba(255,255,255,.95)';c.fillRect(px-tw/2-2,py-fs/2-1,tw+4,fs+2);c.fillStyle='#222';c.fillText(code,px,py+.2);}
    return out;
  }

  function drawCrispOriginal(im){const outW=Math.min(1000,im.naturalWidth),outH=Math.round(outW*im.naturalHeight/im.naturalWidth);cvs.segmented.width=outW;cvs.segmented.height=outH;ctx.segmented.clearRect(0,0,outW,outH);ctx.segmented.imageSmoothingEnabled=true;ctx.segmented.imageSmoothingQuality='high';ctx.segmented.drawImage(im,0,0,outW,outH);}

  btn.onclick=async()=>{
    if(!current?.keyApproved||!current.palette)return alert('Approve the Colour Key first.');
    btn.disabled=true;const status=document.getElementById('lineStatus');status.innerHTML='<small>Protecting the main shapes and building cleaner colouring regions…</small>';
    try{
      artImg=await loadImage(current.artwork);const detail=document.getElementById('detail').value;drawCrispOriginal(artImg);
      const targetW=detail==='simple'?340:detail==='standard'?430:520,scale=Math.min(1,targetW/artImg.naturalWidth),w=Math.max(120,Math.round(artImg.naturalWidth*scale)),h=Math.max(120,Math.round(artImg.naturalHeight*scale));
      const work=document.createElement('canvas');work.width=w;work.height=h;const wc=work.getContext('2d',{willReadFrequently:true});wc.imageSmoothingEnabled=true;wc.imageSmoothingQuality='high';wc.filter=detail==='simple'?'blur(1.8px)':detail==='standard'?'blur(1.1px)':'blur(.6px)';wc.drawImage(artImg,0,0,w,h);
      const imgData=wc.getImageData(0,0,w,h),d=imgData.data,G=gradientMap(d,w,h);let L=new Uint8Array(w*h);for(let i=0;i<L.length;i++){const j=i*4;L[i]=nearestColour([d[j],d[j+1],d[j+2]],current.palette);}
      const cleaned=cleanRegions(L,w,h,current.palette,G,detail);L=cleaned.L;const comps=findComponents(L,w,h);
      const outW=Math.min(1000,artImg.naturalWidth),outH=Math.round(outW*artImg.naturalHeight/artImg.naturalWidth),line=renderLine(L,w,h,comps,G,cleaned.edgeProtect,detail,document.getElementById('outline').value==='strong',outW,outH);
      cvs.mystery.width=outW;cvs.mystery.height=outH;ctx.mystery.clearRect(0,0,outW,outH);ctx.mystery.drawImage(line,0,0);
      current.segmented=current.artwork;current.mystery=cvs.mystery.toDataURL('image/png');current.lineApproved=false;current.finalApproved=false;current.status='key approved';if(typeof save==='function')save();document.getElementById('approveLine').disabled=false;
      status.innerHTML=`<small><strong>${comps.length} colouring regions.</strong> Important original edges are protected so the character, castle, moon and scene structure stay recognisable instead of melting into colour blobs.</small>`;
    }catch(err){console.error(err);status.innerHTML='<small>Line generation failed. Please try again.</small>';}finally{btn.disabled=false;}
  };
})();
