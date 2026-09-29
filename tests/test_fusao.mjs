// Teste unitário da fusão (sem rede): node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../sync.js');

const T0 = '2026-09-29T10:00:00.000Z', T1 = '2026-09-29T11:00:00.000Z', T2 = '2026-09-29T12:00:00.000Z';
const com = (id, t, sync = 'pendente', extra = {}) => ({ id, pagina: 10, trecho: 'p10-2', grifo: null, tipo: 'correcao', texto: 'x ' + id, criado_em: t, atualizado_em: t, estado: 'aberto', tiragem: 'aaaa1111', sync, ...extra });
const tomb = (id, t) => ({ id, pagina: 10, apagado_em: t, atualizado_em: t, sync: 'tombstone' });
const vazio = () => ({ comentarios: [], grifos: [], revisadas: [], progresso: null });

test('só local: o item sobe e é marcado como enviado', () => {
  const local = { ...vazio(), comentarios: [com('c1', T1)] };
  const m = S.merge(local, vazio());
  assert.equal(m.count, 1);
  assert.equal(m.push, true);
  assert.deepEqual(m.result.comentarios.map(c => c.id), ['c1']);
  assert.deepEqual(m.apply, []);
  assert.deepEqual(m.sent, [{ coll: 'comentarios', id: 'c1', ver: T1, tomb: false }]);
  const est = S.toEstado(m.result, { agora: T2, tiragem: 'aaaa1111' });
  assert.equal(est.comentarios[0].sync, 'enviado');
});

test('só remoto: o item desce para o aparelho e nada sobe', () => {
  const remote = S.fromEstado({ comentarios: [com('c2', T0, 'enviado')], grifos: [{ id: 'g1', pagina: 3, x: 0.1, y: 0.2, w: 0.3, h: 0.01, criado_em: T0, atualizado_em: T0, sync: 'enviado' }], revisadas: [], tombstones: [] });
  const m = S.merge(vazio(), remote);
  assert.equal(m.count, 0);
  assert.equal(m.push, false);
  assert.deepEqual(m.apply.map(a => a.coll + '/' + a.rec.id).sort(), ['comentarios/c2', 'grifos/g1']);
});

test('mesmo id, local mais novo: local vence e sobe', () => {
  const local = { ...vazio(), revisadas: [{ id: '12', pagina: 12, em: T2, atualizado_em: T2, tiragem: 'aaaa1111', sync: 'pendente' }] };
  const remote = { ...vazio(), revisadas: [{ id: '12', pagina: 12, em: T0, atualizado_em: T0, tiragem: 'aaaa1111', sync: 'enviado' }] };
  const m = S.merge(local, remote);
  assert.equal(m.count, 1);
  assert.equal(m.result.revisadas[0].em, T2);
  assert.deepEqual(m.apply, []);
});

test('mesmo id, remoto mais novo: remoto vence e desce', () => {
  const local = { ...vazio(), revisadas: [{ id: '12', pagina: 12, em: T0, atualizado_em: T0, sync: 'enviado' }] };
  const remote = { ...vazio(), revisadas: [{ id: '12', pagina: 12, em: T2, atualizado_em: T2, sync: 'enviado' }] };
  const m = S.merge(local, remote);
  assert.equal(m.count, 0);
  assert.equal(m.push, false);
  assert.equal(m.apply.length, 1);
  assert.equal(m.apply[0].rec.em, T2);
});

test('tombstone local apaga o item no repositório e o registro vai para tombstones', () => {
  const local = { ...vazio(), comentarios: [tomb('c3', T2)] };
  const remote = { ...vazio(), comentarios: [com('c3', T0, 'enviado')] };
  const m = S.merge(local, remote);
  assert.equal(m.count, 1);
  assert.equal(m.push, true);
  const est = S.toEstado(m.result, { agora: T2 });
  assert.equal(est.comentarios.length, 0);
  assert.equal(est.tombstones.length, 1);
  assert.deepEqual({ id: est.tombstones[0].id, coll: est.tombstones[0].coll, apagado_em: est.tombstones[0].apagado_em }, { id: 'c3', coll: 'comentarios', apagado_em: T2 });
  assert.deepEqual(m.sent, [{ coll: 'comentarios', id: 'c3', ver: T2, tomb: true }]);
  // a próxima fusão, já sem o tombstone local, mantém a remoção e não ressuscita o item
  const m2 = S.merge(vazio(), S.fromEstado(est));
  assert.equal(m2.apply.length, 0);
  assert.equal(m2.push, false);
});

