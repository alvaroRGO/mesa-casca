// Coleção «propostas» (Proposta de modificação) no sync.js, sem rede: node --test tests/test_propostas_sync.mjs
// Fusão (o script cria no repositório, o aparelho decide; a decisão vence por atualizado_em), dois aparelhos, chaves
// desconhecidas do estado.json preservadas e o cliente antigo (sync.js anterior, b001cd8) que apaga a coleção: o
// aparelho novo, que a tem, devolve-a na sincronização seguinte. Dados sintéticos; nada da tese.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const M = require('../sync.js');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const T0 = '2026-10-15T17:00:00.000Z', T1 = '2026-10-15T18:00:00.000Z', T2 = '2026-10-15T19:00:00.000Z';
const prop = (id, extra = {}) => ({ id, tiragem: 'f0f0f0f0', linha: 'fallback', pagina: 3, trecho: 'p3-2', texto_trecho: 'Synthetic paragraph.', proposta: 'Synthetic paragraph, shorter.',
  diff: [['igual', 'Synthetic '], ['sai', 'paragraph.'], ['entra', 'paragraph, shorter.']], motivo: 'Motivo sintético.', origem: ['R1'], prova: 'arquivo.md', prioridade: 'A',
  toca_reivindicacao: false, ja_aplicada: false, depende_de: '', tex: { arquivo: 'cap.tex', antes: 'a', depois: 'b' }, estado: 'proposta', texto_final: '', decidido_em: null,
  criado_em: T0, atualizado_em: T0, sync: 'enviado', ...extra });
const vazio = () => ({ comentarios: [], grifos: [], revisadas: [], propostas: [], progresso: null });

test('COLLS inclui propostas; fromEstado e toEstado levam a coleção e os tombstones dela', () => {
  assert.deepEqual(M.COLLS, ['comentarios', 'grifos', 'revisadas', 'propostas']);
  const snap = M.fromEstado({ propostas: [prop('x1')], tombstones: [{ id: 'x2', coll: 'propostas', apagado_em: T1, atualizado_em: T1 }] });
  assert.deepEqual(snap.propostas.map(p => p.id + ':' + p.sync), ['x1:enviado', 'x2:tombstone']);
  const est = M.toEstado(snap, { agora: T2 });
  assert.deepEqual(Object.keys(est), ['schema', 'tiragem', 'gerado_em', 'atualizado_em', 'comentarios', 'grifos', 'revisadas', 'propostas', 'progresso', 'tombstones']);
  assert.deepEqual(est.propostas.map(p => p.id), ['x1']);
  assert.deepEqual(est.tombstones, [{ id: 'x2', coll: 'propostas', apagado_em: T1, atualizado_em: T1 }]);
  // estado.json antigo, sem a chave propostas: a coleção nasce vazia
  assert.deepEqual(M.fromEstado({ comentarios: [] }).propostas, []);
});

test('o script cria no repositório, o aparelho decide: a decisão (atualizado_em mais novo) vence e sobe', () => {
  const remoto = M.fromEstado({ propostas: [prop('x1'), prop('x2')] });
  const local = { ...vazio(), propostas: [prop('x1', { estado: 'aceita', texto_final: 'Synthetic paragraph, shorter.', decidido_em: T1, atualizado_em: T1, sync: 'pendente' })] };
  const m = M.merge(local, remoto);
  assert.equal(m.count, 1); assert.equal(m.push, true);
  assert.deepEqual(m.result.propostas.map(p => p.id + ':' + p.estado), ['x1:aceita', 'x2:proposta']);
  assert.deepEqual(m.apply.map(a => a.coll + '/' + a.rec.id), ['propostas/x2']);
  assert.deepEqual(m.sent, [{ coll: 'propostas', id: 'x1', ver: T1, tomb: false }]);
  // o contrário: a decisão de outro aparelho (mais nova) desce e substitui a proposta local sem decisão
  const m2 = M.merge({ ...vazio(), propostas: [prop('x1')] }, M.fromEstado({ propostas: [prop('x1', { estado: 'rejeitada', decidido_em: T1, atualizado_em: T1 })] }));
  assert.equal(m2.count, 0); assert.equal(m2.push, false);
  assert.deepEqual(m2.apply.map(a => a.rec.id + ':' + a.rec.estado), ['x1:rejeitada']);
  // duas decisões: a mais nova vence (mudar a decisão depois vale)
  const m3 = M.merge({ ...vazio(), propostas: [prop('x1', { estado: 'modificada', texto_final: 'Texto dele.', decidido_em: T2, atualizado_em: T2, sync: 'pendente' })] },
    M.fromEstado({ propostas: [prop('x1', { estado: 'aceita', decidido_em: T1, atualizado_em: T1 })] }));
  assert.deepEqual(m3.result.propostas.map(p => p.estado + ':' + p.texto_final), ['modificada:Texto dele.']);
});

