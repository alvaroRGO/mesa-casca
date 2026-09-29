/* Mesa de Revisão: fusão de estado e sincronização com um repositório privado do GitHub.
   Funciona no navegador (window.MesaSync) e no Node (module.exports), para os testes sem rede.
   Nenhum segredo é registrado: o token só entra no cabeçalho Authorization. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MesaSync = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var COLLS = ['comentarios', 'grifos', 'revisadas'];
  var PATH_ESTADO = 'dados/estado.json';
  var PATH_RESPOSTAS = 'dados/respostas.json';

  // ---------- registros ----------
  function isTomb(r) { return !!r && r.sync === 'tombstone'; }
  function ver(r) { return r ? String(r.atualizado_em || r.apagado_em || r.criado_em || r.em || '') : ''; }
  function copy(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function index(arr) {
    var m = {}, order = [];
    (arr || []).forEach(function (r) {
      if (!r || r.id == null) return;
      var id = String(r.id);
      if (!m[id]) { order.push(id); m[id] = r; return; }
      var a = m[id];
      if (ver(r) > ver(a) || (ver(r) === ver(a) && isTomb(r) && !isTomb(a))) m[id] = r;
    });
    return { map: m, order: order };
  }
  function mark(coll, r) { return { coll: coll, id: String(r.id), ver: ver(r), tomb: isTomb(r) }; }

  // estado.json (formato de arquivo) -> retrato em memória {comentarios, grifos, revisadas, progresso}
  function fromEstado(est) {
    est = est || {};
    var snap = { comentarios: copy(est.comentarios || []), grifos: copy(est.grifos || []), revisadas: [], progresso: est.progresso ? copy(est.progresso) : null };
    var rv = est.revisadas || [];
    if (Array.isArray(rv)) snap.revisadas = copy(rv);
    else Object.keys(rv).forEach(function (k) { var em = typeof rv[k] === 'string' ? rv[k] : null; snap.revisadas.push({ id: String(k), pagina: +k, em: em, atualizado_em: em }); });
    (est.tombstones || []).forEach(function (t) {
      if (!t || !snap[t.coll] || t.id == null) return;
      var r = copy(t); delete r.coll; r.sync = 'tombstone'; snap[t.coll].push(r);
    });
    return snap;
  }

  function byPage(a, b) { return ((a.pagina || 0) - (b.pagina || 0)) || String(a.criado_em || a.em || '').localeCompare(String(b.criado_em || b.em || '')) || String(a.id).localeCompare(String(b.id)); }

  // retrato -> estado.json. keepSync=false grava sync:'enviado' (o que foi aceito pelo repositório)
  function toEstado(snap, opts) {
    opts = opts || {};
    var est = { schema: 1, tiragem: opts.tiragem || null, gerado_em: opts.gerado_em || opts.agora || null, atualizado_em: opts.agora || null, comentarios: [], grifos: [], revisadas: [], progresso: null, tombstones: [] };
    COLLS.forEach(function (coll) {
      (snap[coll] || []).forEach(function (r) {
        var o = copy(r);
        if (isTomb(o)) { delete o.sync; var t = { id: String(o.id), coll: coll }; Object.keys(o).forEach(function (k) { if (k !== 'id') t[k] = o[k]; }); est.tombstones.push(t); return; }
        if (!opts.keepSync) o.sync = 'enviado';
        est[coll].push(o);
      });
      est[coll].sort(byPage);
    });
    est.tombstones.sort(function (a, b) { return a.coll.localeCompare(b.coll) || String(a.apagado_em || '').localeCompare(String(b.apagado_em || '')) || String(a.id).localeCompare(String(b.id)); });
    if (snap.progresso) { est.progresso = copy(snap.progresso); if (!opts.keepSync) est.progresso.sync = 'enviado'; }
    return est;
  }

  // JSON legível no git: um registro por linha
  function serialize(est) {
    var keys = Object.keys(est); var out = ['{'];
    keys.forEach(function (k, i) {
      var v = est[k]; var tail = i < keys.length - 1 ? ',' : '';
      if (Array.isArray(v)) {
        if (!v.length) { out.push(' ' + JSON.stringify(k) + ': []' + tail); return; }
        out.push(' ' + JSON.stringify(k) + ': [');
        v.forEach(function (r, j) { out.push('  ' + JSON.stringify(r) + (j < v.length - 1 ? ',' : '')); });
        out.push(' ]' + tail);
      } else out.push(' ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + tail);
    });
    out.push('}');
    return out.join('\n') + '\n';
  }

  /* Fusão por id. Última escrita vence por atualizado_em; remoções são tombstones.
     local, remote: retratos {comentarios, grifos, revisadas, progresso}.
     Devolve:
       result: o retrato a gravar no repositório (se push)
       apply:  registros do repositório mais novos que os locais [{coll, rec}] (rec tombstone = apagar local)
       sent:   registros locais a marcar como enviados depois do PUT [{coll, id, ver, tomb}]
       count:  itens locais que sobem (comentários, grifos, revisadas, remoções)
       push:   se há o que gravar no repositório */
  function merge(local, remote, opts) {
    opts = opts || {};
    local = local || {}; remote = remote || {};
    var out = { comentarios: [], grifos: [], revisadas: [], progresso: null };
    var apply = [], sent = [], count = 0;
    COLLS.forEach(function (coll) {
      var L = index(local[coll]), R = index(remote[coll]);
      var ids = R.order.slice(); L.order.forEach(function (id) { if (!R.map[id]) ids.push(id); });
      ids.forEach(function (id) {
        var l = L.map[id], r = R.map[id];
        if (l && !r) {
          if (isTomb(l)) { sent.push(mark(coll, l)); return; } // nada a apagar no repositório
          out[coll].push(l); count++; sent.push(mark(coll, l)); return;
        }
        if (r && !l) { out[coll].push(r); if (!isTomb(r)) apply.push({ coll: coll, rec: copy(r) }); return; }
        var vl = ver(l), vr = ver(r);
        var localWins = vl > vr || (vl === vr && isTomb(l) && !isTomb(r));
        var remoteWins = vr > vl || (vl === vr && isTomb(r) && !isTomb(l));
        if (localWins) { out[coll].push(l); count++; sent.push(mark(coll, l)); }
        else if (remoteWins) { out[coll].push(r); apply.push({ coll: coll, rec: copy(r) }); }
        else { out[coll].push(r); if (l.sync !== 'enviado') sent.push(mark(coll, l)); }
      });
    });
    var push = count > 0 || !!opts.remoteMissing;
    var lp = local.progresso, rp = remote.progresso;
    if (lp && (!rp || ver(lp) > ver(rp))) {
      if (push) { out.progresso = lp; if (lp.sync !== 'enviado') sent.push(mark('progresso', lp)); } else out.progresso = rp || null;
    } else if (rp) {
      out.progresso = rp;
      if (!lp || ver(rp) > ver(lp)) apply.push({ coll: 'progresso', rec: copy(rp) });
      else if (lp && lp.sync !== 'enviado') sent.push(mark('progresso', lp));
    }
    return { result: out, apply: apply, sent: sent, count: count, push: push };
  }

  // ---------- base64 UTF-8 ----------
  function b64encodeUtf8(str) {
    var bytes = new TextEncoder().encode(str); var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decodeUtf8(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')); var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  // ---------- API do GitHub ----------
  function HttpError(status, msg) { var e = new Error(msg || ('HTTP ' + status)); e.status = status; return e; }
  function describe(e) {
    if (!e) return 'erro';
    if (e.status === 401) return 'token inválido ou expirado: cole um novo em Configuração';
    if (e.status === 403) return 'token sem permissão de escrita (ou limite da API atingido)';
    if (e.status === 404) return 'repositório não encontrado ou token sem acesso a ele';
    if (e.status === 409 || e.status === 422) return 'o repositório mudou durante o envio; tente de novo';
    if (e.status) return 'o GitHub respondeu ' + e.status;
    if (e.name === 'AbortError' || e.timeout) return 'a rede não respondeu a tempo';
    return 'sem rede';
  }

  function createClient(deps) {
    var fetchFn = deps.fetch || function (u, i) { return fetch(u, i); };
    function call(cfg, method, path, body, accept, timeoutMs) {
      var url = String(cfg.api || 'https://api.github.com').replace(/\/+$/, '') + '/repos/' + cfg.repo + '/contents/' + path;
      var headers = { Authorization: 'Bearer ' + cfg.token, Accept: accept || 'application/vnd.github+json' };
      if (body) headers['Content-Type'] = 'application/json';
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 30000) : null;
      var init = { method: method, headers: headers, cache: 'no-store' };
      if (body) init.body = JSON.stringify(body);
      if (ctl) init.signal = ctl.signal;
      return Promise.resolve().then(function () { return fetchFn(url, init); }).then(function (res) { if (timer) clearTimeout(timer); return res; }, function (e) { if (timer) clearTimeout(timer); throw e; });
    }
    function getRaw(cfg, path, asBuffer, onProgress, timeoutMs) {
      return call(cfg, 'GET', path, null, 'application/vnd.github.raw', timeoutMs || 180000).then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) throw HttpError(res.status);
        if (!asBuffer) return res.text();
        var total = +(res.headers && res.headers.get && res.headers.get('Content-Length')) || 0;
        if (!onProgress || !res.body || !res.body.getReader) return res.arrayBuffer();
        var reader = res.body.getReader(); var chunks = []; var got = 0;
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) { var out = new Uint8Array(got); var off = 0; chunks.forEach(function (c) { out.set(c, off); off += c.length; }); return out.buffer; }
            chunks.push(r.value); got += r.value.length; onProgress(got, total); return pump();
          });
        }
        return pump();
      });
    }
    function getEstado(cfg) {
      return call(cfg, 'GET', PATH_ESTADO).then(function (res) {
        if (res.status === 404) return { sha: null, estado: null };
        if (!res.ok) throw HttpError(res.status);
        return res.json().then(function (j) {
          if (j && j.content && j.encoding === 'base64') return { sha: j.sha, estado: JSON.parse(b64decodeUtf8(j.content)) };
          // acima de 1 MB a API não traz o conteúdo no JSON: busca a versão bruta
          return getRaw(cfg, PATH_ESTADO, false, null, 60000).then(function (t) { return { sha: j.sha, estado: t ? JSON.parse(t) : null }; });
        });
      });
    }
    function putEstado(cfg, estado, sha, message) {
      var body = { message: message, content: b64encodeUtf8(serialize(estado)) };
      if (sha) body.sha = sha;
      return call(cfg, 'PUT', PATH_ESTADO, body, null, 60000).then(function (res) {
        if (!res.ok) throw HttpError(res.status);
        return res.json().then(function (j) { return j && j.content ? j.content.sha : null; }, function () { return null; });
      });
    }
    function getRespostas(cfg) {
      return getRaw(cfg, PATH_RESPOSTAS, false, null, 30000).then(function (t) { if (!t) return {}; try { return JSON.parse(t) || {}; } catch (e) { return {}; } });
    }
    return { call: call, getRaw: getRaw, getEstado: getEstado, putEstado: putEstado, getRespostas: getRespostas };
  }

  /* deps: { fetch, getConfig() -> {token, repo, api}, getLocal() -> retrato, applyLocal(list), markSent(list),
             applyRespostas(obj), onStatus(st), isOnline(), now(), tiragem() } (as funções podem devolver Promise) */
  function createSync(deps) {
    var client = createClient(deps);
    var running = null;
    function status(st) { try { if (deps.onStatus) deps.onStatus(st); } catch (e) { } }
    function now() { return deps.now ? deps.now() : new Date().toISOString(); }
    function once(cfg, retried) {
      return client.getEstado(cfg).then(function (rem) {
        return Promise.resolve(deps.getLocal()).then(function (local) {
          var remoteSnap = fromEstado(rem.estado);
          var m = merge(local, remoteSnap, { remoteMissing: !rem.estado });
          return Promise.resolve(m.apply.length ? deps.applyLocal(m.apply) : null).then(function () {
            if (!m.push) return Promise.resolve(deps.markSent(m.sent)).then(function () { return { count: 0 }; });
            var agora = now();
            var est = toEstado(m.result, { tiragem: (deps.tiragem && deps.tiragem()) || (rem.estado && rem.estado.tiragem) || null, agora: agora, gerado_em: rem.estado && rem.estado.gerado_em });
            var msg = 'mesa: ' + m.count + (m.count === 1 ? ' item, ' : ' itens, ') + agora;
            return client.putEstado(cfg, est, rem.sha, msg).then(function () {
              return Promise.resolve(deps.markSent(m.sent)).then(function () { return { count: m.count }; });
            }, function (e) {
              if ((e.status === 409 || e.status === 422) && !retried) return once(cfg, true);
              throw e;
            });
          });
        });
      });
    }
    function syncNow(reason) {
      if (running) return running;
      running = Promise.resolve().then(function () { return deps.getConfig(); }).then(function (cfg) {
        if (!cfg || !cfg.token) { status({ estado: 'sem-token', msg: 'sem token: as anotações ficam neste aparelho' }); return { ok: false, motivo: 'sem-token' }; }
        if (deps.isOnline && !deps.isOnline()) { status({ estado: 'offline', msg: 'sem rede: a fila fica neste aparelho' }); return { ok: false, motivo: 'offline' }; }
        status({ estado: 'sincronizando', motivo: reason || '' });
        return once(cfg, false).then(function (r) {
          return client.getRespostas(cfg).then(function (resp) { return deps.applyRespostas ? deps.applyRespostas(resp) : null; }, function () { return null; })
            .then(function () { var em = now(); status({ estado: 'ok', em: em, enviados: r.count }); return { ok: true, count: r.count, em: em }; });
        });
      }).catch(function (e) {
        var msg = describe(e);
        status({ estado: e && e.status ? 'erro' : 'offline', msg: msg, http: e && e.status || null });
        return { ok: false, motivo: msg, status: e && e.status || null };
      }).then(function (r) { running = null; return r; });
      return running;
    }
    return { syncNow: syncNow, client: client, isRunning: function () { return !!running; } };
  }

  return {
    COLLS: COLLS, isTomb: isTomb, ver: ver, merge: merge, fromEstado: fromEstado, toEstado: toEstado, serialize: serialize,
    b64encodeUtf8: b64encodeUtf8, b64decodeUtf8: b64decodeUtf8, createClient: createClient, createSync: createSync, describe: describe
  };
});
