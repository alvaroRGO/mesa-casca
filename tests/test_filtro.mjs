// Teste do filtro de comentários (sem rede e sem navegador): node --test tests/test_filtro.mjs
// Roda o código real do index.html (o predicado cmMostra, os seletores, a lista de trechos, os pontos do PDF, o mapa de
// páginas, a gaveta, o lote, o store, o salvar do compositor, applyRespostas e o arranque) num DOM mínimo de mentira,
// com comentários e trechos sintéticos: nada da tese entra aqui.
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
const FUNCOES = ['lsGet', 'lsSet', 'clamp', 'newId', 'nowIso', 'fmtTime', 'tipoLabel', 'errMsg', 'pageSegs', 'segOf', 'segBox', 'pct', 'kindOf', 'isCrop', 'segText',
  'cmMostra', 'commentsOf', 'commentsOfGrifo', 'grifosOfPage', 'pageMark', 'reviewedCount', 'findById', 'arrOf', 'sortComments', 'localSnapshot', 'applyRespostas',
  'renderOverlay', 'renderSegs', 'mkBtn', 'commentNode', 'setActive', 'renderAll', 'renderPages', 'baseDoc', 'salvarComposer',
  'renderDrawer', 'gavetaVazia', 'closeDrawer', 'lerFiltro', 'setFiltro', 'renderFiltro', 'batchText', 'boot',
  // linha de versão e propostas de modificação (sem propostas e sem índice aqui: tudo é do núcleo, como antes)
  'linhaDe', 'linhaReg', 'daLinha', 'linhaAberta', 'nomeLinha', 'aplicaIndice', 'propsDaTiragem', 'decidida', 'posProp', 'cmpProp', 'propostasDoTrecho', 'renderPropCount'];
const FONTE = [js.match(/var KIND = \{[^}]*\};/)[0], js.match(/var FILTROS = \{[^}]*\};/)[0], fonteVar('store'), ...FUNCOES.map(fonteFuncao)].join('\n');

// ---------- DOM de mentira ----------
class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.on = {}; this.className = ''; this._text = ''; this._html = '';
    this.dataset = {}; this.style = {}; this.hidden = false; this.parentNode = null; this.id = ''; this.scrollTop = 0; this.checked = false; this.value = ''; this.disabled = false; this.title = '';
  }
  appendChild(c) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.push(c); return c; }
  remove() { const p = this.parentNode; if (p) { p.children = p.children.filter(x => x !== this); this.parentNode = null; } }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  click() { (this.on.click || []).forEach(f => f({ type: 'click', target: this, stopPropagation() { } })); }
  set innerHTML(v) { this._html = String(v); this.children.forEach(c => { c.parentNode = null; }); this.children = []; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); this.children.forEach(c => { c.parentNode = null; }); this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  get firstChild() { return this.children[0] || (this._primeiro ||= new El('span')); }
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; }
  scrollTo() { }
  querySelectorAll(sel) { const cls = sel.split(',').map(s => s.trim().replace(/^\./, '')); return todos(this).filter(e => cls.some(c => e.className.split(' ').includes(c))); }
}
const todos = (el, out = []) => { el.children.forEach(c => { out.push(c); todos(c, out); }); return out; };
const temClasse = (e, c) => e.className.split(' ').includes(c);