test('tombstone remoto mais novo apaga o item local', () => {
  const local = { ...vazio(), grifos: [{ id: 'g9', pagina: 4, criado_em: T0, atualizado_em: T0, sync: 'enviado' }] };
  const remote = S.fromEstado({ tombstones: [{ id: 'g9', coll: 'grifos', pagina: 4, apagado_em: T1, atualizado_em: T1 }] });
  const m = S.merge(local, remote);
  assert.equal(m.apply.length, 1);
  assert.equal(m.apply[0].rec.sync, 'tombstone');
  assert.equal(m.count, 0);
});

test('item recriado depois da remoção (revisada desmarcada e marcada de novo) vence o tombstone antigo', () => {
  const local = { ...vazio(), revisadas: [{ id: '7', pagina: 7, em: T2, atualizado_em: T2, sync: 'pendente' }] };
  const remote = S.fromEstado({ tombstones: [{ id: '7', coll: 'revisadas', pagina: 7, apagado_em: T1, atualizado_em: T1 }] });
  const m = S.merge(local, remote);
  assert.equal(m.count, 1);
  const est = S.toEstado(m.result, { agora: T2 });
  assert.equal(est.revisadas.length, 1);
  assert.equal(est.tombstones.length, 0);
});

test('tombstone local de item que nunca chegou ao repositório não sobe', () => {
  const m = S.merge({ ...vazio(), grifos: [tomb('g5', T1)] }, vazio());
  assert.equal(m.count, 0);
  assert.equal(m.push, false);
  assert.deepEqual(m.sent, [{ coll: 'grifos', id: 'g5', ver: T1, tomb: true }]);
});

test('empate de versão: nada sobe e o pendente é confirmado', () => {
  const m = S.merge({ ...vazio(), comentarios: [com('c4', T1, 'pendente')] }, { ...vazio(), comentarios: [com('c4', T1, 'enviado')] });
  assert.equal(m.count, 0);
  assert.equal(m.push, false);
  assert.deepEqual(m.sent.map(s => s.id), ['c4']);
});

test('progresso só acompanha um envio; sozinho não gera commit', () => {
  const p = { id: 'leitura', pagina: 80, atualizado_em: T2, sync: 'pendente' };
  const r = { id: 'leitura', pagina: 55, atualizado_em: T0, sync: 'enviado' };
  const m1 = S.merge({ ...vazio(), progresso: p }, { ...vazio(), progresso: r });
  assert.equal(m1.push, false);
  const m2 = S.merge({ ...vazio(), progresso: p, comentarios: [com('c5', T1)] }, { ...vazio(), progresso: r });
  assert.equal(m2.push, true);
  assert.equal(m2.result.progresso.pagina, 80);
  const m3 = S.merge(vazio(), { ...vazio(), progresso: r });
  assert.deepEqual(m3.apply, [{ coll: 'progresso', rec: r }]);
});

test('estado.json inicial vindo do artifact (revisadas em mapa) é lido', () => {
  const snap = S.fromEstado({ revisadas: { '3': T0 }, progresso: { id: 'leitura', pagina: 55, atualizado_em: T0 } });
  assert.deepEqual(snap.revisadas, [{ id: '3', pagina: 3, em: T0, atualizado_em: T0 }]);
  assert.equal(snap.progresso.pagina, 55);
});

test('serialize produz JSON válido e base64 UTF-8 ida e volta', () => {
  const est = S.toEstado({ ...vazio(), comentarios: [com('c6', T0, 'pendente', { texto: 'ação, dúvida «ç» 😀' })] }, { agora: T1 });
  const txt = S.serialize(est);
  assert.deepEqual(JSON.parse(txt), est);
  assert.equal(S.b64decodeUtf8(S.b64encodeUtf8(txt)), txt);
});
