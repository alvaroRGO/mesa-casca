// Linhas de versão e «Proposta de modificação» no index.html (sem rede e sem navegador): node --test tests/test_propostas.mjs
// Roda o código real (linhaDe, linhaReg, daLinha, linhaAberta, revId, pintaDiff, propsDaTiragem, propostasDoTrecho,
// cmpProp, proximaProposta, store.decidir, commentsOf, grifosOfPage, pageMark, rebuildRev e batchText) num DOM mínimo de
// mentira, com dados sintéticos: nada da tese entra aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function fonteFuncao(nome) {
  const i = js.indexOf('function ' + nome + '(');
  assert.ok(i >= 0, 'função ausente no index.html: ' + nome);
  for (let k = js.indexOf('{', i), d = 0; k < js.length; k++) {
    if (js[k] === '{') d++;
    else if (js[k] === '}' && --d === 0) return js.slice(i, k + 1);
  }
  throw new Error('chaves desbalanceadas em ' + nome);
}
function fonteVar(nome) {
  const i = js.indexOf('var ' + nome + ' = {');
  assert.ok(i >= 0, 'variável ausente no index.html: ' + nome);
  for (let k = js.indexOf('{', i), d = 0; k < js.length; k++) {
    if (js[k] === '{') d++;
    else if (js[k] === '}' && --d === 0) return js.slice(i, k + 1) + ';';
  }
  throw new Error('chaves desbalanceadas em ' + nome);
}
const FUNCOES = ['linhaDe', 'linhaReg', 'daLinha', 'linhaAberta', 'nomeLinha', 'revId', 'decidida', 'propsDaTiragem', 'posProp', 'cmpProp', 'propostasDoTrecho', 'pintaDiff', 'mkEl',
  'proximaProposta', 'cmMostra', 'commentsOf', 'commentsOfGrifo', 'grifosOfPage', 'pageMark', 'rebuildRev', 'findById', 'reviewedCount', 'fmtTime', 'nowIso', 'tipoLabel', 'batchText'];
const FONTE = [js.match(/var NOMES_LINHA = \{[^}]*\};/)[0], js.match(/var ROTULO_PROP = \{[^}]*\};/)[0], fonteVar('store'), ...FUNCOES.map(fonteFuncao)].join('\n');

class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this._text = ''; this.className = ''; this.checked = false; }
  appendChild(c) { this.children.push(c); return c; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
}
const T0 = '2026-10-15T17:00:00.000Z';
const seg = id => ({ id, kind: 'text', text: 'Synthetic ' + id + '.', bbox: [50, 100, 500, 120] });
const PAGES = [{ segs: [seg('p1-1'), seg('p1-2'), seg('p1-3')] }, { segs: [seg('p2-1'), seg('p2-2')] }, { segs: [seg('p3-1')] }];
const prop = (id, pagina, trecho, extra = {}) => ({ id, tiragem: 'ffff0000', linha: 'fallback', pagina, trecho, proposta: 'Nova forma ' + id + '.', diff: [['igual', 'x']], motivo: 'm', estado: 'proposta', texto_final: '', criado_em: T0, atualizado_em: T0, decidido_em: null, sync: 'enviado', ...extra });
function ambiente({ linha = 'fallback', tiragem = 'ffff0000', indice = { aaaa1111: { linha: 'nucleo' }, ffff0000: { linha: 'fallback' } }, props = [], page = 1 } = {}) {
  const ids = {};
  const ctx = {
    S: { linha, tiragem, tiragemInfo: { tiragem, linha: null }, indice, page, pages: PAGES, filtro: 'todos', props, active: null, propAtiva: null,
      comments: [], grifos: [], revDocs: {}, revisadas: {}, tombs: { comentarios: {}, grifos: {}, revisadas: {}, propostas: {} } },
    $: id => (ids[id] ||= Object.assign(new El('div'), { id })), ids, TOTAL: 3, toasts: [], idas: [], gravados: [], renders: 0,
    document: { createElement: t => new El(t), createTextNode: t => Object.assign(new El('#text'), { textContent: t }) },
    renderAll: () => { ctx.renders++; }, syncUi: () => { }, storeFail: e => { throw e; },
    idb: { put: (s, v) => { ctx.gravados.push([s, JSON.parse(JSON.stringify(v))]); return Promise.resolve(); }, batch: () => Promise.resolve() },
  };
  ctx.toast = m => ctx.toasts.push(m);
  ctx.irParaProposta = p => { ctx.idas.push(p.id); ctx.S.propAtiva = p.id; ctx.S.page = p.pagina; };
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  ctx.$('onlyPage').checked = false;
  return ctx;
}