// ---------- dados sintéticos ----------
// p. 1: trechos A e B, um grifo livre (g1); p. 2: trecho C; p. 3: sem trechos; p. 5: trecho X; p. 6: nada
const T = (id) => ({ id, kind: 'text', bbox: [50, 100, 500, 140], text: 'Synthetic paragraph ' + id + '.' });
const PAGINAS = [
  { label: '1', w: 600, h: 800, segs: [T('p1-a'), T('p1-b')] },
  { label: '2', w: 600, h: 800, segs: [T('p2-c')] },
  { label: '3', w: 600, h: 800, segs: [] },
  { label: '4', w: 600, h: 800, segs: [T('p4-d')] },
  { label: '5', w: 600, h: 800, segs: [T('p5-x')] },
  { label: '6', w: 600, h: 800, segs: [T('p6-y')] },
];
const R = 'Aplicado na tiragem 0000aaaa: resposta sintética.';
const em = n => '2026-10-01T10:' + String(n).padStart(2, '0') + ':00.000Z';
function comentarios() {
  return [
    { id: 'c1', pagina: 1, trecho: 'p1-a', grifo: null, tipo: 'correcao', texto: 'sem resposta em A', criado_em: em(1), estado: 'aberto', sync: 'enviado' },
    { id: 'c2', pagina: 1, trecho: 'p1-a', grifo: null, tipo: 'correcao', texto: 'respondido em A', criado_em: em(2), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(30) },
    { id: 'c3', pagina: 1, trecho: 'p1-b', grifo: null, tipo: 'duvida', texto: 'respondido em B', criado_em: em(3), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(31) },
    { id: 'c4', pagina: 1, trecho: 'p1-zz', grifo: null, tipo: 'correcao', texto: 'respondido, trecho ausente na tiragem', criado_em: em(4), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(32) },
    { id: 'c5', pagina: 1, trecho: null, grifo: null, tipo: 'pagina', texto: 'respondido da página', criado_em: em(5), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(33) },
    { id: 'c6', pagina: 1, trecho: null, grifo: 'g1', tipo: 'correcao', texto: 'sem resposta no grifo livre', criado_em: em(0), estado: 'aberto', sync: 'enviado' },
    { id: 'c7', pagina: 2, trecho: 'p2-c', grifo: null, tipo: 'correcao', texto: 'respondido em C', criado_em: em(7), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(34) },
    { id: 'c8', pagina: 3, trecho: null, grifo: null, tipo: 'pagina', texto: 'respondido da página sem trechos', criado_em: em(8), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(35) },
    { id: 'c9', pagina: 5, trecho: 'p5-x', grifo: null, tipo: 'correcao', texto: 'sem resposta em X', criado_em: em(9), estado: 'aberto', sync: 'enviado' },
    { id: 'c10', pagina: 5, trecho: 'p5-x', grifo: null, tipo: 'correcao', texto: 'respondido em X', criado_em: em(10), estado: 'aberto', sync: 'enviado', resposta: R, respondido_em: em(36) },
  ];
}
const TOTAL_C = 10, SEM_C = 3, RESP_C = 7; // c1, c6, c9 sem resposta
const GRIFOS = [{ id: 'g1', pagina: 1, x: 0.1, y: 0.5, w: 0.3, h: 0.05, trecho: null, criado_em: em(0), sync: 'enviado' }, { id: 'g4', pagina: 4, x: 0.1, y: 0.2, w: 0.3, h: 0.05, trecho: null, criado_em: em(0), sync: 'enviado' }];

