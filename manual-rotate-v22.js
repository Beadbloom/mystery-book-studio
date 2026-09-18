/* v22 manual rotation controls for upload/editor */
(()=>{
  function normalize(d){ if(d){ d.mainRotation=((d.mainRotation||0)%360+360)%360; d.lineRotation=((d.lineRotation||0)%360+360)%360; } }
  function rotatedData(src,degrees){
    return new Promise(async resolve=>{
      if(!src||!degrees)return resolve(src);
      const im=await img(src),rad=((degrees%360)+360)%360;
      const c=document.createElement('canvas'),swap=rad===90||rad===270;
      c.width=swap?im.naturalHeight:im.naturalWidth;c.height=swap?im.naturalWidth:im.naturalHeight;
      const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(rad*Math.PI/180);
      x.drawImage(im,-im.naturalWidth/2,-im.naturalHeight/2);resolve(c.toDataURL('image/png'));
    });
  }
  function addControls(previewId,type,label){
    const im=document.getElementById(previewId); if(!im||document.getElementById(type+'RotateControls'))return;
    const wrap=document.createElement('div');wrap.id=type+'RotateControls';wrap.className='v22Rotate';
    wrap.innerHTML='<small>'+label+'</small><div><button type="button" data-r="-90">↶ Rotate left</button><button type="button" data-r="90">↷ Rotate right</button></div>';
    im.closest('.preview')?.after(wrap);
    wrap.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{
      if(!current)return;normalize(current);
      const key=type==='main'?'mainRotation':'lineRotation';
      current[key]=(current[key]+Number(b.dataset.r)+360)%360;
      await refreshPreviews(); await save();
    });
  }
  async function refreshPreviews(){
    if(!current)return;normalize(current);
    const mp=document.getElementById('mainPreview'),lp=document.getElementById('linePreview');
    if(mp&&current.main)mp.src=await rotatedData(current.main,current.mainRotation);
    if(lp&&current.line)lp.src=await rotatedData(current.line,current.lineRotation);
  }
  async function bake(){
    if(!current)return;normalize(current);
    if(current.main){current.artwork=await rotatedData(current.main,current.mainRotation);}
    if(current.line){current.mysteryArt=await rotatedData(current.line,current.lineRotation);}
  }
  addControls('mainPreview','main','Rotate the completed artwork before approving it.');
  addControls('linePreview','line','Rotate the colourless mystery artwork before approving it.');
  const style=document.createElement('style');style.textContent='.v22Rotate{margin:7px 0 10px}.v22Rotate small{display:block;margin-bottom:5px}.v22Rotate>div{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v22Rotate button{min-height:36px;font-size:11px}';document.head.appendChild(style);
  const oldOpen=openCurrent;openCurrent=async function(){normalize(current);await oldOpen();await refreshPreviews()};
  const approve=document.getElementById('approvePair');
  if(approve){const old=approve.onclick;approve.onclick=async function(e){await bake();if(!current?.main||!current?.line||!current?.swatchSource)return;current.pairApproved=true;current.paletteApproved=false;current.pagesApproved=false;current.complete=false;current.palette=null;current.codes=null;await save();setStage('palette');};}
})();