test('linha de cada registro: o campo linha, depois o índice pela tiragem; fora do índice, núcleo; a tiragem aberta sem índice usa a linha aberta', () => {
  const c = ambiente();
  assert.equal(c.linhaReg({ tiragem: 'aaaa1111' }), 'nucleo');
  assert.equal(c.linhaReg({ tiragem: 'ffff0000' }), 'fallback');
  assert.equal(c.linhaReg({ tiragem: 'aaaa1111', linha: 'fallback' }), 'fallback');
  assert.equal(c.linhaReg({ tiragem: 'bbbb9999' }), 'nucleo');
  assert.equal(c.linhaReg({}), 'nucleo');
  assert.equal(c.daLinha({ tiragem: 'ffff0000' }), true);
  assert.equal(c.daLinha({ tiragem: 'aaaa1111' }), false);
  const sem = ambiente({ indice: {}, linha: 'fallback' });
  assert.equal(sem.linhaReg({ tiragem: 'ffff0000' }), 'fallback', 'registro da tiragem aberta, sem índice');
  assert.equal(sem.linhaReg({ tiragem: 'aaaa1111' }), 'nucleo');
});

test('linha da tiragem aberta: o índice; sem ele, o manifest guardado; sem os dois, núcleo', () => {
  const c = ambiente();
  assert.equal(c.linhaAberta(), 'fallback');
  c.S.indice = {}; c.S.tiragemInfo = { tiragem: 'ffff0000', linha: 'fallback' };
  assert.equal(c.linhaAberta(), 'fallback');
  c.S.tiragemInfo = { tiragem: 'ffff0000', linha: null };
  assert.equal(c.linhaAberta(), 'nucleo');
  c.S.tiragem = null; c.S.indice = { ffff0000: { linha: 'fallback' } };
  assert.equal(c.linhaAberta(), 'fallback', 'antes do applyTese, pela tiragem guardada');
  assert.equal(c.nomeLinha('fallback'), 'Fallback'); assert.equal(c.nomeLinha('nucleo'), 'Núcleo'); assert.equal(c.nomeLinha('b5'), 'b5');
});

test('página revisada: id de número no núcleo e «linha:página» nas outras; rebuildRev só com a linha aberta', () => {
  const c = ambiente();
  assert.equal(c.revId(5), 'fallback:5');
  c.S.linha = 'nucleo'; assert.equal(c.revId(5), '5');
  c.S.revDocs = { 5: { id: '5', pagina: 5, tiragem: 'aaaa1111', em: T0 }, 'fallback:7': { id: 'fallback:7', pagina: 7, linha: 'fallback', em: T0 }, 9: { id: '9', pagina: 9, tiragem: 'ffff0000', em: T0 } };
  c.rebuildRev(); assert.deepEqual(Object.keys(c.S.revisadas).sort(), ['5']);
  c.S.linha = 'fallback'; c.rebuildRev(); assert.deepEqual(Object.keys(c.S.revisadas).sort(), ['7', '9']);
});

test('comentários, grifos e mapa de páginas: só os da linha aberta, no mesmo trecho e na mesma página', () => {
  const c = ambiente();
  c.S.comments = [{ id: 'n', pagina: 1, trecho: 'p1-2', tiragem: 'aaaa1111' }, { id: 'f', pagina: 1, trecho: 'p1-2', tiragem: 'ffff0000' }, { id: 'n2', pagina: 2, trecho: null, tiragem: 'aaaa1111' }];
  c.S.grifos = [{ id: 'gn', pagina: 1, tiragem: 'aaaa1111' }, { id: 'gf', pagina: 3, linha: 'fallback' }];
  assert.deepEqual(c.commentsOf('p1-2').map(x => x.id), ['f']);
  assert.deepEqual(c.grifosOfPage(1).map(x => x.id), []);
  assert.deepEqual(c.grifosOfPage(3).map(x => x.id), ['gf']);
  assert.equal(c.pageMark(2), '');
  c.S.linha = 'nucleo';
  assert.deepEqual(c.commentsOf('p1-2').map(x => x.id), ['n']);
  assert.equal(c.pageMark(2), ' has');
  const lote = c.batchText();
  assert.match(lote, /Comentários: 2\. Grifos sem comentário: 1\./);
  assert.doesNotMatch(lote, /PROPOSTAS/);
});