function ambiente({ filtro = 'todos', page = 1, ls = {}, comments = comentarios() } = {}) {
  const ids = {}; const criados = [];
  const $ = id => ids[id] || criados.findLast(e => e.id === id) || (ids[id] = Object.assign(new El(id === 'sheet' ? 'div' : 'div'), { id }));
  const document = {
    body: new El('body'), createElement: tag => { const e = new El(tag); criados.push(e); return e; }, getElementById: $,
    createTextNode: t => Object.assign(new El('#text'), { textContent: t }),
    querySelector: sel => { assert.equal(sel, '.hl.active'); return todos($('sheet')).find(e => temClasse(e, 'hl') && temClasse(e, 'active')) || null; },
  };
  const armazenado = { ...ls };
  const localStorage = { getItem: k => (k in armazenado ? armazenado[k] : null), setItem: (k, v) => { armazenado[k] = String(v); }, removeItem: k => { delete armazenado[k]; } };
  const S = { page, pages: PAGINAS, active: null, comments, grifos: GRIFOS.slice(), revisadas: {}, revDocs: {}, tombs: { comentarios: {}, grifos: {}, revisadas: {} }, progDoc: null,
    tiragem: '0000aaaa', tiragemInfo: null, pdfPageW: 600, pdfPageH: 800, filtro, compose: null, cfg: { token: '', repo: 'x/y', tiragem: '' }, syncSt: { estado: 'nunca', em: null, erro: '', running: false } };
  const ctx = {
    document, S, $, criados, armazenado, localStorage, TOTAL: PAGINAS.length, toasts: [], chamadas: { renderAll: 0, subscribe: [] },
    window: { matchMedia: () => ({ matches: false }), indexedDB: {} }, navigator: {}, location: { protocol: 'http:', hostname: 'teste' },
    drawInk: () => { }, renderProgress: () => { }, renderReviewedBtn: () => { }, drawCrops: () => { }, cropCanvas: () => new El('canvas'), updateStep: () => { }, centerInList: () => { },
    // rolagem contínua: a folha da página corrente é o #sheet de mentira; renderAll redesenha as folhas montadas (aqui, ela)
    folhaViva: () => $('sheet'), renderFolhas: () => { ctx.renderOverlay(); }, scrollToSeg: () => { },
    mkTradBtn: fn => { const b = new El('button'); b.setAttribute('title', 'Traduzir'); b.addEventListener('click', fn); return b; },
    traduzir: () => { }, speak: () => { }, openComposer: () => { }, saveBlock: () => { }, openGrifoPop: () => { }, setPage: () => { }, syncUi: () => { }, closeComposer: () => { },
    storeFail: e => { throw e; }, banner: () => { }, loadVoices: () => { }, askPersist: () => { }, migrateLocalStorage: () => Promise.resolve(), applyTese: () => { }, openCfg: () => { }, syncNow: () => { }, syncAbertura: () => { },
    idb: { put: () => Promise.resolve(), batch: () => Promise.resolve(), open: () => Promise.resolve(), get: () => Promise.resolve(null) },
  };
  ctx.toast = m => ctx.toasts.push(m);
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  ctx.sortComments(); // como no store.subscribe: por página e criado_em
  const renderAll = ctx.renderAll; ctx.renderAll = () => { ctx.chamadas.renderAll++; return renderAll(); };
  ctx.store.subscribe = () => { ctx.chamadas.subscribe.push(ctx.S.filtro); return Promise.resolve(); };
  for (const id of ['drawer', 'pagesDrawer']) $(id).hidden = true;
  return ctx;
}
const ids = a => Array.from(a, c => c.id);
const cartoesCm = root => todos(root).filter(e => e.className === 'cm');
const ocultosBtn = ctx => ctx.$('segs').children.find(e => e.id === 'segOcultos') || null;
const marcas = ctx => Object.fromEntries(ctx.$('sheet').children.map(e => [e.title ? e.title.replace(/^Synthetic paragraph (\S+)\.$/, '$1') : 'grifo:' + e.style.left, e.className]));
const esperar = () => new Promise(r => setImmediate(r));

test('predicado único cmMostra nos três filtros («respondido» = tem resposta; resposta vazia conta como sem resposta)', () => {
  const ctx = ambiente();
  const casos = [{ resposta: R }, {}, { resposta: '' }, { resposta: null }];
  const ver = f => { ctx.S.filtro = f; return casos.map(c => ctx.cmMostra(c)); };
  assert.deepEqual(ver('todos'), [true, true, true, true]);
  assert.deepEqual(ver('sem_resposta'), [false, true, true, true]);
  assert.deepEqual(ver('respondidos'), [true, false, false, false]);
  assert.deepEqual(ver('xyz'), [true, true, true, true], 'valor estranho em memória não esconde nada');
  assert.deepEqual(Object.keys(ctx.FILTROS), ['todos', 'sem_resposta', 'respondidos']);
});

test('commentsOf e commentsOfGrifo seguem o filtro; com todos = true o ignoram; em «Todos» o conjunto e a ordem de hoje', () => {
  const ctx = ambiente();
  const antigo = ctx.S.comments.filter(c => c.pagina === 1 && !c.trecho && !c.grifo).concat(ctx.S.comments.filter(c => c.pagina === 1 && c.grifo && !c.trecho));
  assert.deepEqual(ids(ctx.commentsOf(null)), ids(antigo), 'mesmos comentários e mesma ordem: primeiro os da página, depois os de grifo livre');
  assert.deepEqual(ids(ctx.commentsOf(null)), ['c5', 'c6']);
  assert.deepEqual(ids(ctx.commentsOf('p1-a')), ['c1', 'c2']);
  assert.deepEqual(ids(ctx.commentsOfGrifo('g1')), ['c6']);
  ctx.S.filtro = 'sem_resposta';
  assert.deepEqual(ids(ctx.commentsOf(null)), ['c6']);
  assert.deepEqual(ids(ctx.commentsOf('p1-a')), ['c1']);
  assert.deepEqual(ids(ctx.commentsOf('p1-b')), []);
  assert.deepEqual(ids(ctx.commentsOf('p1-b', true)), ['c3'], 'todos = true ignora o filtro');
  assert.deepEqual(ids(ctx.commentsOfGrifo('g1')), ['c6']);
  ctx.S.filtro = 'respondidos';
  assert.deepEqual(ids(ctx.commentsOf(null)), ['c5']);
  assert.deepEqual(ids(ctx.commentsOf('p1-a')), ['c2']);
  assert.deepEqual(ids(ctx.commentsOf(null, true)), ['c5', 'c6']);
  assert.deepEqual(ids(ctx.commentsOfGrifo('g1')), []);
});