test('toEstado com extra: chaves desconhecidas e tombstones de coleções desconhecidas passam como estão', () => {
  const remoto = { schema: 1, tiragem: 'f0f0f0f0', comentarios: [], grifos: [], revisadas: [], propostas: [prop('x1')], progresso: null,
    tombstones: [{ id: 'z1', coll: 'futura', apagado_em: T0, atualizado_em: T0 }, { id: 'c9', coll: 'comentarios', apagado_em: T0, atualizado_em: T0 }],
    futura: [{ id: 'z2', atualizado_em: T0 }], nota_do_script: { versao: 7 } };
  const snap = M.fromEstado(remoto);
  const est = M.toEstado(snap, { agora: T2, extra: remoto });
  assert.deepEqual(est.futura, [{ id: 'z2', atualizado_em: T0 }]);
  assert.deepEqual(est.nota_do_script, { versao: 7 });
  assert.deepEqual(est.tombstones.map(t => t.coll + '/' + t.id), ['comentarios/c9', 'futura/z1']);
  assert.deepEqual(est.propostas.map(p => p.id), ['x1']);
  // sem extra, nada de desconhecido entra
  assert.equal('futura' in M.toEstado(snap, { agora: T2 }), false);
});

// ---------- GitHub e aparelhos de mentira (como em test_sync.mjs, com a coleção nova) ----------
function fakeGitHub() {
  const files = {}; let n = 0; const log = [];
  const res = (status, body, raw) => ({ status, ok: status >= 200 && status < 300, headers: { get: () => null }, json: async () => body, text: async () => raw != null ? raw : JSON.stringify(body) });
  async function fetch(url, init) {
    const path = url.split('/contents/')[1]; log.push(init.method + ' ' + path);
    if (init.method === 'GET') {
      const f = files[path]; if (!f) return res(404, { message: 'Not Found' });
      if (init.headers.Accept === 'application/vnd.github.raw') return res(200, null, f.text);
      return res(200, { sha: f.sha, encoding: 'base64', content: M.b64encodeUtf8(f.text) });
    }
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body), cur = files[path];
      if (cur && body.sha !== cur.sha) return res(409, { message: 'sha mismatch' });
      files[path] = { sha: 'sha' + (++n), text: M.b64decodeUtf8(body.content), message: body.message };
      return res(200, { content: { sha: files[path].sha } });
    }
    return res(405, {});
  }
  return { files, log, fetch };
}
function fakeDevice() {
  const d = { comentarios: {}, grifos: {}, revisadas: {}, propostas: {}, progresso: null, indice: null };
  d.snapshot = () => JSON.parse(JSON.stringify({ comentarios: Object.values(d.comentarios), grifos: Object.values(d.grifos), revisadas: Object.values(d.revisadas), propostas: Object.values(d.propostas), progresso: d.progresso }));
  d.applyLocal = list => list.forEach(({ coll, rec }) => { if (coll === 'progresso') { d.progresso = { ...rec, sync: 'enviado' }; return; } if (rec.sync === 'tombstone') delete d[coll][rec.id]; else d[coll][rec.id] = { ...rec, sync: 'enviado' }; });
  d.markSent = list => list.forEach(s => { if (s.coll === 'progresso') return; const cur = d[s.coll][s.id]; if (!cur || M.ver(cur) !== s.ver) return; if (s.tomb) delete d[s.coll][s.id]; else cur.sync = 'enviado'; });
  d.decidir = (id, estado, texto, t) => Object.assign(d.propostas[id], { estado, texto_final: estado === 'aceita' ? d.propostas[id].proposta : (estado === 'modificada' ? texto : ''), decidido_em: t, atualizado_em: t, sync: 'pendente' });
  return d;
}
function mk(M2, gh, dev, comIndice = true) {
  let t = 0;
  return M2.createSync({ fetch: gh.fetch, getConfig: () => ({ token: 'TOKEN-FALSO', repo: 'dono/mesa-dados' }), getLocal: dev.snapshot, applyLocal: dev.applyLocal, markSent: dev.markSent,
    applyRespostas: () => { }, applyIndice: comIndice ? (j => { dev.indice = j; }) : undefined, isOnline: () => true,
    now: () => '2026-10-15T19:30:' + String(10 + (t++)).padStart(2, '0') + '.000Z', tiragem: () => 'f0f0f0f0' });
}
const repoEstado = gh => JSON.parse(gh.files['dados/estado.json'].text);

