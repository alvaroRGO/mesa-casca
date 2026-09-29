// Teste do syncNow contra um GitHub falso em memória (sem rede): node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../sync.js');

function fakeGitHub() {
  const files = {}; let n = 0; const log = []; const faults = [];
  const sha = () => 'sha' + (++n);
  const res = (status, body, raw) => ({
    status, ok: status >= 200 && status < 300,
    headers: { get: () => null },
    json: async () => body, text: async () => raw != null ? raw : JSON.stringify(body)
  });
  async function fetch(url, init) {
    const path = url.split('/contents/')[1];
    log.push(init.method + ' ' + path);
    assert.match(init.headers.Authorization, /^Bearer /);
    const f = faults.shift();
    if (f === 'rede') throw new TypeError('Failed to fetch');
    if (typeof f === 'number') return res(f, { message: 'falha' });
    if (init.method === 'GET') {
      const file = files[path];
      if (!file) return res(404, { message: 'Not Found' });
      if (init.headers.Accept === 'application/vnd.github.raw') return res(200, null, file.text);
      return res(200, { sha: file.sha, encoding: 'base64', content: M.b64encodeUtf8(file.text) });
    }
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body);
      const cur = files[path];
      if (cur && body.sha !== cur.sha) return res(409, { message: 'sha mismatch' });
      if (!cur && body.sha) return res(422, { message: 'sha for missing file' });
      files[path] = { sha: sha(), text: M.b64decodeUtf8(body.content), message: body.message };
      return res(200, { content: { sha: files[path].sha } });
    }
    return res(405, {});
  }
  return { files, log, faults, fetch };
}

// aparelho falso: mesma lógica de aplicar/marcar que o index.html usa
function fakeDevice() {
  const d = { comentarios: {}, grifos: {}, revisadas: {}, progresso: null, respostas: {}, status: [] };
  d.snapshot = () => JSON.parse(JSON.stringify({ comentarios: Object.values(d.comentarios), grifos: Object.values(d.grifos), revisadas: Object.values(d.revisadas), progresso: d.progresso }));
  d.applyLocal = list => list.forEach(({ coll, rec }) => {
    if (coll === 'progresso') { d.progresso = { ...rec, sync: 'enviado' }; return; }
    if (rec.sync === 'tombstone') delete d[coll][rec.id]; else d[coll][rec.id] = { ...rec, sync: 'enviado' };
  });
  d.markSent = list => list.forEach(s => {
    if (s.coll === 'progresso') { if (d.progresso && M.ver(d.progresso) === s.ver) d.progresso.sync = 'enviado'; return; }
    const cur = d[s.coll][s.id]; if (!cur || M.ver(cur) !== s.ver) return;
    if (s.tomb) delete d[s.coll][s.id]; else cur.sync = 'enviado';
  });
  d.applyRespostas = obj => Object.keys(obj).forEach(id => { const c = d.comentarios[id]; if (c) { c.resposta = obj[id].resposta; c.respondido_em = obj[id].respondido_em; } });
  d.pending = () => ['comentarios', 'grifos', 'revisadas'].reduce((n, k) => n + Object.values(d[k]).filter(r => r.sync !== 'enviado').length, 0);
  return d;
}

function mk(gh, dev, cfg = { token: 'TOKEN-FALSO', repo: 'dono/mesa-dados' }, online = true) {
  let t = 0;
  return M.createSync({
    fetch: gh.fetch, getConfig: () => cfg, getLocal: dev.snapshot, applyLocal: dev.applyLocal, markSent: dev.markSent,
    applyRespostas: dev.applyRespostas, onStatus: st => dev.status.push(st), isOnline: () => online,
    now: () => '2026-09-29T12:00:' + String(10 + (t++)).padStart(2, '0') + '.000Z', tiragem: () => 'aaaa1111'
  });
}
const com = (id, t) => ({ id, pagina: 5, trecho: 'p5-1', tipo: 'duvida', texto: 'q ' + id, criado_em: t, atualizado_em: t, estado: 'aberto', tiragem: 'aaaa1111', sync: 'pendente' });

test('primeiro envio cria estado.json com um único commit e zera a fila', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  dev.revisadas['5'] = { id: '5', pagina: 5, em: '2026-09-29T09:01:00.000Z', atualizado_em: '2026-09-29T09:01:00.000Z', sync: 'pendente' };
  const r = await mk(gh, dev).syncNow('teste');
  assert.equal(r.ok, true); assert.equal(r.count, 2);
  assert.equal(gh.log.filter(l => l.startsWith('PUT')).length, 1);
  assert.match(gh.files['dados/estado.json'].message, /^mesa: 2 itens, 2026-/);
  const est = JSON.parse(gh.files['dados/estado.json'].text);
  assert.equal(est.comentarios[0].id, 'c1'); assert.equal(est.comentarios[0].sync, 'enviado');
  assert.equal(dev.pending(), 0);
});