test('mapa de páginas: ponto azul com grifo ou comentário visível; anel cinza (done) para página só com respondidos, olhando também os ocultos', () => {
  const ctx = ambiente();
  const mapa = f => { ctx.S.filtro = f; return [1, 2, 3, 4, 5, 6].map(p => ctx.pageMark(p)); };
  //                       p1 (grifo)  p2 (só resp.)  p3 (só resp.)  p4 (grifo) p5 (misto)  p6
  assert.deepEqual(mapa('todos'), [' has', ' has done', ' has done', ' has', ' has', '']);
  assert.deepEqual(mapa('sem_resposta'), [' has', '', '', ' has', ' has', '']);
  assert.deepEqual(mapa('respondidos'), [' has', ' has done', ' has done', ' has', ' has', ''], 'p. 5 tem um sem resposta oculto: ponto azul, não anel');
  ctx.S.filtro = 'todos'; ctx.$('pagesDrawer').hidden = false; ctx.renderAll();
  const pgs = ctx.$('pgrid').children;
  assert.equal(pgs.length, 6);
  assert.deepEqual(pgs.map(b => b.className), ['pg cur has', 'pg has done', 'pg has done', 'pg has', 'pg has', 'pg']);
  // a marca de respondidos é um anel cinza, nunca um ponto verde sobre o verde da página revisada
  for (const sel of ['.hl.has.done::after', '.pg.has.done::after']) {
    const regra = html.match(new RegExp(sel.replace(/\./g, '\\.').replace(/:/g, ':') + ' \\{([^}]*)\\}'));
    assert.ok(regra, 'regra CSS ' + sel);
    assert.match(regra[1], /background: transparent/);
    assert.match(regra[1], /border: 2px solid var\(--muted\)/);
    assert.doesNotMatch(regra[1], /--ok/);
  }
});

test('pontos sobre o PDF seguem o filtro; o anel de respondido olha todos os comentários do trecho, não só os visíveis', () => {
  const ctx = ambiente();
  const ver = f => { ctx.S.filtro = f; ctx.renderOverlay(); return marcas(ctx); };
  const t = ver('todos');
  assert.equal(t['p1-a'], 'hl has', 'A tem um sem resposta: ponto azul');
  assert.equal(t['p1-b'], 'hl has done', 'B só com respondidos: anel');
  assert.equal(t['grifo:10.000%'], 'gf has');
  const s = ver('sem_resposta');
  assert.equal(s['p1-a'], 'hl has');
  assert.equal(s['p1-b'], 'hl', 'B some do PDF em «Sem resposta»');
  assert.equal(s['grifo:10.000%'], 'gf has');
  const r = ver('respondidos');
  assert.equal(r['p1-a'], 'hl has', 'A mostra o respondido, mas o sem resposta oculto mantém o ponto azul');
  assert.equal(r['p1-b'], 'hl has done');
  assert.equal(r['grifo:10.000%'], 'gf', 'o comentário do grifo, sem resposta, fica oculto');
});

