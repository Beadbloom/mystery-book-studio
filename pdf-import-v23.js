/* v23 three-page PDF import using PDF.js */
(()=>{
 const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
 function dataURL(canvas){return canvas.toDataURL('image/png',0.96)}
 async function loadPdfJs(){return await import(PDFJS)}
 async function renderPage(pdf,n){
   const p=await pdf.getPage(n),v=p.getViewport({scale:2});
   const c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);
   await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;return dataURL(c);
 }
 function ensureUI(){
   const stage=document.getElementById('uploadStage');if(!stage||document.getElementById('pdfImportBox'))return;
   const box=document.createElement('div');box.id='pdfImportBox';box.className='modeBox';
   box.innerHTML='<label style="font-size:14px">Have all three pages in one PDF?</label><input id="pdfImport" type="file" accept="application/pdf,.pdf"><small style="display:block;margin-top:6px">Upload the 3-page PDF once. The app will extract all three pages, then you can assign which page is Completed artwork, Colourless mystery and Colour swatch.</small><div id="pdfAssign" class="hidden" style="margin-top:10px"></div>';
   const mode=stage.querySelector('.modeBox');mode.after(box);
   document.getElementById('pdfImport').onchange=importPdf;
 }
 async function importPdf(e){
   const f=e.target.files?.[0];if(!f||!current)return;
   const out=document.getElementById('pdfAssign');out.classList.remove('hidden');out.innerHTML='<div class="note">Opening PDF…</div>';
   try{
     const pdfjs=await loadPdfJs(),buf=await f.arrayBuffer();
     const pdf=await pdfjs.getDocument({data:buf}).promise;
     if(pdf.numPages<3){out.innerHTML='<div class="note">This PDF has fewer than 3 pages.</div>';return}
     const pages=[];for(let i=1;i<=Math.min(pdf.numPages,3);i++)pages.push(await renderPage(pdf,i));
     current.pdfPages=pages;
     renderAssign();
   }catch(err){out.innerHTML='<div class="note">I could not open this PDF on this device. Try reopening the app while online and selecting it again.</div>'}
 }
 function renderAssign(){
   const out=document.getElementById('pdfAssign'),p=current?.pdfPages||[];if(p.length<3)return;
   out.innerHTML='<div class="v23Pages">'+p.map((src,i)=>'<div><img src="'+src+'"><strong>PDF page '+(i+1)+'</strong></div>').join('')+'</div>'+
   '<div class="row3" style="margin-top:10px"><div><label>Completed artwork</label><select id="pdfMain">'+opts()+'</select></div><div><label>Colourless mystery</label><select id="pdfLine">'+opts(1)+'</select></div><div><label>Colour swatch</label><select id="pdfSwatch">'+opts(2)+'</select></div></div><button id="usePdfPages" class="primary" style="margin-top:10px">Use these three PDF pages</button>';
   document.getElementById('usePdfPages').onclick=usePages;
 }
 function opts(sel=0){return [0,1,2].map(i=>'<option value="'+i+'" '+(i===sel?'selected':'')+'>Page '+(i+1)+'</option>').join('')}
 async function usePages(){
   if(!current)return;const p=current.pdfPages;
   current.main=p[+document.getElementById('pdfMain').value];current.line=p[+document.getElementById('pdfLine').value];current.swatchSource=p[+document.getElementById('pdfSwatch').value];
   current.mainRotation=0;current.lineRotation=0;
   document.getElementById('mainPreview').src=current.main;document.getElementById('linePreview').src=current.line;document.getElementById('swatchPreview').src=current.swatchSource;
   checkUploads();await save();
   const b=document.getElementById('pdfAssign');b.innerHTML='<div class="note"><strong>PDF pages loaded.</strong> You can now use the Rotate left/right buttons under the artwork previews before approving.</div>';
 }
 const st=document.createElement('style');st.textContent='.v23Pages{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v23Pages>div{border:1px solid var(--line);border-radius:9px;padding:5px;background:#fff}.v23Pages img{width:100%;height:130px;object-fit:contain;background:#eee}.v23Pages strong{display:block;text-align:center;font-size:10px;margin-top:3px}@media(max-width:650px){.v23Pages{grid-template-columns:1fr 1fr 1fr}.v23Pages img{height:90px}}';document.head.appendChild(st);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();