/* v25 interactive crop for completed + mystery artwork */
(()=>{
 const targets={main:{preview:'mainPreview',label:'Completed artwork'},line:{preview:'linePreview',label:'Colourless mystery'}};
 function key(t){return t==='main'?'main':'line'}
 function ensure(){
  Object.entries(targets).forEach(([t,o])=>{
   const im=document.getElementById(o.preview);if(!im||document.getElementById('cropControls-'+t))return;
   const box=document.createElement('div');box.id='cropControls-'+t;box.className='v25CropControls';
   box.innerHTML='<button type="button" class="small cropOpen">✂ Crop image</button><button type="button" class="small cropReset">Reset image</button>';
   const rotate=document.getElementById(t+'RotateControls');(rotate||im.closest('.preview')).after(box);
   box.querySelector('.cropOpen').onclick=()=>openCrop(t);box.querySelector('.cropReset').onclick=()=>reset(t);
  });
  if(!document.getElementById('cropModal')){
   const m=document.createElement('div');m.id='cropModal';m.className='v25Modal hidden';m.innerHTML='<div class="v25Panel"><div class="v25Head"><strong id="cropTitle">Crop image</strong><button id="cropClose">×</button></div><div class="v25CanvasWrap"><canvas id="cropCanvas"></canvas><div id="cropRect" class="v25Rect"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div></div><div class="note">Drag inside the box to move it. Drag a corner to resize it. Everything outside the box will be removed.</div><div class="v25Actions"><button id="cropCancel">Cancel</button><button id="cropFull">Use full image</button><button id="cropConfirm" class="primary">Confirm crop</button></div></div>';document.body.appendChild(m);
   document.getElementById('cropClose').onclick=close;document.getElementById('cropCancel').onclick=close;document.getElementById('cropFull').onclick=full;document.getElementById('cropConfirm').onclick=confirm;
  }
 }
 let active=null,rect={x:.03,y:.03,w:.94,h:.94},drag=null;
 async function openCrop(t){
  if(!current||!current[key(t)])return;active=t;
  const src=current[key(t)],im=await img(src),c=document.getElementById('cropCanvas'),wrap=c.parentElement;
  c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);
  rect=current[t+'Crop']||{x:.03,y:.03,w:.94,h:.94};document.getElementById('cropTitle').textContent='Crop '+targets[t].label;
  document.getElementById('cropModal').classList.remove('hidden');requestAnimationFrame(()=>{fitCanvas();drawRect();bindDrag()});
 }
 function fitCanvas(){const c=document.getElementById('cropCanvas'),wrap=c.parentElement,maxW=Math.min(innerWidth-48,850),maxH=Math.min(innerHeight-230,700),s=Math.min(maxW/c.width,maxH/c.height,1);c.style.width=(c.width*s)+'px';c.style.height=(c.height*s)+'px';wrap.style.width=c.style.width;wrap.style.height=c.style.height}
 function drawRect(){const r=document.getElementById('cropRect');r.style.left=(rect.x*100)+'%';r.style.top=(rect.y*100)+'%';r.style.width=(rect.w*100)+'%';r.style.height=(rect.h*100)+'%'}
 function bindDrag(){
  const el=document.getElementById('cropRect');if(el.dataset.bound)return;el.dataset.bound=1;
  el.addEventListener('pointerdown',e=>{e.preventDefault();const h=e.target.tagName==='I'?e.target.className:'move';drag={h,sx:e.clientX,sy:e.clientY,start:{...rect}};el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{if(!drag)return;const b=el.parentElement.getBoundingClientRect(),dx=(e.clientX-drag.sx)/b.width,dy=(e.clientY-drag.sy)/b.height,s=drag.start,min=.08;let n={...s};
   if(drag.h==='move'){n.x=Math.max(0,Math.min(1-s.w,s.x+dx));n.y=Math.max(0,Math.min(1-s.h,s.y+dy))}
   else{if(drag.h.includes('l')){n.x=Math.max(0,Math.min(s.x+s.w-min,s.x+dx));n.w=s.w+(s.x-n.x)}if(drag.h.includes('r'))n.w=Math.max(min,Math.min(1-s.x,s.w+dx));if(drag.h.includes('t')){n.y=Math.max(0,Math.min(s.y+s.h-min,s.y+dy));n.h=s.h+(s.y-n.y)}if(drag.h.includes('b'))n.h=Math.max(min,Math.min(1-s.y,s.h+dy))}
   rect=n;drawRect()});el.addEventListener('pointerup',()=>drag=null);el.addEventListener('pointercancel',()=>drag=null);
 }
 function close(){document.getElementById('cropModal').classList.add('hidden');active=null}
 function full(){rect={x:0,y:0,w:1,h:1};drawRect()}
 async function confirm(){
  if(!active||!current)return;const src=current[key(active)],im=await img(src),x=Math.round(rect.x*im.naturalWidth),y=Math.round(rect.y*im.naturalHeight),w=Math.max(1,Math.round(rect.w*im.naturalWidth)),h=Math.max(1,Math.round(rect.h*im.naturalHeight)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);
  const originalKey=active+'Original';if(!current[originalKey])current[originalKey]=src;current[key(active)]=c.toDataURL('image/jpeg',.96);current[active+'Crop']={...rect};current[active+'Rotation']=0;
  document.getElementById(targets[active].preview).src=current[key(active)];await save();close();
 }
 async function reset(t){if(!current)return;const ok=t+'Original';if(current[ok]){current[key(t)]=current[ok];delete current[ok];delete current[t+'Crop'];current[t+'Rotation']=0;document.getElementById(targets[t].preview).src=current[key(t)];await save()}}
 const st=document.createElement('style');st.textContent='.v25CropControls{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 10px}.v25Modal{position:fixed;inset:0;z-index:100;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px}.v25Panel{background:#fff;border-radius:15px;padding:12px;max-width:900px;max-height:96vh;overflow:auto}.v25Head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.v25Head button{min-height:34px}.v25CanvasWrap{position:relative;margin:auto;background:#222;touch-action:none}.v25CanvasWrap canvas{display:block;max-width:none}.v25Rect{position:absolute;border:3px solid #6b4eff;box-shadow:0 0 0 9999px #0008;cursor:move;touch-action:none}.v25Rect i{position:absolute;width:22px;height:22px;background:#fff;border:3px solid #6b4eff;border-radius:50%}.v25Rect .tl{left:-12px;top:-12px}.v25Rect .tr{right:-12px;top:-12px}.v25Rect .bl{left:-12px;bottom:-12px}.v25Rect .br{right:-12px;bottom:-12px}.v25Actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:9px}';document.head.appendChild(st);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();
})();