test('lista de trechos: filtro aplicado e «Mostrar N» conta só o que a lista desenharia (trecho ausente na tiragem fica de fora)', () => {
  const ctx = ambiente();
  ctx.renderSegs();
  assert.equal(cartoesCm(ctx.$('segs')).length, 5, 'Todos: c5 e c6 na caixa da página, c1 e c2 em A, c3 em B; c4 (trecho ausente) não aparece');
  assert.equal(ocultosBtn(ctx), null, 'em «Todos», nada oculto');
  ctx.S.filtro = 'sem_resposta'; ctx.renderSegs();
  assert.deepEqual(cartoesCm(ctx.$('segs')).map(c => c.children[1].textContent), ['sem resposta no grifo livre', 'sem resposta em A']);
  const b1 = ocultosBtn(ctx);
  assert.ok(b1, 'botão no fim de #segs');
  assert.equal(ctx.$('segs').children.at(-1), b1, 'último item da lista');
  assert.equal(b1.textContent, 'Mostrar 3 respondidos', 'c2, c3 e c5; c4 tem trecho ausente e não conta (a página tem 4 respondidos)');
  assert.equal(b1.className, 'btn small ocultos');
  ctx.S.filtro = 'respondidos'; ctx.renderSegs();
  assert.equal(cartoesCm(ctx.$('segs')).length, 3);
  assert.equal(ocultosBtn(ctx).textContent, 'Mostrar 2 sem resposta');
  // singular e plural
  ctx.S.page = 2; ctx.S.filtro = 'sem_resposta'; ctx.renderSegs();
  assert.equal(ocultosBtn(ctx).textContent, 'Mostrar 1 respondido');
  ctx.S.page = 5; ctx.S.filtro = 'respondidos'; ctx.renderSegs();
  assert.equal(ocultosBtn(ctx).textContent, 'Mostrar 1 sem resposta');
  // página sem trechos: a mensagem substitui a lista inteira, então não promete nada
  ctx.S.page = 3; ctx.S.filtro = 'sem_resposta'; ctx.renderSegs();
  assert.equal(ocultosBtn(ctx), null);
  // tocar em «Mostrar N» volta a «Todos», guarda a escolha e redesenha tudo
  ctx.S.page = 1; ctx.S.filtro = 'sem_resposta'; ctx.renderSegs();
  const antes = ctx.chamadas.renderAll;
  ocultosBtn(ctx).click();
  assert.equal(ctx.S.filtro, 'todos');
  assert.equal(ctx.armazenado['mesa.filtro'], '"todos"');
  assert.equal(ctx.chamadas.renderAll, antes + 1);
  assert.equal(cartoesCm(ctx.$('segs')).length, 5);
  assert.equal(ocultosBtn(ctx), null);
});

test('a resposta continua aberta (sem recolher, sem cinza) depois de setActive e de renderAll, em qualquer filtro', () => {
  for (const f of ['todos', 'respondidos']) {
    const ctx = ambiente({ filtro: f });
    const resp = () => cartoesCm(ctx.$('segs')).filter(c => c.children.some(x => x.className === 'resp')).map(c => c.children.find(x => x.className === 'resp'));
    ctx.renderSegs();
    const r0 = resp();
    assert.ok(r0.length >= 2, f + ': cartões com resposta');
    ctx.setActive('p1-a', false);
    const r1 = resp();
    assert.equal(r1.length, r0.length, f + ': depois de setActive');
    ctx.renderAll();
    const r2 = resp();
    assert.equal(r2.length, r0.length, f + ': depois de renderAll');
    for (const r of r2) {
      assert.equal(r.tagName, 'DIV', 'bloco de resposta continua um div, não <details>');
      assert.ok(r.textContent.includes('Resposta da Claude') || r.innerHTML.includes('Resposta da Claude'));
      assert.ok(r.textContent.includes(R), 'texto da resposta visível');
    }
    assert.equal(ctx.criados.filter(e => e.tagName === 'DETAILS' || e.tagName === 'SUMMARY').length, 0, 'nada recolhível');
  }
  assert.doesNotMatch(fonteFuncao('commentNode'), /details|done|muted/, 'o cartão não muda');
  assert.equal((html.match(/<details/g) || []).length, 1, 'só a ajuda «Como usar» é recolhível');
});

test('gaveta: três botões com os totais de todos os comentários (sem o «só esta página»), botão ativo marcado; #cmCount conta o que o filtro mostra', () => {
  const ctx = ambiente();
  const botoes = () => ['todos', 'sem_resposta', 'respondidos'].map(f => { const b = ctx.$('filtro-' + f); return [b.textContent, b.className, b.getAttribute('aria-pressed')]; });
  ctx.renderAll();
  assert.deepEqual(botoes(), [['Todos (10)', 'btn small on', 'true'], ['Sem resposta (3)', 'btn small', 'false'], ['Respondidos (7)', 'btn small', 'false']]);
  assert.equal(ctx.$('cmCount').textContent, String(TOTAL_C));
  ctx.$('onlyPage').checked = true;
  ctx.setFiltro('sem_resposta');
  assert.deepEqual(botoes(), [['Todos (10)', 'btn small', 'false'], ['Sem resposta (3)', 'btn small on', 'true'], ['Respondidos (7)', 'btn small', 'false']], '«só esta página» não muda os totais');
  assert.equal(ctx.$('cmCount').textContent, String(SEM_C));
  ctx.setFiltro('respondidos');
  assert.equal(ctx.$('cmCount').textContent, String(RESP_C));
  assert.equal(ctx.$('filtro-respondidos').className, 'btn small on');
  assert.ok(!/title/.test(fonteFuncao('renderFiltro')), 'os totais vão em texto, não em title');
});

