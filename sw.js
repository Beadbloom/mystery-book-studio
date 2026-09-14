const C='mystery-book-studio-v20';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./app-v17.js','./swatch-v19.js','./landscape-fix-v20.js','./manifest.webmanifest'])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function appBundle(req){
  const base=await fetch(req,{cache:'no-store'}),swatch=await fetch(new URL('./swatch-v19.js',self.location),{cache:'no-store'}),landscape=await fetch(new URL('./landscape-fix-v20.js',self.location),{cache:'no-store'});
  if(!base.ok||!swatch.ok||!landscape.ok)throw new Error('bundle fetch failed');
  const text=(await base.text())+'\n;/* My Color Chart v19 */\n'+(await swatch.text())+'\n;/* Landscape page fix v20 */\n'+(await landscape.text());
  return new Response(text,{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin===self.location.origin&&u.pathname.endsWith('/app-v17.js')){e.respondWith(appBundle(e.request).catch(()=>caches.match(e.request)));return}
  e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(C).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));
});