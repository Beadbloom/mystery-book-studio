// Mystery Book Studio — paired master workflow v10
// The browser app no longer tries to recreate semantic mystery artwork from a finished illustration.
// Stage 3 accepts the matching mystery-page master created alongside the finished artwork, preserving the design translation exactly.
(function(){
  const btn=document.getElementById('buildLine');
  const stage=document.getElementById('lineStage');
  if(!btn||!stage)return;

  // Replace the old algorithm controls with a faithful paired-master workflow.
  const row=stage.querySelector('.row');
  if(row) row.style.display='none';
  const help=stage.querySelector('small');
  if(help) help.textContent='Use the matching mystery-page master created with the finished artwork. This preserves the same composition, silhouettes and designed colouring regions instead of asking the browser to reinterpret the picture.';
  btn.style.display='none';

  const existing=document.getElementById('pairedMysteryBox');
  if(!existing){
    const box=document.createElement('div');
    box.id='pairedMysteryBox';
    box.style.cssText='margin:12px 0;padding:12px;border:1px solid #dddde6;border-radius:12px;background:#fafaff';
    box.innerHTML=`<label style="margin-bottom:7px">Matching mystery-page image</label>
      <input id="mysteryUpload" type="file" accept="image/*">
      <small>Upload the black-and-white numbered mystery page that belongs to this exact finished illustration. It will be stored as the paired master for this design.</small>
      <button id="useMysteryUpload" class="primary" style="margin-top:10px" disabled>Use matching mystery page</button>`;
    const previews=stage.querySelector('.twocol');
    stage.insertBefore(box,previews);
  }

  const upload=document.getElementById('mysteryUpload');
  const use=document.getElementById('useMysteryUpload');
  const status=document.getElementById('lineStatus');
  let pendingData=null;

  upload.onchange=e=>{
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        pendingData=r.result;
        const outW=Math.min(1000,im.naturalWidth),outH=Math.round(outW*im.naturalHeight/im.naturalWidth);
        cvs.mystery.width=outW;cvs.mystery.height=outH;
        ctx.mystery.clearRect(0,0,outW,outH);ctx.mystery.fillStyle='#fff';ctx.mystery.fillRect(0,0,outW,outH);
        ctx.mystery.imageSmoothingEnabled=true;ctx.mystery.imageSmoothingQuality='high';ctx.mystery.drawImage(im,0,0,outW,outH);
        use.disabled=false;
        status.innerHTML='<small>Preview loaded. Check that this is the matching mystery page for the finished artwork, then tap “Use matching mystery page”.</small>';
      };
      im.src=r.result;
    };
    r.readAsDataURL(f);
  };

  use.onclick=()=>{
    if(!current?.keyApproved)return alert('Approve the Colour Key first.');
    if(!pendingData)return alert('Choose the matching mystery-page image first.');
    current.segmented=current.artwork;
    current.mystery=cvs.mystery.toDataURL('image/png');
    current.lineApproved=false;current.finalApproved=false;current.status='key approved';
    current.mysterySource='paired-master';
    if(typeof save==='function')save();
    document.getElementById('approveLine').disabled=false;
    status.innerHTML='<small><strong>Paired mystery master loaded.</strong> The app has not regenerated or reinterpreted the line art.</small>';
  };

  // Preserve the crisp original preview whenever Stage 3 is opened.
  async function showOriginal(){
    if(!current?.artwork)return;
    try{
      const im=await loadImage(current.artwork);
      const w=Math.min(1000,im.naturalWidth),h=Math.round(w*im.naturalHeight/im.naturalWidth);
      cvs.segmented.width=w;cvs.segmented.height=h;ctx.segmented.clearRect(0,0,w,h);
      ctx.segmented.imageSmoothingEnabled=true;ctx.segmented.imageSmoothingQuality='high';ctx.segmented.drawImage(im,0,0,w,h);
    }catch(e){}
  }
  showOriginal();
})();