test('gaveta: o filtro compõe com «só esta página»; gaveta vazia diz quantos estão do outro lado', () => {
  const ctx = ambiente();
  const lista = () => ctx.$('drawerList');
  const textos = () => cartoesCm(lista()).map(c => c.children[1].textContent);
  ctx.$('drawer').hidden = false;
  ctx.setFiltro('todos');
  assert.equal(cartoesCm(lista()).length, TOTAL_C);
  ctx.setFiltro('sem_resposta');
  assert.equal(cartoesCm(lista()).length, SEM_C);
  ctx.$('onlyPage').checked = true; ctx.renderDrawer();
  assert.deepEqual(textos(), ['sem resposta no grifo livre', 'sem resposta em A'], 'p. 1 e sem resposta');
  ctx.setFiltro('respondidos');
  assert.equal(cartoesCm(lista()).length, 4, 'p. 1 e respondidos: c2, c3, c4 e c5 (a gaveta lista também o de trecho ausente)');
  const vazia = () => lista().children.map(e => e.className + ': ' + e.textContent);
  ctx.S.page = 2; ctx.setFiltro('sem_resposta');
  assert.deepEqual(vazia(), ['hint: Nenhum comentário sem resposta nesta página. 1 respondido está em «Respondidos».']);
  ctx.S.page = 1; ctx.S.comments = ctx.S.comments.filter(c => c.resposta); ctx.renderDrawer();
  assert.deepEqual(vazia(), ['hint: Nenhum comentário sem resposta nesta página. 4 respondidos estão em «Respondidos».']);
  ctx.S.page = 6; ctx.setFiltro('respondidos');
  assert.deepEqual(vazia(), ['hint: Nenhum comentário respondido nesta página.']);
  ctx.$('onlyPage').checked = false; ctx.S.comments = comentarios().filter(c => !c.resposta); ctx.renderDrawer();
  assert.deepEqual(vazia(), ['hint: Nenhum comentário respondido. 3 sem resposta estão em «Sem resposta».']);
  ctx.S.comments = comentarios().filter(c => c.id === 'c1'); ctx.renderDrawer();
  assert.deepEqual(vazia(), ['hint: Nenhum comentário respondido. 1 sem resposta está em «Sem resposta».']);
  ctx.S.comments = []; ctx.setFiltro('todos');
  assert.deepEqual(vazia(), ['hint: Nenhum comentário.']);
});

test('mesa.filtro: lido e validado; qualquer outro valor (ou leitura que falha) vira «todos»; setFiltro grava', () => {
  const ler = v => ambiente({ ls: v === undefined ? {} : { 'mesa.filtro': v } }).lerFiltro();
  assert.equal(ler(undefined), 'todos');
  assert.equal(ler('"todos"'), 'todos');
  assert.equal(ler('"sem_resposta"'), 'sem_resposta');
  assert.equal(ler('"respondidos"'), 'respondidos');
  for (const ruim of ['"xyz"', '"constructor"', '"__proto__"', '"toString"', '"hasOwnProperty"', '"sem-resposta"', '"respondido"', '"Respondidos"', '42', 'null', 'true', '{"a":1}', '["todos"]', 'não é JSON', ''])
    assert.equal(ler(ruim), 'todos', 'valor ' + ruim);
  const ctx = ambiente();
  ctx.localStorage.getItem = () => { throw new Error('bloqueado'); };
  assert.equal(ctx.lerFiltro(), 'todos', 'localStorage bloqueado');
  const c2 = ambiente();
  c2.setFiltro('respondidos');
  assert.equal(c2.armazenado['mesa.filtro'], '"respondidos"');
  assert.equal(c2.lerFiltro(), 'respondidos', 'a escolha volta ao abrir de novo');
  c2.setFiltro('constructor');
  assert.equal(c2.S.filtro, 'todos');
  assert.equal(c2.armazenado['mesa.filtro'], '"todos"');
});