test('dois aparelhos: a carga do script desce, a decisão de um chega ao outro, e o índice das tiragens é lido', async () => {
  const gh = fakeGitHub();
  gh.files['dados/estado.json'] = { sha: 'sha0', text: M.serialize({ schema: 1, tiragem: 'f0f0f0f0', comentarios: [], grifos: [], revisadas: [], propostas: [prop('x1'), prop('x2')], progresso: null, tombstones: [], extra_do_teste: { n: 1 } }) };
  gh.files['tiragens/index.json'] = { sha: 'i', text: JSON.stringify({ tiragens: [{ tiragem: 'f0f0f0f0', linha: 'fallback' }] }) };
  const A = fakeDevice(), B = fakeDevice();
  assert.equal((await mk(M, gh, A).syncNow()).ok, true);
  assert.deepEqual(Object.keys(A.propostas).sort(), ['x1', 'x2']);
  assert.deepEqual(A.indice.tiragens[0], { tiragem: 'f0f0f0f0', linha: 'fallback' });
  assert.ok(gh.log.includes('GET tiragens/index.json'));
  await mk(M, gh, B).syncNow();
  A.decidir('x1', 'modificada', 'Texto dele, no lugar.', T1);
  const r = await mk(M, gh, A).syncNow();
  assert.equal(r.count, 1);
  let est = repoEstado(gh);
  assert.deepEqual(est.propostas.map(p => p.id + ':' + p.estado + ':' + p.sync), ['x1:modificada:enviado', 'x2:proposta:enviado']);
  assert.deepEqual(est.extra_do_teste, { n: 1 }, 'a chave desconhecida continua no estado.json');
  await mk(M, gh, B).syncNow();
  assert.equal(B.propostas.x1.estado, 'modificada'); assert.equal(B.propostas.x1.texto_final, 'Texto dele, no lugar.');
  // B muda a decisão depois; A recebe
  B.decidir('x1', 'aceita', '', T2);
  await mk(M, gh, B).syncNow(); await mk(M, gh, A).syncNow();
  assert.equal(A.propostas.x1.estado, 'aceita'); assert.equal(A.propostas.x1.texto_final, 'Synthetic paragraph, shorter.');
  assert.equal(Object.values(A.propostas).filter(p => p.sync !== 'enviado').length, 0);
  est = repoEstado(gh);
  assert.equal(est.propostas.length, 2);
});

