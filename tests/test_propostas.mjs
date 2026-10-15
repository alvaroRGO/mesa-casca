// Linhas de versão e «Proposta de modificação» no index.html (sem rede e sem navegador): node --test tests/test_propostas.mjs
// Roda o código real (linhaDe, linhaReg, daLinha, linhaAberta, linhaConhecida, revId, pintaDiff, propsDaTiragem,
// propostasDoTrecho, cmpProp, proximaProposta, store.decidir, commentsOf, grifosOfPage, pageMark, rebuildRev, batchText,
// renderVersoes e abrirVersao) num DOM mínimo de
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
const FUNCOES = ['linhaDe', 'linhaReg', 'daLinha', 'linhaAberta', 'linhaConhecida', 'nomeLinha', 'revId', 'renderVersoes', 'abrirVersao', 'decidida', 'propsDaTiragem', 'posProp', 'cmpProp', 'propostasDoTrecho', 'pintaDiff', 'mkEl',
  'proximaProposta', 'cmMostra', 'commentsOf', 'commentsOfGrifo', 'grifosOfPage', 'pageMark', 'rebuildRev', 'findById', 'reviewedCount', 'fmtTime', 'nowIso', 'tipoLabel', 'batchText'];
const FONTE = [js.match(/var NOMES_LINHA = \{[^}]*\};/)[0], js.match(/var ROTULO_PROP = \{[^}]*\};/)[0], fonteVar('store'), ...FUNCOES.map(fonteFuncao)].join('\n');

class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this._text = ''; this.className = ''; this.checked = false; this.dataset = {}; this.on = {}; this.hidden = false; this.value = ''; }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(t, f) { this.on[t] = f; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
}
const T0 = '2026-10-15T17:00:00.000Z';
const seg = id => ({ id, kind: 'text', text: 'Synthetic ' + id + '.', bbox: [50, 100, 500, 120] });
const PAGES = [{ segs: [seg('p1-1'), seg('p1-2'), seg('p1-3')] }, { segs: [seg('p2-1'), seg('p2-2')] }, { segs: [seg('p3-1')] }];
const prop = (id, pagina, trecho, extra = {}) => ({ id, tiragem: 'ffff0000', linha: 'fallback', pagina, trecho, proposta: 'Nova forma ' + id + '.', diff: [['igual', 'x']], motivo: 'm', estado: 'proposta', texto_final: '', criado_em: T0, atualizado_em: T0, decidido_em: null, sync: 'enviado', ...extra });
function ambiente({ linha = 'fallback', tiragem = 'ffff0000', indice = { aaaa1111: { linha: 'nucleo' }, ffff0000: { linha: 'fallback' } }, props = [], page = 1, indiceLista = [] } = {}) {
  const ids = {};
  const ctx = {
    S: { linha, tiragem, tiragemInfo: { tiragem, linha: null }, indice, indiceLista, page, pages: PAGES, filtro: 'todos', props, active: null, propAtiva: null,
      comments: [], grifos: [], revDocs: {}, revisadas: {}, tombs: { comentarios: {}, grifos: {}, revisadas: {}, propostas: {} } },
    $: id => (ids[id] ||= Object.assign(new El('div'), { id })), ids, TOTAL: 3, toasts: [], idas: [], gravados: [], renders: 0,
    document: { createElement: t => new El(t), createTextNode: t => Object.assign(new El('#text'), { textContent: t }) },
    renderAll: () => { ctx.renders++; }, syncUi: () => { }, storeFail: e => { throw e; },
    idb: { put: (s, v) => { ctx.gravados.push([s, JSON.parse(JSON.stringify(v))]); return Promise.resolve(); }, batch: () => Promise.resolve() },
  };
  ctx.toast = m => ctx.toasts.push(m);
  ctx.salvos = []; ctx.baixadas = [];
  ctx.saveCfg = () => { ctx.salvos.push(ctx.$('cfgTiragem').value); return Promise.resolve(); };
  ctx.baixarTese = () => { ctx.baixadas.push(ctx.$('cfgTiragem').value); };
  ctx.irParaProposta = p => { ctx.idas.push(p.id); ctx.S.propAtiva = p.id; ctx.S.page = p.pagina; };
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  ctx.$('onlyPage').checked = false;
  return ctx;
}

