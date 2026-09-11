// Mystery Book Studio — persistent project storage v4
// Uses IndexedDB for large image-heavy projects and replaces the localStorage quota popup.
(function(){
  const DB_NAME='mystery-book-studio-db';
  const STORE='project';
  const KEY='main';
  let dbPromise=null;

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }

  function setSaveState(text,ok=true){
    const el=document.getElementById('saveState');
    if(!el) return;
    el.textContent=text;
    el.style.color=ok?'#137333':'#a31515';
  }

  async function writeProject(showFeedback=false){
    try{
      setSaveState('Saving…');
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put({key:KEY,designs,bookTitle:document.getElementById('bookTitle')?.value||'',dedication:document.getElementById('dedication')?.value||'',savedAt:Date.now()});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error||new Error('Save aborted'));
      });
      setSaveState('Saved ✓');
      if(showFeedback){
        const btn=document.getElementById('saveProject');
        if(btn){const old=btn.textContent;btn.textContent='Saved ✓';setTimeout(()=>btn.textContent=old,1300);}
      }
      return true;
    }catch(err){
      console.error('Project save failed',err);
      setSaveState('Save failed',false);
      return false;
    }
  }

  async function restoreProject(){
    try{
      const db=await openDB();
      const saved=await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get(KEY);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
      if(saved?.designs?.length){
        designs=saved.designs.map(d=>typeof migrate==='function'?migrate(d):d);
        if(saved.bookTitle&&document.getElementById('bookTitle')) document.getElementById('bookTitle').value=saved.bookTitle;
        if(saved.dedication&&document.getElementById('dedication')) document.getElementById('dedication').value=saved.dedication;
        if(typeof renderList==='function') renderList();
        if(typeof renderGallery==='function') renderGallery();
        if(typeof renderStructure==='function') renderStructure();
        setSaveState('Saved ✓');
      }else if(designs?.length){
        // First run after the storage upgrade: migrate the existing project into IndexedDB.
        await writeProject(false);
      }else{
        setSaveState('Ready');
      }
    }catch(err){
      console.error('Project restore failed',err);
      setSaveState('Ready');
    }
  }

  // Replace the old save() so normal stage changes still auto-save, but without quota alerts.
  save=function(){
    writeProject(false);
    if(typeof renderList==='function') renderList();
    if(typeof renderGallery==='function') renderGallery();
    if(typeof renderStructure==='function') renderStructure();
  };

  const saveBtn=document.getElementById('saveProject');
  if(saveBtn) saveBtn.addEventListener('click',()=>writeProject(true));
  window.addEventListener('pagehide',()=>{writeProject(false);});
  restoreProject();
})();