test('cliente antigo (sync.js de b001cd8) sincroniza depois da carga: apaga a coleção; o aparelho novo a devolve com as decisões', async (t) => {
  let antigo;
  try {
    const dir = mkdtempSync(join(tmpdir(), 'mesa-antigo-'));
    writeFileSync(join(dir, 'sync_antigo.js'), execFileSync('git', ['-C', RAIZ, 'show', 'b001cd8:sync.js']));
    antigo = require(join(dir, 'sync_antigo.js'));
  } catch (e) { t.skip('sem o git ou sem o commit b001cd8: ' + e.message); return; }
  assert.deepEqual(antigo.COLLS, ['comentarios', 'grifos', 'revisadas']);
  const gh = fakeGitHub();
  gh.files['dados/estado.json'] = { sha: 'sha0', text: M.serialize({ schema: 1, tiragem: 'f0f0f0f0', comentarios: [], grifos: [], revisadas: [], propostas: [prop('x1'), prop('x2')], progresso: null, tombstones: [] }) };
  const novo = fakeDevice();
  await mk(M, gh, novo).syncNow();
  novo.decidir('x2', 'rejeitada', '', T1);
  // o aparelho antigo envia um comentário: o estado.json volta sem a chave propostas
  const velho = fakeDevice();
  velho.comentarios.c1 = { id: 'c1', pagina: 1, trecho: 'p1-1', tipo: 'correcao', texto: 'x', criado_em: T1, atualizado_em: T1, estado: 'aberto', tiragem: 'f0f0f0f0', sync: 'pendente' };
  assert.equal((await mk(antigo, gh, velho, false).syncNow()).ok, true);
  assert.equal('propostas' in repoEstado(gh), false, 'o cliente antigo regrava o estado.json sem a coleção');
  // o aparelho novo sincroniza: as propostas que ele tem voltam, com a decisão dele, e o comentário do antigo fica
  const r = await mk(M, gh, novo).syncNow();
  assert.equal(r.ok, true);
  const est = repoEstado(gh);
  assert.deepEqual(est.propostas.map(p => p.id + ':' + p.estado), ['x1:proposta', 'x2:rejeitada']);
  assert.deepEqual(est.comentarios.map(c => c.id), ['c1']);
  assert.equal(r.count, 2);
});

test('retirada pelo script (mesa_propostas.py --retirar): o tombstone mais novo apaga o cartão no aparelho; uma decisão posterior à retirada volta', () => {
  // o script tira x1 do estado.json e grava o tombstone com atualizado_em = agora (T2)
  const remoto = M.fromEstado({ propostas: [prop('x2')], tombstones: [{ id: 'x1', coll: 'propostas', pagina: 3, apagado_em: T2, atualizado_em: T2 }] });
  const m = M.merge({ ...vazio(), propostas: [prop('x1'), prop('x2')] }, remoto);
  assert.equal(m.push, false);
  assert.deepEqual(m.apply.map(a => a.coll + '/' + a.rec.id + ':' + a.rec.sync), ['propostas/x1:tombstone']);
  assert.deepEqual(m.result.propostas.map(p => p.id + ':' + p.sync), ['x2:enviado', 'x1:tombstone']);
  // aparelho que já não tem o cartão: o tombstone fica no repositório e nada desce
  const m2 = M.merge({ ...vazio(), propostas: [prop('x2')] }, remoto);
  assert.deepEqual(m2.apply, []);
  assert.ok(m2.result.propostas.some(p => p.id === 'x1' && p.sync === 'tombstone'));
  // decisão tomada depois da retirada (aparelho sem rede): a última escrita vence e o cartão volta com a decisão
  const T3 = '2026-10-15T20:00:00.000Z';
  const m3 = M.merge({ ...vazio(), propostas: [prop('x1', { estado: 'aceita', texto_final: 'Synthetic paragraph, shorter.', decidido_em: T3, atualizado_em: T3, sync: 'pendente' })] }, remoto);
  assert.equal(m3.push, true);
  assert.deepEqual(m3.result.propostas.filter(p => p.id === 'x1').map(p => p.estado + ':' + p.sync), ['aceita:pendente']);
  const est = M.toEstado(m.result, { agora: T3 });
  assert.deepEqual(est.tombstones, [{ id: 'x1', coll: 'propostas', pagina: 3, apagado_em: T2, atualizado_em: T2 }]);
});