test('arranque: o filtro guardado é lido antes de store.subscribe (o primeiro desenho já sai filtrado)', async () => {
  for (const [guardado, esperado] of [['"sem_resposta"', 'sem_resposta'], ['"respondidos"', 'respondidos'], ['"constructor"', 'todos'], [undefined, 'todos']]) {
    const ctx = ambiente({ ls: guardado === undefined ? {} : { 'mesa.filtro': guardado } });
    ctx.S.filtro = 'xyz'; // nada antes do arranque decide o filtro
    ctx.boot();
    for (let i = 0; i < 6; i++) await esperar();
    assert.deepEqual([...ctx.chamadas.subscribe], [esperado], 'guardado ' + guardado);
  }
  const fb = fonteFuncao('boot');
  assert.ok(fb.indexOf('S.filtro = lerFiltro()') >= 0 && fb.indexOf('S.filtro = lerFiltro()') < fb.indexOf('store.subscribe()'));
});

test('Copiar lote leva tudo em qualquer filtro, inclusive o comentário pendente que só está na memória; estado.json e diagnóstico também', () => {
  const lotes = {};
  for (const f of ['todos', 'sem_resposta', 'respondidos']) {
    const ctx = ambiente({ filtro: f });
    ctx.S.comments.push({ id: 'cp', pagina: 4, trecho: 'p4-d', grifo: null, tipo: 'correcao', texto: 'pendente, ainda não gravado', criado_em: em(50), estado: 'aberto', sync: 'pendente' });
    ctx.S.comments.push({ id: 'cr', pagina: 4, trecho: 'p4-d', grifo: null, tipo: 'correcao', texto: 'pendente e respondido', criado_em: em(51), estado: 'aberto', sync: 'pendente', resposta: R });
    const t = ctx.batchText();
    assert.match(t, new RegExp('Comentários: ' + (TOTAL_C + 2) + '\\. Grifos sem comentário: 1\\.'), f);
    assert.ok(t.includes('pendente, ainda não gravado') && t.includes('pendente e respondido'), f + ': pendentes no lote');
    for (const c of comentarios()) assert.ok(t.includes(c.texto), f + ': ' + c.id + ' no lote');
    lotes[f] = t.split('\n').slice(1).join('\n');
    const snap = ctx.localSnapshot();
    assert.equal(snap.comentarios.length, TOTAL_C + 2, f + ': estado.json completo');
  }
  assert.equal(lotes.sem_resposta, lotes.todos);
  assert.equal(lotes.respondidos, lotes.todos);
  for (const nome of ['batchText', 'localSnapshot', 'exportEstado']) assert.doesNotMatch(fonteFuncao(nome), /cmMostra|filtro/, nome + ' não usa o filtro');
  assert.match(js, /diagnostico: function \(\) \{ return \{[^}]*comentarios: S\.comments\.length,/, 'diagnóstico conta todos');
  // a ajuda continua verdadeira e nenhuma frase a contradiz; a rota de resgate do armazenamento cheio continua valendo
  const lis = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
  assert.ok(lis.some(l => l.includes('<b>Copiar lote</b> copia tudo em texto')));
  assert.ok(lis.some(l => l.includes('O filtro não muda o que <b>Copiar lote</b> e <b>Exportar estado.json</b> levam')));
  assert.ok(!lis.some(l => /Copiar lote<\/b>[^.]*(só|segue|filtr)/.test(l)), 'nenhum item diz que o lote segue o filtro');
  assert.match(fonteFuncao('errMsg'), /Use «Exportar estado\.json» ou «Copiar lote»/);
});

test('o filtro continua depois de store.add; salvar com «Respondidos» avisa «Salvo na p. N; está em «Sem resposta»» e não troca nada', async () => {
  const ctx = ambiente({ filtro: 'respondidos', ls: { 'mesa.filtro': '"respondidos"' } });
  ctx.renderAll();
  assert.equal(ocultosBtn(ctx).textContent, 'Mostrar 2 sem resposta');
  ctx.S.compose = { mode: 'comment', segId: 'p1-b', seg: PAGINAS[0].segs[1], grifoId: null };
  ctx.$('compText').value = 'comentário novo'; ctx.$('compType').value = 'correcao';
  ctx.salvarComposer();
  await esperar(); await esperar();
  assert.deepEqual([...ctx.toasts], ['Salvo na p. 1; está em «Sem resposta»']);
  assert.equal(ctx.S.filtro, 'respondidos', 'o filtro não muda sozinho');
  assert.equal(ctx.armazenado['mesa.filtro'], '"respondidos"');
  const novo = ctx.S.comments.find(c => c.texto === 'comentário novo');
  assert.ok(novo && novo.sync === 'pendente' && novo.pagina === 1 && novo.trecho === 'p1-b', 'salvo normalmente');
  assert.ok(!cartoesCm(ctx.$('segs')).some(c => c.children[1].textContent === 'comentário novo'), 'oculto em «Respondidos»');
  assert.equal(ocultosBtn(ctx).textContent, 'Mostrar 3 sem resposta', '«Mostrar N» já conta o novo');
  assert.equal(ctx.$('filtro-sem_resposta').textContent, 'Sem resposta (4)');
  // nos outros filtros, o aviso de sempre
  for (const f of ['todos', 'sem_resposta']) {
    const c = ambiente({ filtro: f });
    c.S.compose = { mode: 'page', segId: null, seg: null, grifoId: null };
    c.$('compText').value = 'outro'; c.salvarComposer();
    await esperar(); await esperar();
    assert.deepEqual([...c.toasts], ['Salvo na p. 1'], f);
    assert.equal(c.S.filtro, f);
  }
  assert.match(js, /\$\('btnCompSave'\)\.addEventListener\('click', salvarComposer\);/);
});

test('respostas que chegam com «Sem resposta» ativo avisam «N respostas novas; veja em «Respondidos»» (e o singular)', async () => {
  const aviso = async (f, novas) => {
    const ctx = ambiente({ filtro: f });
    const obj = {}; for (const id of novas) obj[id] = { resposta: 'Aplicado: nova ' + id, respondido_em: em(59) };
    obj.c2 = { resposta: R, respondido_em: em(30) }; // igual à que já existe: não conta
    obj.inexistente = { resposta: 'x' };
    await ctx.applyRespostas(obj);
    return { toasts: [...ctx.toasts], filtro: ctx.S.filtro, n: ctx.chamadas.renderAll };
  };
  assert.deepEqual(await aviso('sem_resposta', ['c1', 'c6', 'c9']), { toasts: ['3 respostas novas; veja em «Respondidos»'], filtro: 'sem_resposta', n: 1 });
  assert.deepEqual(await aviso('sem_resposta', ['c1']), { toasts: ['1 resposta nova; veja em «Respondidos»'], filtro: 'sem_resposta', n: 1 });
  assert.deepEqual(await aviso('todos', ['c1', 'c6']), { toasts: ['2 respostas novas'], filtro: 'todos', n: 1 });
  assert.deepEqual(await aviso('respondidos', ['c1']), { toasts: ['1 resposta nova'], filtro: 'respondidos', n: 1 });
  assert.deepEqual(await aviso('sem_resposta', []), { toasts: [], filtro: 'sem_resposta', n: 0 });
});

test('invariante: nenhuma exibição escapa do predicado (a lista e o PDF só leem comentários por commentsOf e commentsOfGrifo)', () => {
  for (const nome of ['renderSegs', 'renderOverlay']) assert.doesNotMatch(fonteFuncao(nome), /S\.comments/, nome);
  for (const nome of ['commentsOf', 'commentsOfGrifo', 'pageMark', 'renderDrawer', 'renderFiltro']) assert.match(fonteFuncao(nome), /cmMostra/, nome);
  assert.match(fonteFuncao('renderAll'), /renderFiltro\(\)/);
  assert.doesNotMatch(fonteFuncao('renderAll'), /S\.comments\.length/);
  assert.match(fonteFuncao('setFiltro'), /lsSet\('mesa\.filtro'/);
  assert.match(fonteFuncao('setFiltro'), /renderAll\(\)/);
  assert.match(js, /Object\.keys\(FILTROS\)\.forEach\(function \(f\) \{ \$\('filtro-' \+ f\)\.addEventListener\('click', function \(\) \{ setFiltro\(f\); \}\); \}\);/);
  assert.match(html, /<input type="checkbox" id="onlyPage"> só esta página/, '«só esta página» continua');
  for (const [id, rot] of [['filtro-todos', 'Todos'], ['filtro-sem_resposta', 'Sem resposta'], ['filtro-respondidos', 'Respondidos']])
    assert.match(html, new RegExp('<button class="btn small( on)?" type="button" id="' + id + '" aria-pressed="(true|false)">' + rot + ' \\(0\\)</button>'));
});