test('linha de cada registro: o índice pela tiragem vence o campo linha; fora do índice, o campo; sem os dois, núcleo; a tiragem aberta sem índice usa a linha aberta', () => {
  const c = ambiente();
  assert.equal(c.linhaReg({ tiragem: 'aaaa1111' }), 'nucleo');
  assert.equal(c.linhaReg({ tiragem: 'ffff0000' }), 'fallback');
  assert.equal(c.linhaReg({ tiragem: 'aaaa1111', linha: 'fallback' }), 'nucleo', 'o índice vence o campo gravado');
  assert.equal(c.linhaReg({ tiragem: 'ffff0000', linha: 'nucleo' }), 'fallback', 'o índice vence o campo gravado');
  assert.equal(c.linhaReg({ tiragem: 'bbbb9999', linha: 'fallback' }), 'fallback', 'fora do índice, vale o campo');
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

test('registro feito antes de o índice chegar (linha da tiragem aberta só presumida) passa à linha certa quando ele chega', () => {
  // a tiragem do fallback guardada antes desta versão, sem o índice e sem o manifest: abre como núcleo (presumida)
  const c = ambiente({ indice: {}, linha: 'nucleo' });
  assert.equal(c.linhaAberta(), 'nucleo'); assert.equal(c.linhaConhecida(), false);
  const cm = { id: 'c1', pagina: 1, trecho: 'p1-2', tiragem: 'ffff0000', linha: c.S.linha }, gf = { id: 'g1', pagina: 1, tiragem: 'ffff0000', linha: c.S.linha };
  const rv = { id: c.revId(1), pagina: 1, tiragem: 'ffff0000', linha: c.S.linha, em: T0 }, v10 = { id: '1', pagina: 1, tiragem: 'aaaa1111', em: T0 };
  assert.equal(rv.id, 'ffff0000:1', 'com a linha presumida, a revisada não usa o id de número (o do núcleo)');
  c.S.comments = [cm, { id: 'cv10', pagina: 1, trecho: 'p1-2', tiragem: 'aaaa1111' }]; c.S.grifos = [gf]; c.S.revDocs = { [rv.id]: rv, 1: v10 };
  // o índice chega (sincronização, «Carregar tese» ou o arquivo escolhido)
  c.S.indice = { aaaa1111: { linha: 'nucleo' }, ffff0000: { linha: 'fallback' } }; c.S.linha = c.linhaAberta();
  assert.equal(c.S.linha, 'fallback'); assert.equal(c.linhaConhecida(), true);
  assert.deepEqual(c.commentsOf('p1-2').map(x => x.id), ['c1'], 'o comentário da janela aparece no fallback, e o da v10 não');
  assert.deepEqual(c.grifosOfPage(1).map(x => x.id), ['g1']);
  c.rebuildRev(); assert.deepEqual(Object.keys(c.S.revisadas), ['1'], 'a página revisada da janela vale no fallback');
  // aberta a v10, nada da janela aparece e a revisada de número da v10 continua dela
  c.S.tiragem = 'aaaa1111'; c.S.tiragemInfo = { tiragem: 'aaaa1111', linha: null }; c.S.linha = c.linhaAberta();
  assert.equal(c.S.linha, 'nucleo');
  assert.deepEqual(c.commentsOf('p1-2').map(x => x.id), ['cv10']);
  assert.deepEqual(c.grifosOfPage(1).map(x => x.id), []);
  c.rebuildRev(); assert.equal(c.S.revisadas['1'], T0); assert.equal(c.S.revDocs['1'].tiragem, 'aaaa1111');
  // linha conhecida pelo manifest guardado (sem o índice): id de número no núcleo, como sempre
  const m = ambiente({ indice: {}, linha: 'nucleo' }); m.S.tiragemInfo = { tiragem: 'ffff0000', linha: 'nucleo' };
  assert.equal(m.linhaConhecida(), true); assert.equal(m.revId(4), '4');
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

test('seletor de versões em ⚙: as tiragens do índice agrupadas por linha (a aberta primeiro, a mais nova primeiro), a aberta marcada; «Abrir» preenche o campo e carrega', async () => {
  const indiceLista = [{ tiragem: 'aaaa1111', linha: 'nucleo', nome: 'Núcleo v9', paginas: 120 }, { tiragem: 'ffff0000', linha: 'fallback', nome: 'Fallback abril', paginas: 96 },
    { tiragem: 'bbbb2222', linha: 'nucleo', nome: 'Núcleo v10', paginas: 130 }];
  const c = ambiente({ indiceLista });
  c.renderVersoes();
  const box = c.$('cfgVersoesLista'), linhas = box.children.map(x => x.className === 'vgrupo' ? '# ' + x.textContent : x.dataset.tiragem + (/aberta/.test(x.className) ? ' (aberta)' : ''));
  assert.equal(c.$('cfgVersoes').hidden, false);
  assert.deepEqual(linhas, ['# Fallback', 'ffff0000 (aberta)', '# Núcleo', 'bbbb2222', 'aaaa1111']);
  const aberta = box.children[1], v10 = box.children[3];
  assert.deepEqual(aberta.children.map(x => x.tagName + ':' + x.textContent), ['DIV:Fallback abriltiragem ffff0000, 96 páginas', 'SPAN:aberta']);
  const btn = v10.children.find(x => x.tagName === 'BUTTON');
  assert.equal(btn.textContent, 'Abrir'); assert.equal(btn.dataset.abrir, 'bbbb2222');
  btn.on.click(); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual([c.salvos, c.baixadas], [['bbbb2222'], ['bbbb2222']]);
  // aberta a do núcleo, o grupo dele vem primeiro; sem índice, a seção fica oculta
  c.S.linha = 'nucleo'; c.S.tiragem = 'bbbb2222'; c.renderVersoes();
  assert.deepEqual(box.children.map(x => x.className === 'vgrupo' ? '# ' + x.textContent : x.dataset.tiragem + (/aberta/.test(x.className) ? ' (aberta)' : '')), ['# Núcleo', 'bbbb2222 (aberta)', 'aaaa1111', '# Fallback', 'ffff0000']);
  c.S.indiceLista = []; c.renderVersoes();
  assert.equal(c.$('cfgVersoes').hidden, true); assert.equal(box.children.length, 0);
});

test('Copiar lote: as decididas da tiragem aberta com id, estado, prioridade e o texto final das modificadas; as sem decisão só contadas', () => {
  const c = ambiente({ props: [prop('a', 1, 'p1-1', { estado: 'aceita', prioridade: 'A' }), prop('b', 2, 'p2-1', { estado: 'modificada', texto_final: 'Linha 1\nLinha 2', prioridade: 'B' }), prop('c', 3, 'p3-1')] });
  const linhas = c.batchText().split('\n');
  const i = linhas.indexOf('PROPOSTAS DE MODIFICAÇÃO: 3, 2 decididas, 1 sem decisão.');
  assert.ok(i > 0);
  assert.deepEqual(linhas.slice(i + 1, i + 5), ['- p. 1, trecho p1-1, a [aceita, A]: m', '- p. 2, trecho p2-1, b [modificada, B]: m', '   Texto final: Linha 1', '   Linha 2']);
});
