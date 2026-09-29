/* Service worker da Mesa de Revisão: guarda só a casca (nenhum dado do usuário).
   index.html: rede primeiro, cópia guardada se a rede falhar ou demorar.
   Scripts, ícones e manifest: cópia guardada primeiro.
   Outras origens (api.github.com, Google Fonts): nunca passam por aqui nem vão para o cache. */
var VERSAO = 'mesa-casca-v4';
var CASCA = ['./', 'index.html', 'sync.js?v=1', 'pdf.min.js', 'pdf.worker.min.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) {
    return c.addAll(CASCA.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mesa-casca-') === 0 && k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function paginaGuardada() {
  return caches.match('index.html').then(function (r) { return r || caches.match('./'); });
}

function redePrimeiro(req) {
  return new Promise(function (resolve) {
    var feito = false;
    function fim(r) { if (!feito && r) { feito = true; resolve(r); } }
    // rede lenta (Wi-Fi de hotel): depois de 4 s serve a cópia guardada, se houver
    var t = setTimeout(function () { paginaGuardada().then(fim); }, 4000);
    fetch(req).then(function (res) {
      clearTimeout(t);
      if (res && res.ok) {
        var copia = res.clone();
        caches.open(VERSAO).then(function (c) { return c.put('index.html', copia); });
        fim(res);
      } else {
        paginaGuardada().then(function (r) { fim(r || res); });
      }
    }).catch(function () {
      clearTimeout(t);
      paginaGuardada().then(function (r) { fim(r || Response.error()); });
    });
  });
}

function cachePrimeiro(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copia = res.clone();
        caches.open(VERSAO).then(function (c) { return c.put(req, copia); });
      }
      return res;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var escopo = new URL(self.registration.scope).pathname;
  var ehPagina = req.mode === 'navigate' || url.pathname === escopo || url.pathname === escopo + 'index.html';
  e.respondWith(ehPagina ? redePrimeiro(req) : cachePrimeiro(req));
});
