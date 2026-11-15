/* Служебный скрипт для работы без интернета.
   Озвучка и иконки: сначала из кеша (файлы с отпечатком в имени, устаревших не бывает).
   Страница и остальное: сначала сеть, а без сети последняя сохранённая копия. Видеофон не трогаем: Safari просит частичные ответы. */
const CACHE = 'sa-v1';
self.addEventListener('install', ()=>self.skipWaiting());
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE && k.startsWith('sa-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const r = e.request, u = new URL(r.url);
  if(r.method!=='GET' || u.origin!==location.origin || r.headers.has('range') || /\/bg\//.test(u.pathname)) return;
  const immutable = /\/audio\/pack\d+-[0-9a-f]+\.mp4$/.test(u.pathname) || /\/icons\//.test(u.pathname);
  if(immutable){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit = await c.match(r); if(hit) return hit;
      const res = await fetch(r); if(res.ok) c.put(r, res.clone()); return res;
    }));
    return;
  }
  e.respondWith(fetch(r).then(res=>{ if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(r, copy)); } return res; })
    .catch(()=>caches.match(r, {ignoreSearch:true}).then(h=>h || (r.mode==='navigate' ? caches.match(u.pathname) || caches.match('./') : undefined))));
});