test('pintaDiff: igual em texto, sai em <del>, entra em <ins>, na ordem; sem diff, o texto alternativo; espaço só na junta sem espaço', () => {
  const c = ambiente(), el = new El('div');
  c.pintaDiff(el, [['igual', 'O modelo '], ['sai', 'estima '], ['entra', 'identifica '], ['igual', 'os dados.'], ['sai', ''], ['outra', '!']], 'alt');
  assert.deepEqual(el.children.map(x => x.tagName + ':' + x.textContent), ['#TEXT:O modelo ', 'DEL:estima ', 'INS:identifica ', '#TEXT:os dados.', '#TEXT: ', '#TEXT:!']);
  const sem = new El('div'); c.pintaDiff(sem, [['sai', 'a'], ['entra', 'b']]);
  assert.equal(sem.textContent, 'a b');
  const vazio = new El('div'); c.pintaDiff(vazio, null, 'texto da proposta'); assert.equal(vazio.textContent, 'texto da proposta');
});

test('propostas da tiragem aberta e do trecho, na ordem do documento; «Próxima proposta» pula as decididas e volta ao começo', () => {
  const props = [prop('d', 3, 'p3-1'), prop('b', 2, 'p2-1'), prop('a', 1, 'p1-3', { estado: 'aceita' }), prop('c', 2, 'p2-2'), prop('z', 2, 'p2-1', { tiragem: 'aaaa1111', linha: 'nucleo' }), prop('e', 1, 'p1-1')];
  const c = ambiente({ props });
  assert.deepEqual(c.propsDaTiragem().sort(c.cmpProp).map(p => p.id), ['e', 'a', 'b', 'c', 'd']);
  c.S.page = 2; assert.deepEqual(c.propostasDoTrecho('p2-1').map(p => p.id), ['b']);
  c.S.page = 1; c.S.propAtiva = 'a';
  for (let i = 0; i < 5; i++) c.proximaProposta();
  assert.deepEqual(c.idas, ['b', 'c', 'd', 'e', 'b']);
  const d = ambiente({ props: [prop('a', 1, 'p1-1'), prop('b', 3, 'p3-1')], page: 2 });
  d.proximaProposta(); assert.deepEqual(d.idas, ['b'], 'sem proposta ativa: a partir da página corrente');
  const todas = ambiente({ props: [prop('a', 1, 'p1-1', { estado: 'rejeitada' }), prop('b', 2, 'p2-1', { estado: 'modificada' })] });
  assert.equal(todas.proximaProposta(), null);
  assert.deepEqual(todas.toasts, ['As 2 propostas desta versão estão decididas']);
  assert.equal(ambiente({ tiragem: 'aaaa1111', linha: 'nucleo', props }).propsDaTiragem().length, 1);
});

test('store.decidir: aceita copia a proposta, modificada grava o texto dele, rejeitada limpa; sempre pendente, com decidido_em = atualizado_em', async () => {
  const c = ambiente({ props: [prop('a', 1, 'p1-1')] });
  await c.store.decidir('a', 'aceita');
  let p = c.S.props[0];
  assert.equal(p.estado, 'aceita'); assert.equal(p.texto_final, 'Nova forma a.'); assert.equal(p.sync, 'pendente'); assert.equal(p.decidido_em, p.atualizado_em); assert.ok(p.atualizado_em > T0);
  await c.store.decidir('a', 'modificada', 'Texto dele.');
  assert.equal(p.texto_final, 'Texto dele.');
  await c.store.decidir('a', 'rejeitada', 'ignorado');
  assert.equal(p.texto_final, '');
  assert.deepEqual(c.gravados.map(g => g[0] + ':' + g[1].estado), ['propostas:aceita', 'propostas:modificada', 'propostas:rejeitada']);
  await assert.rejects(c.store.decidir('nao-existe', 'aceita'));
  assert.equal(c.renders, 3);
});

test('Copiar lote: as decididas da tiragem aberta com id, estado, prioridade e o texto final das modificadas; as sem decisão só contadas', () => {
  const c = ambiente({ props: [prop('a', 1, 'p1-1', { estado: 'aceita', prioridade: 'A' }), prop('b', 2, 'p2-1', { estado: 'modificada', texto_final: 'Linha 1\nLinha 2', prioridade: 'B' }), prop('c', 3, 'p3-1')] });
  const linhas = c.batchText().split('\n');
  const i = linhas.indexOf('PROPOSTAS DE MODIFICAÇÃO: 3, 2 decididas, 1 sem decisão.');
  assert.ok(i > 0);
  assert.deepEqual(linhas.slice(i + 1, i + 5), ['- p. 1, trecho p1-1, a [aceita, A]: m', '- p. 2, trecho p2-1, b [modificada, B]: m', '   Texto final: Linha 1', '   Linha 2']);
});
