/* v24 robust three-page PDF import */
(()=>{
 const VER='4.10.38',BASE='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/'+VER+'/';
 let pdfjsPromise;
 async function loadPdfJs(){
   if(!pdfjsPromise)pdfjsPromise=import(BASE+'pdf.min.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc=BASE+'pdf.worker.min.mjs';return m});
   return pdfjsPromise;
 }
 async function renderPage(pdf,n){
   const p=await pdf.getPage(n),v=p.getViewport({scale:1.5});
   const c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);
   await p.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:v}).promise;
   return c.toDataURL('image/jpeg',.92);
 }
 function ensureUI(){
   const stage=document.getElementById('uploadStage');if(!stage||document.getElementById('pdfImportBox'))return;
   const box=document.createElement('div');box.id='pdfImportBox';box.className='modeBox';
   box.innerHTML='<label style="font-size:14px">Upload all three pages from one PDF</label><input id="pdfImport" type="file" accept=".pdf,application/pdf"><small style="display:block;margin-top:6px">Select the PDF. The first three pages will appear below so you can assign them before importing.</small><div id="pdfAssign" class="hidden" style="margin-top:10px"></div>';
   stage.querySelector('.modeBox').after(box);document.getElementById('pdfImport').addEventListener('change',importPdf);
 }
 async function importPdf(e){
   const f=e.target.files&&e.target.files[0],out=document.getElementById('pdfAssign');if(!f||!out)return;
   out.classList.remove('hidden');out.innerHTML='<div class="note">Opening '+f.name+'…</div>';
   try{
     const pdfjs=await loadPdfJs(),bytes=new Uint8Array(await f.arrayBuffer());
     const task=pdfjs.getDocument({data:bytes,useWorkerFetch:false,isEvalSupported:false});
     const pdf=await task.promise;
     if(pdf.numPages<3)throw new Error('The selected PDF has only '+pdf.numPages+' page'+(pdf.numPages===1?'':'s')+'. I need at least 3.');
     const pages=[];for(let i=1;i<=3;i++){out.innerHTML='<div class="note">Reading PDF page '+i+' of 3…</div>';pages.push(await renderPage(pdf,i))}
     if(!current)throw new Error('Open or create a design first.');
     current.pdfPages=pages;renderAssign();
   }catch(err){out.innerHTML='<div class="note" style="color:#a31515"><strong>PDF could not be opened.</strong><br>'+String(err&&err.message||err)+'</div>';e.target.value=''}
 }
 function opts(sel){return [0,1,2].map(i=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>PDF page '+(i+1)+'</option>').join('')}
 function renderAssign(){
   const p=current.pdfPages,out=document.getElementById('pdfAssign');
   out.innerHTML='<div class="v24Pages">'+p.map((s,i)=>'<div><img src="'+s+'"><strong>Page '+(i+1)+'</strong></div>').join('')+'</div><div class="row3" style="margin-top:10px"><div><label>Completed artwork</label><select id="pdfMain">'+opts(0)+'</select></div><div><label>Colourless mystery</label><select id="pdfLine">'+opts(1)+'</select></div><div><label>Colour swatch</label><select id="pdfSwatch">'+opts(2)+'</select></div></div><button id="usePdfPages" class="primary" style="margin-top:10px">Import these pages</button>';
   document.getElementById('usePdfPages').onclick=usePages;
 }
 async function usePages(){
   const p=current&&current.pdfPages;if(!p)return;
   current.main=p[+document.getElementById('pdfMain').value];current.line=p[+document.getElementById('pdfLine').value];current.swatchSource=p[+document.getElementById('pdfSwatch').value];current.mainRotation=0;current.lineRotation=0;
   document.getElementById('mainPreview').src=current.main;document.getElementById('linePreview').src=current.line;document.getElementById('swatchPreview').src=current.swatchSource;
   if(typeof checkUploads==='function')checkUploads();else document.getElementById('approvePair').disabled=!(current.main&&current.line&&current.swatchSource);
   await save();document.getElementById('pdfAssign').innerHTML='<div class="note"><strong>Three pages imported.</strong> Check the previews and rotate either artwork if needed before approving.</div>';
 }
 const st=document.createElement('style');st.textContent='.v24Pages{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v24Pages>div{border:1px solid var(--line);border-radius:9px;padding:5px;background:#fff}.v24Pages img{width:100%;height:130px;object-fit:contain;background:#eee}.v24Pages strong{display:block;text-align:center;font-size:10px;margin-top:3px}@media(max-width:650px){.v24Pages img{height:90px}}';document.head.appendChild(st);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();