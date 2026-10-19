/* IN TIME · service worker: abre o app sem internet (o banco Supabase nunca é cacheado) */
const VER = 'intime-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
  'https://unpkg.com/lucide@0.454.0/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(VER);
  await Promise.all([...SHELL, ...CDN].map(u => c.add(u).catch(() => {})));
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for(const k of await caches.keys()) if(k !== VER) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.hostname.endsWith('supabase.co') || url.protocol.startsWith('chrome')) return;
  if(req.mode === 'navigate'){                       // página: rede primeiro, cópia local sem sinal
    e.respondWith((async () => {
      try{
        const r = await fetch(req);
        const c = await caches.open(VER); c.put('./index.html', r.clone());
        return r;
      }catch(_){
        return (await caches.match(req, { ignoreSearch:true })) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {                       // bibliotecas, fontes e ícones: cache e atualiza em segundo plano
    const c = await caches.open(VER), hit = await c.match(req);
    const rede = fetch(req).then(r => { if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await rede) || Response.error();
  })());
});
