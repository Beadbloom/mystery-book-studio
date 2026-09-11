// Mystery Book Studio — crisp-preserving line-art renderer v5
// Stage 3 uses a hidden simplified working map for line boundaries, while the visible artwork stays untouched.
(function(){
  const btn=document.getElementById('buildLine');
  if(!btn)return;

  function dist2(a,b){const r=a[0]-b[0],g=a[1]-b[1],bl=a[2]-b[2];return r*r+g*g+bl*bl;}
  function nearestColour(rgb,palette){let best=0,bd=Infinity;for(let i=0;i<palette.length;i++){const d=dist2(rgb,palette[i]);if(d<bd){bd=d;best=i;}}return best;}
  function majorityPass(L,w,h,radius=1){
    const O=new Uint8Array(L.length),counts=new Uint16Array(32);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      counts.fill(0);
      for(let yy=Math.max(0,y-radius);yy<=Math.min(h-1,y+radius);yy++)for(let xx=Math.max(0,x-radius);xx<=Math.min(w-1,x+radius);xx++)counts[L[yy*w+xx]]++;
      let best=L[y*w+x],bn=counts[best];for(let k=0;k<counts.length;k++)if(counts[k]>bn){best=k;bn=counts[k];}O[y*w+x]=best;
    }
    return O;
  }
  function findComponents(L,w,h){
    const seen=new Uint8Array(L.length),q=new Int32Array(L.length),comps=[];
    for(let st=0;st<L.length;st++){
      if(seen[st])continue;const lab=L[st];let head=0,tail=0,sx=0,sy=0,minx=w,maxx=0,miny=h,maxy=0;const pts=[];q[tail++]=st;seen[st]=1;
      while(head<tail){
        const i=q[head++],x=i%w,y=(i/w)|0;pts.push(i);sx+=x;sy+=y;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
        const ns=[x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1];
        for(const n of ns)if(n>=0&&!seen[n]&&L[n]===lab){seen[n]=1;q[tail++]=n;}
      }
      comps.push({lab,pts,size:pts.length,cx:sx/pts.length,cy:sy/pts.length,minx,maxx,miny,maxy});
    }
    return comps;
  }
  function mergeSmall(L,w,h,palette,minArea){
    const comps=findComponents(L,w,h).sort((a,b)=>a.size-b.size);let changed=false;
    for(const c of comps){
      if(c.size>=minArea)break;const adj=new Map();
      for(const i of c.pts){const x=i%w,y=(i/w)|0;for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&L[n]!==c.lab)adj.set(L[n],(adj.get(L[n])||0)+1);}
      if(!adj.size)continue;let best=c.lab,bestScore=-Infinity;
      for(const [lab,boundary] of adj){const colourPenalty=Math.sqrt(dist2(palette[c.lab],palette[lab]))*.08,score=boundary-colourPenalty;if(score>bestScore){bestScore=score;best=lab;}}
      if(best!==c.lab){for(const i of c.pts)L[i]=best;changed=true;}
    }
    return changed;
  }
  function cleanToTarget(L,w,h,palette,detail){
    const target=detail==='simple'?260:detail==='standard'?380:520,maxTarget=detail==='simple'?340:detail==='standard'?500:680;
    const passes=detail==='simple'?3:detail==='standard'?2:1;for(let i=0;i<passes;i++)L=majorityPass(L,w,h,1);
    const schedule=detail==='simple'?[12,20,32,48,72,105,150,215]:detail==='standard'?[8,14,22,34,50,72,100,140,190]:[5,9,14,21,30,42,58,78,105,140];
    for(const area of schedule){for(let r=0;r<2;r++)mergeSmall(L,w,h,palette,area);L=majorityPass(L,w,h,1);if(findComponents(L,w,h).length<=target)break;}
    let area=schedule[schedule.length-1],comps=findComponents(L,w,h);
    while(comps.length>maxTarget&&area<520){area=Math.round(area*1.35);mergeSmall(L,w,h,palette,area);L=majorityPass(L,w,h,1);comps=findComponents(L,w,h);}
    return{L,comps};
  }
  function labelPoint(c,L,w,h){
    let best={x:Math.round(c.cx),y:Math.round(c.cy),r:0};const span=Math.max(1,Math.min(c.maxx-c.minx,c.maxy-c.miny)),step=Math.max(1,Math.floor(span/10));
    for(let y=c.miny;y<=c.maxy;y+=step)for(let x=c.minx;x<=c.maxx;x+=step){
      if(L[y*w+x]!==c.lab)continue;let r=1;
      outer:for(;r<=16;r++){if(x-r<0||x+r>=w||y-r<0||y+r>=h)break;for(let xx=x-r;xx<=x+r;xx++)if(L[(y-r)*w+xx]!==c.lab||L[(y+r)*w+xx]!==c.lab)break outer;for(let yy=y-r;yy<=y+r;yy++)if(L[yy*w+x-r]!==c.lab||L[yy*w+x+r]!==c.lab)break outer;}
      if(r>best.r)best={x,y,r};
    }
    return best;
  }
  function renderLine(L,w,h,comps,detail,strong){
    const low=document.createElement('canvas');low.width=w;low.height=h;const lc=low.getContext('2d');lc.fillStyle='#fff';lc.fillRect(0,0,w,h);
    const edges=lc.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x,lab=L[i],boundary=x===0||y===0||x===w-1||y===h-1||(x<w-1&&L[i+1]!==lab)||(y<h-1&&L[i+w]!==lab);
      if(boundary){const j=i*4;edges.data[j]=30;edges.data[j+1]=30;edges.data[j+2]=30;edges.data[j+3]=255;}
    }
    lc.putImageData(edges,0,0);
    if(strong){lc.globalAlpha=.18;lc.drawImage(low,-1,0);lc.drawImage(low,1,0);lc.globalAlpha=1;}
    lc.textAlign='center';lc.textBaseline='middle';const minLabelArea=detail==='simple'?22:detail==='standard'?16:12;
    for(const comp of comps){if(comp.size<minLabelArea)continue;const p=labelPoint(comp,L,w,h),code=typeof codeFor==='function'?codeFor(comp.lab):String(comp.lab+1);let fs=Math.max(5,Math.min(11,Math.floor(p.r*1.05)));lc.font=`700 ${fs}px system-ui`;const tw=lc.measureText(code).width;if(p.r<3||tw>Math.max(5,p.r*2.2))continue;lc.fillStyle='rgba(255,255,255,.92)';lc.fillRect(p.x-tw/2-1.5,p.y-fs/2-1,tw+3,fs+2);lc.fillStyle='#222';lc.fillText(code,p.x,p.y+.2);}
    return low;
  }
  function drawCrispOriginal(im){
    const outW=Math.min(1000,im.naturalWidth),outH=Math.round(outW*im.naturalHeight/im.naturalWidth);cvs.segmented.width=outW;cvs.segmented.height=outH;ctx.segmented.clearRect(0,0,outW,outH);ctx.segmented.imageSmoothingEnabled=true;ctx.segmented.imageSmoothingQuality='high';ctx.segmented.drawImage(im,0,0,outW,outH);
  }

  btn.onclick=async()=>{
    if(!current?.keyApproved||!current.palette)return alert('Approve the Colour Key first.');
    btn.disabled=true;const status=document.getElementById('lineStatus');status.innerHTML='<small>Creating the colouring regions while keeping your original artwork untouched…</small>';
    try{
      artImg=await loadImage(current.artwork);const detail=document.getElementById('detail').value;
      drawCrispOriginal(artImg);
      const targetW=detail==='simple'?230:detail==='standard'?270:310,scale=Math.min(1,targetW/artImg.naturalWidth),w=Math.max(80,Math.round(artImg.naturalWidth*scale)),h=Math.max(80,Math.round(artImg.naturalHeight*scale));
      const work=document.createElement('canvas');work.width=w;work.height=h;const wc=work.getContext('2d',{willReadFrequently:true});wc.imageSmoothingEnabled=true;wc.imageSmoothingQuality='high';wc.filter=detail==='simple'?'blur(4px)':detail==='standard'?'blur(3px)':'blur(2px)';wc.drawImage(artImg,0,0,w,h);
      const d=wc.getImageData(0,0,w,h).data;let L=new Uint8Array(w*h);for(let i=0;i<L.length;i++){const j=i*4;L[i]=nearestColour([d[j],d[j+1],d[j+2]],current.palette);}
      const cleaned=cleanToTarget(L,w,h,current.palette,detail);L=cleaned.L;const comps=findComponents(L,w,h),lineLow=renderLine(L,w,h,comps,detail,document.getElementById('outline').value==='strong');
      const outW=Math.min(900,artImg.naturalWidth),outH=Math.round(outW*artImg.naturalHeight/artImg.naturalWidth);cvs.mystery.width=outW;cvs.mystery.height=outH;ctx.mystery.fillStyle='#fff';ctx.mystery.fillRect(0,0,outW,outH);ctx.mystery.imageSmoothingEnabled=true;ctx.mystery.imageSmoothingQuality='high';ctx.mystery.drawImage(lineLow,0,0,outW,outH);
      current.segmented=current.artwork; // preserve the exact approved artwork; never replace it with the working blob map
      current.mystery=cvs.mystery.toDataURL('image/png');current.lineApproved=false;current.finalApproved=false;current.status='key approved';if(typeof save==='function')save();document.getElementById('approveLine').disabled=false;
      status.innerHTML=`<small><strong>${comps.length} colouring regions.</strong> The simplified map is now used only behind the scenes for the line art. Your original artwork stays crisp and unchanged.</small>`;
    }catch(err){console.error(err);status.innerHTML='<small>Line generation failed. Please try again.</small>';}finally{btn.disabled=false;}
  };
})();
