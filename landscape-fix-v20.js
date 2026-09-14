(()=>{
  function fitImage(im){
    if(!im||!im.closest)return;
    const box=im.closest('.page.landscape,.bookPageMini.landscape,.galleryItem.landscape');
    if(!box)return;
    const apply=()=>{
      const r=box.getBoundingClientRect();
      if(!r.width||!r.height||!im.naturalWidth||!im.naturalHeight)return;
      im.style.maxWidth='none';
      im.style.maxHeight='none';
      im.style.objectFit='contain';
      im.style.display='block';
      im.style.margin='auto';
      if(im.naturalHeight>im.naturalWidth){
        im.style.width=r.height+'px';
        im.style.height=r.width+'px';
        im.style.transform='rotate(90deg)';
        im.style.transformOrigin='center center';
      }else{
        im.style.width='100%';
        im.style.height='100%';
        im.style.transform='none';
      }
    };
    if(im.complete)requestAnimationFrame(apply);else im.addEventListener('load',()=>requestAnimationFrame(apply),{once:true});
  }
  function refresh(){document.querySelectorAll('.page.landscape img,.bookPageMini.landscape img,.galleryItem.landscape img').forEach(fitImage)}
  const mo=new MutationObserver(()=>requestAnimationFrame(refresh));
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','src']});
  addEventListener('resize',refresh);
  addEventListener('beforeprint',refresh);
  document.addEventListener('DOMContentLoaded',refresh);
  setTimeout(refresh,250);
})();