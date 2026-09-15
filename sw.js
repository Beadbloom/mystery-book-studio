const C='mystery-book-studio-v21';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./app-v17.js','./swatch-v19.js','./orientation-v21.js','./manifest.webmanifest'])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function appBundle(req){
 const base=await fetch(req,{cache:'no-store'}),swatch=await fetch(new URL('./swatch-v19.js',self.location),{cache:'no-store'}),orient=await fetch(new URL('./orientation-v21.js',self.location),{cache:'no-store'});
 if(!base.ok||!swatch.ok||!orient.ok)throw new Error('bundle fetch failed');
 const text=(await base.text())+'\n;/* swatch v19 */\n'+(await swatch.text())+'\n;/* orientation v21 */\n'+(await orient.text());
 return new Response(text,{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===self.location.origin&&u.pathname.endsWith('/app-v17.js')){e.respondWith(appBundle(e.request).catch(()=>caches.match(e.request)));return}e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(C).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)))});