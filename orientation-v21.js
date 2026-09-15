/* v21: landscape means a real landscape sheet; rotate portrait source 90deg only when needed */
(()=>{
 const rotCache=new Map();
 async function landscapeSrc(src){
   if(!src)return src;if(rotCache.has(src))return rotCache.get(src);
   try{const im=await img(src);if(im.naturalWidth>=im.naturalHeight){rotCache.set(src,src);return src}
    const c=document.createElement('canvas');c.width=im.naturalHeight;c.height=im.naturalWidth;const g=c.getContext('2d');g.translate(c.width/2,c.height/2);g.rotate(Math.PI/2);g.drawImage(im,-im.naturalWidth/2,-im.naturalHeight/2);const out=c.toDataURL('image/jpeg',.96);rotCache.set(src,out);return out;
   }catch(e){return src}
 }
 async function fixStage(){if(!current||current.pageMode==='spread'||current.orientation!=='landscape')return;const el=document.getElementById('mysteryPage'),pic=document.getElementById('rightPageImg');if(el)el.classList.add('landscape');if(pic){pic.src=await landscapeSrc(current.mysteryArt||current.line||'');pic.style.width='100%';pic.style.height='100%';pic.style.objectFit='contain';pic.style.transform='none'}}
 const oldRenderPages=renderPages;renderPages=function(){oldRenderPages();setTimeout(fixStage,0)};
 const oldRenderBook=renderBook;renderBook=async function(){oldRenderBook();const ds=state.designs.filter(d=>d.complete&&d.pageMode!=='spread'&&d.orientation==='landscape');for(const d of ds){const src=d.mysteryArt||d.line||'',fixed=await landscapeSrc(src);document.querySelectorAll('.bookPageMini.landscape img').forEach(el=>{if(el.src===src||el.getAttribute('src')===src)el.src=fixed})}}
 const css=document.createElement('style');css.textContent=`#mysteryPage.landscape{aspect-ratio:297/210!important;width:100%;padding:10px}#mysteryPage.landscape img{width:100%!important;height:100%!important;object-fit:contain!important}.bookSheet:has(.bookPageMini.landscape){grid-column:span 2}.bookPageMini.landscape{aspect-ratio:297/210!important;width:100%!important;grid-column:span 2!important}.bookPageMini.landscape img{width:100%!important;height:100%!important;object-fit:contain!important}`;document.head.appendChild(css);
 setTimeout(()=>{if(current)fixStage();if(document.getElementById('bookView')?.classList.contains('active'))renderBook()},50);
})();