test('sem nada novo não há commit; respostas.json é aplicado por id', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  const s = mk(gh, dev); await s.syncNow();
  gh.files['dados/respostas.json'] = { sha: 'x', text: JSON.stringify({ c1: { resposta: 'Sim, está correto.', respondido_em: '2026-09-29T13:00:00Z' } }) };
  const puts = gh.log.filter(l => l.startsWith('PUT')).length;
  const r = await s.syncNow();
  assert.equal(r.ok, true); assert.equal(r.count, 0);
  assert.equal(gh.log.filter(l => l.startsWith('PUT')).length, puts);
  assert.equal(dev.comentarios.c1.resposta, 'Sim, está correto.');
});

test('409 por sha desatualizado: relê, funde de novo e envia uma vez', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  const s = mk(gh, dev); await s.syncNow();
  dev.comentarios.c2 = com('c2', '2026-09-29T09:05:00.000Z');
  // outro escritor muda o arquivo entre o GET e o PUT
  const origFetch = gh.fetch; let first = true;
  const racing = { ...gh, fetch: async (url, init) => {
    const out = await origFetch(url, init);
    if (first && init.method === 'GET' && url.endsWith('dados/estado.json')) {
      first = false;
      const est = JSON.parse(gh.files['dados/estado.json'].text);
      est.grifos.push({ id: 'gX', pagina: 9, criado_em: '2026-09-29T09:06:00.000Z', atualizado_em: '2026-09-29T09:06:00.000Z', sync: 'enviado' });
      gh.files['dados/estado.json'] = { sha: 'sha-outro', text: M.serialize(est) };
    }
    return out;
  } };
  const r = await mk(racing, dev).syncNow();
  assert.equal(r.ok, true);
  const est = JSON.parse(gh.files['dados/estado.json'].text);
  assert.deepEqual(est.comentarios.map(c => c.id).sort(), ['c1', 'c2']);
  assert.deepEqual(est.grifos.map(g => g.id), ['gX']);
  assert.ok(dev.grifos.gX, 'o grifo do outro escritor desceu');
  assert.equal(dev.pending(), 0);
});

test('401 e queda de rede não perdem a fila', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  const s = mk(gh, dev);
  gh.faults.push(401);
  let r = await s.syncNow();
  assert.equal(r.ok, false); assert.equal(r.status, 401); assert.equal(dev.pending(), 1);
  assert.match(dev.status.at(-1).msg, /token inválido/);
  gh.faults.push(undefined, 'rede'); // GET ok, PUT cai
  r = await s.syncNow();
  assert.equal(r.ok, false); assert.equal(dev.pending(), 1);
  assert.equal(gh.files['dados/estado.json'], undefined);
  r = await s.syncNow();
  assert.equal(r.ok, true); assert.equal(dev.pending(), 0);
});

test('409 duas vezes seguidas: desiste sem perder a fila', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  gh.faults.push(undefined, 409, undefined, 409);
  const r = await mk(gh, dev).syncNow();
  assert.equal(r.ok, false); assert.equal(r.status, 409); assert.equal(dev.pending(), 1);
});

test('trava de reentrância, sem token e offline', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  const s = mk(gh, dev);
  const [a, b] = [s.syncNow(), s.syncNow()];
  assert.equal(a, b);
  await a;
  assert.equal(gh.log.filter(l => l.startsWith('PUT')).length, 1);
  const semToken = await mk(gh, fakeDevice(), { token: '', repo: 'dono/mesa-dados' }).syncNow();
  assert.equal(semToken.motivo, 'sem-token');
  const off = await mk(gh, fakeDevice(), undefined, false).syncNow();
  assert.equal(off.motivo, 'offline');
});

test('remoção local vira tombstone no repositório e some do aparelho depois do envio', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  dev.comentarios.c1 = com('c1', '2026-09-29T09:00:00.000Z');
  const s = mk(gh, dev); await s.syncNow();
  dev.comentarios.c1 = { id: 'c1', pagina: 5, apagado_em: '2026-09-29T10:00:00.000Z', atualizado_em: '2026-09-29T10:00:00.000Z', sync: 'tombstone' };
  const r = await s.syncNow();
  assert.equal(r.count, 1);
  const est = JSON.parse(gh.files['dados/estado.json'].text);
  assert.equal(est.comentarios.length, 0);
  assert.equal(est.tombstones[0].id, 'c1');
  assert.equal(dev.comentarios.c1, undefined);
});

test('estado.json acima de 1 MB é lido pela versão bruta', async () => {
  const gh = fakeGitHub(); const dev = fakeDevice();
  const big = { schema: 1, comentarios: [com('c9', '2026-09-29T08:00:00.000Z')], grifos: [], revisadas: [], tombstones: [] };
  gh.files['dados/estado.json'] = { sha: 'big', text: JSON.stringify(big) };
  const orig = gh.fetch;
  const g2 = { ...gh, fetch: async (url, init) => {
    if (init.method === 'GET' && url.endsWith('dados/estado.json') && init.headers.Accept !== 'application/vnd.github.raw') { gh.log.push('GET obj'); return { status: 200, ok: true, headers: { get: () => null }, json: async () => ({ sha: 'big', encoding: 'none', content: '', size: 2000000 }) }; }
    return orig(url, init);
  } };
  const r = await mk(g2, dev).syncNow();
  assert.equal(r.ok, true);
  assert.ok(dev.comentarios.c9);
});
