// Teste da rolagem contínua do PDF (sem rede e sem navegador): node --test tests/test_rolagem.mjs
// Roda o código real do index.html (o bloco «rolagem continua», cropScale, segBox, openGrifoPop, openComposer, closeComposer, baseDoc
// e, no teste do embalo, tempoDe, soltarEmbalo e pararEmbalo dos gestos)
// num DOM mínimo de mentira, com páginas sintéticas e um pdf.js de mentira: nada da tese entra aqui.
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
function bloco(marca) {
  const i = js.indexOf('  // ---------- ' + marca + ' ----------');
  assert.ok(i >= 0, 'bloco ausente no index.html: ' + marca);
  return js.slice(i, js.indexOf('  // ---------- ', i + 10));
}
const FONTE = [js.match(/var CROP_PX = [^;]*;/)[0], ...['lsGet', 'clamp', 'cropScale', 'pageSegs', 'segOf', 'segBox', 'newId', 'nowIso'].map(fonteFuncao),
  bloco('rolagem continua'), fonteFuncao('openGrifoPop'), fonteFuncao('openComposer'), fonteFuncao('closeComposer'), fonteFuncao('baseDoc')].join('\n');

// ---------- DOM de mentira ----------
class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.style = {}; this.cls = new Set(); this.parentNode = null;
    this.hidden = false; this.textContent = ''; this.value = ''; this.placeholder = '';
    if (tag === 'canvas') { this.width = 300; this.height = 150; }
  }
  get className() { return [...this.cls].join(' '); }
  set className(v) { this.cls = new Set(String(v).split(' ').filter(Boolean)); }
  get classList() { const s = this.cls; return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: (c, on) => { if (on === undefined ? !s.has(c) : on) s.add(c); else s.delete(c); } }; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  appendChild(c) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) { if (c.parentNode) c.remove(); c.parentNode = this; const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; }
  replaceChild(n, o) { const i = this.children.indexOf(o); assert.ok(i >= 0, 'replaceChild de um filho que não está aqui'); if (n.parentNode) n.remove(); this.children[i] = n; n.parentNode = this; o.parentNode = null; return o; }
  remove() { const p = this.parentNode; if (p) { p.children = p.children.filter(x => x !== this); this.parentNode = null; } }
  get nextSibling() { const p = this.parentNode; if (!p) return null; return p.children[p.children.indexOf(this) + 1] || null; }
  get firstChild() { return this.children[0] || null; }
  set innerHTML(v) { this.children.forEach(c => { c.parentNode = null; }); this.children = []; }
  querySelectorAll() { return []; }
  getContext() { return {}; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 600, bottom: 800, width: 600, height: 800 }; }
  focus() { }
}
// o quadro do PDF: rola sem animação; a altura rolável sai das folhas (na página única, só a corrente aparece)
class Quadro extends El {
  constructor(w, h) { super('div'); this.clientWidth = w; this.clientHeight = h; this.scrollTop = 0; this.scrollLeft = 0; this.idas = []; }
  visiveis() { return this.children.filter(c => !this.cls.has('unica') || c.cls.has('cur')); }
  get scrollHeight() { return Math.max(this.clientHeight, this.visiveis().reduce((a, c) => a + parseFloat(c.style.height || 0) + 8, 0)); }
  get scrollWidth() { return Math.max(this.clientWidth, ...this.visiveis().map(c => parseFloat(c.style.width || 0))); }
  scrollTo(o) {
    this.idas.push(o);
    this.scrollTop = Math.max(0, Math.min(o.top, this.scrollHeight - this.clientHeight));
    if (o.left != null) this.scrollLeft = Math.max(0, Math.min(o.left, this.scrollWidth - this.clientWidth));
  }
}
// o quadro como o navegador com densidade 1: a rolagem fica em pixels inteiros, presa entre 0 e o máximo
class QuadroInteiro extends Quadro {
  get scrollTop() { return this._y || 0; }
  set scrollTop(v) { this._y = Math.max(0, Math.min(Math.round(v), this.scrollHeight - this.clientHeight)); }
  get scrollLeft() { return this._x || 0; }
  set scrollLeft(v) { this._x = Math.max(0, Math.min(Math.round(v), this.scrollWidth - this.clientWidth)); }
}
// pdf.js de mentira: cada desenho fica pendente até o teste mandar terminar; passo() simula a fatia seguinte do pdf.js
function pdfFalso() {
  const renders = [], pedidos = [], paginas = {};
  const pagina = n => ({
    n, limpezas: 0, cleanup() { this.limpezas++; return true; },
    getViewport: ({ scale }) => ({ width: 595.3 * scale, height: 841.9 * scale, scale }),
    render: ({ canvasContext }) => {
      const r = { p: n, cancelada: false, onContinue: null };
      r.promise = new Promise((res, rej) => { r.fim = res; r.falha = rej; });
      r.cancel = () => { r.cancelada = true; r.falha(Object.assign(new Error('cancelada'), { name: 'RenderingCancelledException' })); };
      r.passo = () => { const st = { seguiu: false }; r.onContinue(() => { st.seguiu = true; }); return st; };
      renders.push(r); return r;
    },
  });
  return { renders, pedidos, paginas, getPage: n => { pedidos.push(n); return Promise.resolve(paginas[n] ||= pagina(n)); } };
}
const T = (p, k) => ({ id: 'p' + p + '-' + k, kind: 'text', bbox: [60, 100 + 120 * k, 540, 160 + 120 * k], text: 'Synthetic paragraph ' + k + '.' });
function ambiente({ paginas = 20, quadro = [650, 900], dpr = 1, page = 1, cont = true, zoom = 1, ls = {}, Q = Quadro } = {}) {
  const pages = Array.from({ length: paginas }, (_, i) => ({ label: String(i + 1), page: i + 1, w: 595.3, h: 841.9, segs: [T(i + 1, 1), T(i + 1, 2), T(i + 1, 5)] }));
  const ids = { canvaswrap: new Q(quadro[0], quadro[1]) };
  const $ = id => (ids[id] ||= new El(id === 'canvas' ? 'canvas' : 'div'));
  const S = { page, pages, zoom, pdf: null, cont, compose: null, active: null, pdfPageW: 595.3, pdfPageH: 841.9, pageReady: 0, tiragem: 'abcd1234' };
  const relogio = { t: 1000 }, rafs = [], timers = new Map(), atrasos = new Map(); let nt = 0;
  const armazenado = { ...ls };
  const ctx = {
    S, $, TOTAL: paginas, relogio, rafs, timers, atrasos, pop: null, trocas: [], overlays: [], tintas: [], recortes: 0,
    window: { devicePixelRatio: dpr },
    // o aviso de grifo (.pop): o de mentira (ctx.pop) ou um de verdade, aberto por openGrifoPop numa folha do quadro
    document: { createElement: tag => new El(tag), querySelector: sel => ctx.pop || (sel === '#canvaswrap .pop' ? ids.canvaswrap.children.flatMap(f => f.children).find(e => e.cls.has('pop')) || null : null) },
    localStorage: { getItem: k => (k in armazenado ? armazenado[k] : null), setItem: (k, v) => { armazenado[k] = String(v); } },
    performance: { now: () => relogio.t },
    requestAnimationFrame: f => { rafs.push(f); return rafs.length; }, cancelAnimationFrame: () => { },
    setTimeout: (f, ms) => { timers.set(++nt, f); atrasos.set(nt, ms); return nt; }, clearTimeout: id => { timers.delete(id); atrasos.delete(id); },
    hires: { canvas: null }, interrupcoes: 0, interromperHires: () => { ctx.interrupcoes++; },
    renderOverlay: p => ctx.overlays.push(p), drawInk: p => ctx.tintas.push(p), drawCrops: () => { ctx.recortes++; },
    setCurrentPage: (n, via) => { ctx.trocas.push([n, via]); S.page = n; S.active = null; },
    segText: s => s.text, stopSpeak: () => { }, stopDictation: () => { }, dictShow: () => false, dictPreview: () => { }, fitBars: () => { }, showSegInPdf: () => { },
    mkBtn: (txt, cls, fn) => { const b = new El('button'); b.textContent = txt; b.className = cls; b.click = fn; return b; },
    store: { remove: () => Promise.resolve() }, toast: () => { },
  };
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  return ctx;
}
const esperar = () => new Promise(r => setImmediate(r));
// os vetores criados dentro do vm são de outro reino: copiados para comparar
const plano = (ctx, ...a) => Array.from(ctx.planoJanela(...a).plano);
async function assentar(n = 4) { for (let i = 0; i < n; i++) await esperar(); }
// monta as folhas como no applyTese
function abrir(ctx) { ctx.buildSheets(); ctx.layoutSheets(); return ctx.$('canvaswrap'); }

test('geometria: a altura de cada folha sai da razão h/w da própria página; topos somados com o vão de 8 px; na página única, todos os topos em 0', () => {
  const ctx = ambiente();
  const dims = [{ w: 595.3, h: 841.9 }, { w: 841.9, h: 595.3 }, { w: 400, h: 400 }];
  for (const zoom of [0.5, 1, 2]) {
    const g = ctx.geometria(dims, 650, zoom, false);
    dims.forEach((d, i) => {
      const esc = Math.max(0.3, 646 / d.w) * zoom;
      assert.equal(g.largs[i + 1], Math.floor(d.w * esc), 'largura, zoom ' + zoom);
      assert.equal(g.alts[i + 1], Math.floor(d.h * esc), 'altura pela razão h/w, zoom ' + zoom);
      assert.ok(Math.abs(g.alts[i + 1] / g.largs[i + 1] - d.h / d.w) < 0.01);
    });
    assert.deepEqual(Array.from(g.tops), [0, 0, g.alts[1] + 8, g.alts[1] + 8 + g.alts[2] + 8], 'topos somados, zoom ' + zoom);
    assert.equal(g.total, g.alts[1] + g.alts[2] + g.alts[3] + 24);
  }
  const u = ctx.geometria(dims, 650, 1, true);
  assert.deepEqual(Array.from(u.tops), [0, 0, 0, 0], 'página única: a folha corrente fica sempre no topo');
  assert.equal(ctx.geometria([{ w: 4000, h: 1000 }], 650, 1, false).escs[1], 0.3, 'escala mínima de 0,3');
  // as folhas reais recebem a largura e a altura da geometria; o quadro rola pela soma
  const c = ambiente({ paginas: 6 }); const w = abrir(c);
  const sheets = w.children;
  assert.equal(sheets.length, 6);
  assert.deepEqual(sheets.map(s => s.getAttribute('data-p')), ['1', '2', '3', '4', '5', '6']);
  sheets.forEach((s, i) => { assert.equal(s.style.height, c.GEO.alts[i + 1] + 'px'); assert.equal(s.style.width, c.GEO.largs[i + 1] + 'px'); });
  assert.equal(c.GEO.tops[4], 3 * (c.GEO.alts[1] + 8));
  assert.equal(w.scrollHeight, 6 * (c.GEO.alts[1] + 8));
  assert.deepEqual(Array.from(c.faixaVisivel(c.GEO.tops, c.GEO.alts, c.GEO.tops[3] - 10, 900)), [2, 3], "o quadro cobre o fim da p. 2 e quase toda a p. 3");
  assert.deepEqual(Array.from(c.faixaVisivel(c.GEO.tops, c.GEO.alts, c.GEO.tops[3] + 100, 900)), [3, 4]);
  assert.ok(sheets[0].cls.has('cur') && !sheets[1].cls.has('cur'), 'a folha da página corrente nasce com .cur');
});

test('página dominante com histerese: troca só com 10 % do quadro a mais, ou se a atual saiu do quadro', () => {
  const ctx = ambiente();
  const alts = [0, 1000, 1000, 1000, 1000, 300], tops = [0, 0, 1008, 2016, 3024, 4032];
  const dom = (topo, atual, altura = 800) => ctx.paginaDominante(tops, alts, topo, altura, atual, 0.1);
  assert.equal(dom(0, 1), 1);
  assert.equal(dom(500, 1), 1, 'p. 1 mostra mais');
  assert.equal(dom(600, 1), 1, 'p. 2 mostra quase o mesmo (392 x 400): fica');
  assert.equal(dom(640, 1), 1, '72 px a mais (menos de 80): fica');
  assert.equal(dom(640, 2), 2, 'na mesma posição, quem já é a corrente também fica (faixa de histerese)');
  assert.equal(dom(650, 1), 2, '92 px a mais: troca');
  assert.equal(dom(700, 1), 2);
  assert.equal(dom(0, 5), 1, 'a atual saiu do quadro: troca para a dominante');
  assert.equal(dom(3800, 4), 4, 'a última folha, mais curta: a p. 4 ainda domina');
  assert.equal(dom(3900, 4), 5, 'a última folha inteira (300) contra 132 da p. 4');
  // zoom pequeno: várias folhas inteiras; empate mantém a atual
  const a2 = [0, 300, 300, 300, 300], t2 = [0, 0, 308, 616, 924];
  assert.equal(ctx.paginaDominante(t2, a2, 0, 800, 2, 0.1), 2);
  assert.equal(ctx.paginaDominante(t2, a2, 0, 800, 4, 0.1), 1, 'a atual quase fora (176 px) perde para uma inteira (300)');
});

test('derivação: a página corrente vem da rolagem quando ela para; rolagem programática (salto) e trecho ativo à vista não trocam', () => {
  const ctx = ambiente({ page: 3 });
  const w = abrir(ctx), G = ctx.GEO;
  w.scrollTop = G.tops[5]; ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, [[5, 'rolagem']]);
  // salto: a rolagem é programática e não deriva no fim dela
  ctx.trocas.length = 0;
  ctx.rolarPara(G.tops[9], false);
  assert.ok(ctx.ROL.trava, 'trava armada');
  ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, [], 'o fim da rolagem programática não troca a página');
  assert.ok(!ctx.ROL.trava, 'trava solta no fim (scrollend)');
  ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, [[9, 'rolagem']], 'a próxima parada volta a derivar');
  // trecho ativo ainda à vista: fica na página dele
  ctx.trocas.length = 0; ctx.S.page = 9; ctx.S.active = 'p9-5';
  const b = ctx.segBox(ctx.S.pages[8].segs[2], 9), yTrecho = G.tops[9] + b.y * G.alts[9];
  w.scrollTop = Math.round(yTrecho - 100); ctx.aoRolar(); ctx.aoParar();
  assert.equal(ctx.paginaDominante(G.tops, G.alts, w.scrollTop, 900, 9, 0.1), 10, 'a p. 10 domina o quadro');
  assert.deepEqual(ctx.trocas, [], 'mas o trecho ativo da p. 9 está à vista');
  w.scrollTop = G.tops[10] + 50; ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, [[10, 'rolagem']], 'o trecho saiu do quadro: troca');
  // gesto em curso: a parada espera o fim do gesto
  ctx.trocas.length = 0; ctx.ROL.gesto = true; w.scrollTop = G.tops[12]; ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, []);
  ctx.ROL.gesto = false; ctx.aoParar();
  assert.deepEqual(ctx.trocas, [[12, 'rolagem']]);
  // página única: a rolagem nunca troca a página
  const u = ambiente({ page: 3, cont: false }); const wu = abrir(u);
  assert.equal(u.GEO.tops[3], 0);
  wu.scrollTop = 400; u.aoRolar(); u.aoParar();
  assert.deepEqual(u.trocas, []);
});

test('orçamento de megapixels: as visíveis sempre; vizinhas só dentro do teto menos a cópia em alta dos recortes; a densidade baixa quando as visíveis não cabem', () => {
  // cópia em alta: 3 px por ponto até densidade 2 (1786 x 2526), 4,5 px por ponto com densidade 3 (2679 x 3789)
  assert.equal(+ambiente({ dpr: 2 }).reservaRecorte().toFixed(3), +(1786 * 2526 / 1e6).toFixed(3));
  assert.equal(+ambiente({ dpr: 3 }).reservaRecorte().toFixed(3), +(2679 * 3789 / 1e6).toFixed(3));
  const ctx = ambiente({ dpr: 2 }), orc = ctx.orcamento();
  assert.ok(Math.abs(orc - (24 - 1786 * 2526 / 1e6)) < 1e-9, 'teto 24 MP menos a cópia em alta');
  // tablet deitado, densidade 2: folha de 643 x 909 px CSS
  assert.equal(ctx.dprEfetivo(643, 909, 2, 2, orc), 2, 'zoom 100 %: densidade cheia');
  assert.equal(ctx.dprEfetivo(1286, 1818, 2, 2, orc), 2, 'zoom 200 %: duas visíveis ainda cabem');
  const d3 = ctx.dprEfetivo(1929, 2727, 2, 2, orc);
  assert.ok(d3 < 2 && 2 * ctx.mpFolha(1929, 2727, d3) <= orc + 1e-9, 'zoom 300 %: densidade efetiva menor e as duas visíveis cabem: ' + d3);
  assert.equal(ctx.dprEfetivo(643, 909, 2, 4, 1e9), 3, 'densidade do aparelho limitada a 3');
  // janela: visíveis do centro para fora, depois a vizinha do sentido da rolagem, depois a outra
  const n = 30, alts = [0], tops = [0], mp = v => [0, ...Array(n).fill(v)];
  for (let p = 1; p <= n; p++) { alts.push(909); tops.push((p - 1) * 917); }
  const topo = tops[6] + 400;
  const z1 = ctx.planoJanela(tops, alts, topo, 800, n, 1, mp(2.34), orc);
  assert.deepEqual(Array.from(z1.visiveis), [6, 7]); assert.deepEqual(Array.from(z1.plano), [6, 7, 8, 5], 'zoom 100 %: as duas vizinhas, a de baixo primeiro');
  assert.deepEqual(plano(ctx, tops, alts, topo, 800, n, -1, mp(2.34), orc), [6, 7, 5, 8], 'rolando para cima, a de cima primeiro');
  assert.deepEqual(plano(ctx, tops, alts, topo, 800, n, 1, mp(5.26), orc), [6, 7, 8], 'zoom 150 %: só a vizinha do sentido da rolagem');
  assert.deepEqual(plano(ctx, tops, alts, topo, 800, n, 1, mp(9.35), orc), [6, 7], 'zoom 200 %: nenhuma vizinha');
  assert.deepEqual(plano(ctx, tops, alts, topo, 800, n, 1, mp(12), orc), [6, 7], 'visíveis acima do orçamento continuam (a densidade é que baixa)');
  assert.deepEqual(plano(ctx, tops, alts, 0, 800, n, -1, mp(2.34), orc), [1, 2], 'na p. 1 não há vizinha acima');
  // no quadro: zoom 300 % com densidade 2 baixa a densidade efetiva até as visíveis caberem
  const c = ambiente({ dpr: 2, zoom: 3 }); abrir(c);
  assert.ok(c.GEO.dpr < 2, 'densidade efetiva ' + c.GEO.dpr);
  assert.ok(c.GEO.nVis * c.GEO.mps[1] <= c.orcamento() + 1e-9);
  const u = ambiente({ dpr: 2, zoom: 3, cont: false }); abrir(u);
  assert.equal(u.GEO.nVis, 1, 'página única: uma folha visível');
  assert.ok(u.GEO.dpr > c.GEO.dpr);
});

test('teto rígido no pico do zoom: antes de alocar, sai o desenho antigo da folha (sempre no zoom 2 ou mais) e os de outra escala, os mais longe primeiro', () => {
  const ctx = ambiente({ dpr: 2 }); const w = abrir(ctx);
  const cv = (wd, ht) => Object.assign(new El('canvas'), { width: wd, height: ht });
  // quatro folhas montadas com desenho de outra escala (o zoom acabou de mudar) e a cópia em alta
  for (const p of [4, 5, 6, 7]) { const f = ctx.FOLHAS[p]; f.montada = true; ctx.MONTADAS[p] = 1; f.cv = f.el.appendChild(cv(2600, 3600)); f.esc = 'escala velha'; f.ok = true; }
  ctx.hires.canvas = cv(1786, 2526);
  assert.ok(ctx.mpVivos() > 24, 'acima do teto antes: ' + ctx.mpVivos());
  ctx.S.zoom = 1.5;
  ctx.abrirEspaco(5, 9.36);
  assert.ok(ctx.mpVivos() + 9.36 <= 24, 'cabe com o novo: ' + ctx.mpVivos());
  assert.equal(ctx.FOLHAS[5].cv, null, 'a própria folha sai primeiro');
  assert.ok(ctx.FOLHAS[6].cv, 'a mais perto fica enquanto couber');
  assert.equal(ctx.FOLHAS[5].el.cls.has('ok'), false, 'sem desenho: volta o número em cinza');
  // zoom 2 ou mais: o antigo da folha sai antes, mesmo com folga
  const z = ambiente({ dpr: 1 }); abrir(z);
  const f = z.FOLHAS[3]; f.montada = true; z.MONTADAS[3] = 1; f.cv = f.el.appendChild(cv(100, 100)); f.esc = 'velha'; f.ok = true;
  z.S.zoom = 2; z.abrirEspaco(3, 1);
  assert.equal(f.cv, null);
  const y = ambiente({ dpr: 1 }); abrir(y);
  const g = y.FOLHAS[3]; g.montada = true; y.MONTADAS[3] = 1; g.cv = g.el.appendChild(cv(100, 100)); g.esc = 'velha'; g.ok = true;
  y.S.zoom = 1.75; y.abrirEspaco(3, 1);
  assert.ok(g.cv, 'abaixo do zoom 2 e com folga: o antigo estica até o novo');
});

test('fila de desenho: um por vez, visíveis do centro para fora e depois as vizinhas; nunca a mesma página duas vezes; a suspensa é promovida', async () => {
  const ctx = ambiente({ paginas: 20, quadro: [650, 900] }); const w = abrir(ctx), G = ctx.GEO;
  const pdf = ctx.S.pdf = pdfFalso();
  w.scrollTop = G.tops[5] + 100; ctx.ROL.yAnt = w.scrollTop;
  ctx.agenda();
  assert.deepEqual(Object.keys(ctx.MONTADAS).map(Number).sort((a, b) => a - b), [4, 5, 6, 7], 'visíveis (5, 6) e uma de folga de cada lado');
  assert.deepEqual(pdf.pedidos, [5], 'um desenho: o da folha mais central');
  ctx.agenda(); ctx.agenda();
  assert.deepEqual(pdf.pedidos, [5], 'com um desenho em curso, nenhum outro começa');
  await assentar();
  assert.equal(pdf.renders.length, 1);
  assert.equal(pdf.renders[0].passo().seguiu, true, 'folha visível: as fatias seguem');
  pdf.renders[0].fim(); await assentar();
  assert.ok(ctx.FOLHAS[5].ok && ctx.FOLHAS[5].el.cls.has('ok'), 'desenhada');
  assert.equal(ctx.FOLHAS[5].el.children[0], ctx.FOLHAS[5].cv, 'o desenho entra na folha');
  for (let k = 1; k < 4; k++) { await assentar(); pdf.renders[k].fim(); await assentar(); }
  assert.deepEqual(pdf.pedidos, [5, 6, 7, 4], 'depois a outra visível, a vizinha de baixo e a de cima');
  ctx.agenda(); await assentar();
  assert.deepEqual(pdf.pedidos, [5, 6, 7, 4], 'tudo desenhado nesta escala: nada se repete');
  assert.ok(ctx.recortes > 0, 'fila vazia e rolagem parada: a cópia em alta dos recortes pode começar');
  // rolando: só a folha visível ainda sem desenho começa; as vizinhas esperam
  w.scrollTop = G.tops[8] + 300; ctx.aoRolar(); ctx.agenda();
  const desmontadas = [4, 5, 6].map(p => ctx.FOLHAS[p]);
  assert.ok(desmontadas.every(f => !f.montada && !f.cv), 'fora da janela: canvas liberado');
  assert.ok([4, 5, 6].every(p => pdf.paginas[p].limpezas >= 1), 'e a página do pdf.js limpa (cleanup)');
  assert.deepEqual(pdf.pedidos.slice(4), [8], 'rolando: só a p. 8, visível e vazia');
  await assentar(); pdf.renders[4].fim(); await assentar();
  assert.deepEqual(pdf.pedidos.slice(4), [8, 9], 'a p. 9 também é visível');
  await assentar(); pdf.renders[5].fim(); await assentar();
  assert.deepEqual(pdf.pedidos.slice(4), [8, 9], 'a vizinha (p. 10) espera a rolagem parar');
  ctx.aoParar(); await assentar();
  assert.deepEqual(pdf.pedidos.slice(4), [8, 9, 10], 'parou: a vizinha começa');
  // a rolagem recomeça no meio do desenho da vizinha: a fatia fica presa e a fila libera
  await assentar(); const r10 = pdf.renders[6];
  ctx.aoRolar();
  const st = r10.passo();
  assert.equal(st.seguiu, false, 'vizinha fora do quadro durante a rolagem: fatia suspensa');
  assert.equal(ctx.FILA.ativa, null);
  // a vizinha entra no quadro: é promovida, sem pedir a página de novo
  w.scrollTop = G.tops[9] + 500; ctx.aoRolar(); ctx.agenda();
  assert.equal(st.seguiu, true, 'promovida');
  assert.equal(pdf.pedidos.filter(p => p === 10).length, 1, 'a p. 10 nunca é desenhada duas vezes');
  r10.fim(); await assentar();
  assert.ok(ctx.FOLHAS[10].ok);
});

test('acima do teto, o zoom não refaz o desenho: a chave é o bitmap em px e a escala total, e o mesmo desenho estica', async () => {
  // tablet deitado: quadro de 632 x 602 px, densidade 2; de 225 % em diante a densidade efetiva baixa na mesma proporção
  const ctx = ambiente({ paginas: 20, quadro: [632, 602], dpr: 2, zoom: 2, page: 5 }); const w = abrir(ctx);
  const pdf = ctx.S.pdf = pdfFalso();
  const desenhar = async () => { for (let k = 0; k < 6; k++) { await assentar(); pdf.renders.filter(r => !r.cancelada && !r.feito).forEach(r => { r.feito = true; r.fim(); }); } await assentar(); };
  const zoom = async z => { ctx.S.zoom = z; ctx.layoutSheets(ctx.ancoraCentro()); ctx.agenda(); ctx.aoParar(); ctx.agenda(); await desenhar(); };
  w.scrollTop = ctx.GEO.tops[5] + 200; ctx.ROL.yAnt = w.scrollTop;
  ctx.agenda(); await desenhar();
  const n200 = pdf.pedidos.length, bm200 = [ctx.FOLHAS[5].cv.width, ctx.FOLHAS[5].cv.height];
  assert.deepEqual(bm200, [2512, 3552], 'zoom 200 %: densidade cheia');
  await zoom(2.25);
  const cv225 = ctx.FOLHAS[5].cv, n225 = pdf.pedidos.length, k225 = ctx.chaveDe(5);
  assert.ok(n225 > n200, '200 % → 225 %: bitmap maior, a folha é refeita');
  assert.deepEqual([cv225.width, cv225.height], [2625, 3711]);
  for (const z of [2.5, 2.75, 3]) {
    await zoom(z);
    assert.ok(ctx.GEO.dpr < 2, 'densidade efetiva abaixo de 2 em ' + z);
    assert.equal(ctx.chaveDe(5), k225, 'mesmo bitmap e mesma escala total em ' + z + ': mesma chave');
    assert.equal(pdf.pedidos.length, n225, 'nenhum desenho novo em ' + z);
    assert.equal(ctx.FOLHAS[5].cv, cv225, 'o mesmo desenho continua na folha (estica), em ' + z);
    assert.ok(ctx.FOLHAS[5].ok && ctx.FOLHAS[5].el.cls.has('ok'), 'a folha nunca fica cinza, em ' + z);
  }
  await zoom(1.5);
  assert.ok(pdf.pedidos.length > n225, 'voltando a 150 %, a folha é refeita na densidade cheia');
  assert.deepEqual([ctx.FOLHAS[5].cv.width, ctx.FOLHAS[5].cv.height], [1884, 2664]);
});

test('fila de desenho: mudar a escala (zoom, largura, densidade, modo) com um desenho em curso cancela o antigo e deixa um só desenho ativo', async () => {
  const ctx = ambiente({ paginas: 20, quadro: [650, 900] }); const w = abrir(ctx), G = ctx.GEO;
  const pdf = ctx.S.pdf = pdfFalso();
  w.scrollTop = G.tops[5] + 100; ctx.ROL.yAnt = w.scrollTop;
  ctx.agenda(); await assentar();
  assert.deepEqual(pdf.pedidos, [5]); assert.equal(ctx.FILA.ativa, ctx.FOLHAS[5]);
  const antiga = ctx.FOLHAS[5].task;
  // como aplicaZoom: o zoom muda, layoutSheets cancela o desenho de outra escala e agenda recomeça a mesma folha
  ctx.S.zoom = 1.25; ctx.layoutSheets(ctx.ancoraCentro()); ctx.agenda();
  assert.equal(pdf.renders[0].cancelada, true, 'o desenho da escala antiga foi cancelado');
  assert.deepEqual(pdf.pedidos, [5, 5], 'a mesma folha recomeça na escala nova');
  const nova = ctx.FOLHAS[5].task;
  assert.ok(nova && nova !== antiga);
  // a rejeição do desenho cancelado chega depois (microtarefa): não pode soltar a fila do desenho novo
  await assentar();
  assert.equal(ctx.FILA.ativa, ctx.FOLHAS[5], 'a fila continua com o desenho novo da p. 5');
  assert.equal(ctx.FOLHAS[5].task, nova);
  ctx.aoParar(); ctx.agenda(); await assentar();
  const emCurso = () => pdf.renders.filter(r => !r.cancelada && !r.feito).map(r => r.p);
  assert.deepEqual(emCurso(), [5], 'depois da parada, um desenho só em curso');
  assert.deepEqual(pdf.pedidos, [5, 5], 'nenhuma outra folha começou junto');
  // o mesmo com a troca de modo (aplicaModo chama layoutSheets e agenda) no meio do desenho
  pdf.renders[1].feito = true; pdf.renders[1].fim(); await assentar();
  assert.deepEqual(pdf.pedidos, [5, 5, 6]);
  ctx.S.cont = false; ctx.$('canvaswrap').classList.toggle('unica', true); ctx.layoutSheets({ p: 5, fy: 0, fx: 0, sx: 0, sy: 0 }); ctx.agenda(); await assentar();
  ctx.aoParar(); ctx.agenda(); await assentar();
  assert.ok(emCurso().length <= 1, 'troca de modo: no máximo um desenho em curso: ' + emCurso());
});

test('medidor: o tempo de desenho não inclui o tempo em que a vizinha ficou suspensa durante a rolagem', async () => {
  const ctx = ambiente({ paginas: 20, quadro: [650, 900] }); const w = abrir(ctx), G = ctx.GEO;
  const pdf = ctx.S.pdf = pdfFalso();
  w.scrollTop = G.tops[5] + 100; ctx.ROL.yAnt = w.scrollTop;
  ctx.agenda();
  // as visíveis (5, 6) levam 50 ms cada
  for (let k = 0; k < 2; k++) { await assentar(); ctx.relogio.t += 50; pdf.renders[k].fim(); await assentar(); }
  assert.deepEqual(Array.from(ctx.MED.desenhos, d => [d.p, d.ms, d.esperou]), [[5, 50, 0], [6, 50, 0]]);
  // a vizinha (p. 7) começa com a rolagem parada; a rolagem recomeça e a fatia fica suspensa por 3 s
  await assentar(); const r7 = pdf.renders[2]; assert.equal(r7.p, 7);
  ctx.relogio.t += 10; ctx.aoRolar();
  assert.equal(r7.passo().seguiu, false, 'fatia suspensa');
  ctx.relogio.t += 3000;
  ctx.aoParar(); await assentar();
  ctx.relogio.t += 30; r7.fim(); await assentar();
  const d7 = ctx.MED.desenhos.at(-1);
  assert.deepEqual([d7.p, d7.ms, d7.esperou], [7, 40, 3000], 'desenho de 40 ms; os 3 s suspensos ficam à parte');
  assert.match(fonteFuncao('numerosTexto'), /ficou suspenso/);
});

test('compositor e aviso de grifo: a página congela na abertura; rolar duas folhas com o compositor aberto não deriva; salvar grava a página da abertura; o aviso fecha quando o usuário rola', () => {
  const ctx = ambiente({ page: 12 }); const w = abrir(ctx), G = ctx.GEO;
  ctx.openComposer('page', null, null);
  assert.equal(ctx.S.compose.pagina, 12);
  assert.equal(ctx.$('compWhere').textContent, 'p. 12');
  w.scrollTop = G.tops[14]; ctx.aoRolar(); ctx.aoParar();
  assert.deepEqual(ctx.trocas, [], 'com o compositor aberto, a página não deriva da rolagem');
  ctx.S.page = 14; // mesmo que a página corrente mude (por um salto), o comentário vai para a página da abertura
  assert.equal(ctx.baseDoc(ctx.S.compose).pagina, 12);
  ctx.S.page = 12;
  ctx.closeComposer();
  assert.deepEqual(ctx.trocas, [[14, 'rolagem']], 'fechado o compositor, a página volta a seguir a rolagem');
  assert.equal(ctx.baseDoc({ segId: null, grifoId: null, seg: null }).pagina, 14, 'sem página congelada, a corrente');
  // aviso de grifo (.pop) aberto: a parada de uma rolagem que começou antes dele não deriva; o ✕ volta a derivar
  ctx.trocas.length = 0;
  w.scrollTop = G.tops[16]; ctx.aoRolar();
  ctx.openGrifoPop({ id: 'g1', trecho: null }, 40, 80);
  const aviso = () => ctx.document.querySelector('#canvaswrap .pop');
  assert.ok(aviso() && aviso().parentNode === ctx.FOLHAS[14].el, 'aviso aberto na folha corrente (p. 14)');
  ctx.aoParar();
  assert.deepEqual(ctx.trocas, [], 'com o aviso aberto, a página não deriva');
  aviso().children.find(b => b.textContent === '✕').click();
  assert.equal(aviso(), null);
  assert.deepEqual(ctx.trocas, [[16, 'rolagem']], 'fechado no ✕, a página volta a seguir a rolagem');
  // aviso aberto e o usuário rola: o aviso fecha no começo da rolagem e a parada deriva (a página acompanha a folha)
  ctx.trocas.length = 0;
  ctx.openGrifoPop({ id: 'g1', trecho: null }, 40, 80);
  assert.ok(aviso());
  w.scrollTop = G.tops[17] + 20; ctx.aoRolar();
  assert.equal(aviso(), null, 'a rolagem do usuário fecha o aviso');
  ctx.aoParar();
  assert.deepEqual(ctx.trocas, [[17, 'rolagem']]);
  // «Apagar» também fecha e deriva
  ctx.trocas.length = 0;
  w.scrollTop = G.tops[18]; ctx.aoRolar(); ctx.openGrifoPop({ id: 'g1', trecho: null }, 40, 80); ctx.aoParar();
  assert.deepEqual(ctx.trocas, []);
  aviso().children.find(b => b.textContent === 'Apagar').click();
  assert.equal(aviso(), null);
  assert.deepEqual(ctx.trocas, [[18, 'rolagem']], 'fechado no Apagar, a página volta a seguir a rolagem');
  // rolagem programática (salto, centralização de trecho) não fecha o aviso
  ctx.trocas.length = 0;
  ctx.openGrifoPop({ id: 'g1', trecho: null }, 40, 80);
  ctx.rolarPara(G.tops[18] + 200, false); ctx.aoRolar();
  assert.ok(aviso(), 'a rolagem programática não fecha o aviso');
  ctx.aoParar(); aviso().remove();
  assert.deepEqual(ctx.trocas, []);
  assert.match(fonteFuncao('openComposer'), /pagina: S\.page/);
  assert.match(fonteFuncao('baseDoc'), /pagina: c\.pagina \|\| S\.page/);
});

test('recortes em alta: a rolagem só fica quieta 250 ms depois do último evento de rolagem e da troca de página (o scrollend de cada entalhe da roda não basta); faltando só tempo, a agenda volta sozinha; todo evento de rolagem interrompe a cópia em alta em curso', () => {
  const ctx = ambiente(), w = abrir(ctx), R = ctx.ROL;
  ctx.relogio.t = 50000;
  // um entalhe da roda: o evento de rolagem e o scrollend no mesmo milissegundo (calma 0, como numa rodada do e2e)
  w.scrollTop = 120; ctx.aoRolar(); ctx.aoParar();
  assert.equal(R.parado, true, 'o scrollend para a rolagem');
  assert.equal(ctx.rolagemQuieta(), false, 'calma 0: ainda não está quieta');
  ctx.timers.clear(); ctx.esperarQuieta();
  const [id] = [...ctx.timers.keys()];
  assert.equal(ctx.timers.size, 1);
  assert.equal(ctx.timers.get(id), ctx.agenda, 'o relógio chama a agenda');
  assert.equal(ctx.atrasos.get(id), 251, 'o relógio espera a calma que falta');
  ctx.esperarQuieta();
  assert.equal(ctx.timers.size, 1, 'um relógio só: o anterior é trocado');
  // o entalhe seguinte chega 86 ms depois, como na mesma rodada: a calma recomeça dele
  ctx.relogio.t += 86; w.scrollTop = 240; ctx.aoRolar();
  assert.equal(ctx.rolagemQuieta(), false, 'rolando');
  ctx.aoParar(); ctx.relogio.t += 249;
  assert.equal(ctx.rolagemQuieta(), false, '249 ms depois do último evento de rolagem: ainda não');
  ctx.relogio.t += 1;
  assert.equal(ctx.rolagemQuieta(), true, '250 ms sem rolagem: quieta');
  // a troca de página também espera 250 ms
  R.nav = ctx.relogio.t;
  assert.equal(ctx.rolagemQuieta(), false, 'acabou de trocar de página');
  ctx.relogio.t += 250;
  assert.equal(ctx.rolagemQuieta(), true);
  // gesto, embalo, rolagem em curso ou desenho na fila: sem relógio (quem termina chama a agenda)
  R.ultimo = ctx.relogio.t;
  for (const [nome, mexe, volta] of [
    ['gesto', () => { R.gesto = true; }, () => { R.gesto = false; }],
    ['embalo', () => { R.embalo = 3; }, () => { R.embalo = 0; }],
    ['rolando', () => { R.parado = false; }, () => { R.parado = true; }],
    ['fila', () => { ctx.FILA.ativa = {}; }, () => { ctx.FILA.ativa = null; }],
  ]) {
    mexe(); ctx.timers.clear(); ctx.esperarQuieta();
    assert.equal(ctx.timers.size, 0, nome + ': sem relógio');
    assert.equal(ctx.rolagemQuieta(), false, nome);
    volta();
  }
  ctx.esperarQuieta();
  assert.equal(ctx.timers.size, 1, 'parada e com a fila vazia: o relógio volta');
  // todo evento de rolagem do quadro, do usuário ou programático, chama interromperHires (a cópia em alta em curso para
  // na hora e recomeça depois da calma; ela mesma não faz nada se não houver cópia em curso)
  ctx.interrupcoes = 0; w.scrollTop = 360; ctx.aoRolar();
  assert.equal(ctx.interrupcoes, 1, 'rolagem do usuário');
  ctx.rolarPara(600, false); w.scrollTop = 600; ctx.aoRolar();
  assert.equal(R.trava, true);
  assert.equal(ctx.interrupcoes, 2, 'rolagem programática (salto, centralização de trecho, âncora do zoom)');
  ctx.aoParar();
  assert.match(js, /function gestoVivo\(\) \{ ROL\.gesto = true; interromperHires\(\);/, 'o começo de um gesto também interrompe');
});

test('medidor: a mediana de um número par de valores é a média dos dois do meio, com vírgula no texto', () => {
  const ctx = vm.createContext({});
  vm.runInContext([fonteFuncao('dec'), fonteFuncao('mediana'), fonteFuncao('medTxt')].join('\n'), ctx);
  assert.equal(ctx.mediana([]), null);
  assert.equal(ctx.medTxt([]), 'sem medida');
  assert.equal(ctx.mediana([7]), 7);
  assert.equal(ctx.mediana([30, 10, 20]), 20, 'ímpar: o do meio');
  assert.equal(ctx.mediana([10, 20]), 15, 'par: a média dos dois do meio');
  // as 14 trocas de um «Copiar números» medido no Edge: os dois do meio são 59 e 66 (a regra antiga dava 59)
  const trocas = [70, 76, 8, 80, 8, 59, 12, 66, 11, 342, 49, 70, 39, 87];
  assert.equal(ctx.mediana(trocas), 62.5);
  assert.equal(ctx.medTxt(trocas), '62,5');
  assert.equal(ctx.medTxt([83, 152, 38, 136, 293, 164, 156, 253, 126, 248]), '154', 'média inteira: sem casa decimal');
  assert.deepEqual(trocas.slice(0, 3), [70, 76, 8], 'não muda a lista');
  const nt = fonteFuncao('numerosTexto');
  assert.doesNotMatch(nt, /mediana\(/, 'o texto usa medTxt');
  assert.equal((nt.match(/medTxt\(/g) || []).length, 3, 'trocas, desenhos e espera');
});

test('embalo do dedo (S Pen): a soltura vale pelo tempo do evento, mesmo com o pointerup atrasado; um primeiro quadro curto, que não anda um pixel, não encerra o embalo; o fim é a borda ou a velocidade', () => {
  const ctx = ambiente({ page: 3, Q: QuadroInteiro });
  const w = abrir(ctx), max = w.scrollHeight - w.clientHeight;
  vm.runInContext("var wrap = $('canvaswrap');\n" + ['tempoDe', 'soltarEmbalo', 'pararEmbalo'].map(fonteFuncao).join('\n'), ctx);
  // o dedo sobe 35 px a cada 10 ms (3,5 px/ms) e sai da tela 10 ms depois da última amostra (tempos dos eventos)
  const sobe = () => Array.from({ length: 9 }, (_, k) => [900 + 10 * k, 300, 600 - 35 * k]);
  const desce = () => Array.from({ length: 9 }, (_, k) => [900 + 10 * k, 300, 300 + 35 * k]);
  const ini = ctx.embaloIni(sobe(), 990);
  assert.equal(ini.motivo, null); assert.equal(ini.vy, 3.5); assert.equal(ini.parado, 10);
  assert.equal(ctx.embaloIni(sobe(), 1050).motivo, 'parado', 'o dedo ficou parado 70 ms antes de sair');
  assert.equal(ctx.embaloIni([[0, 300, 600], [200, 300, 565]], 210).motivo, 'devagar', '0,175 px/ms');
  assert.equal(ctx.embaloIni([[900, 300, 600]], 905).motivo, 'amostras');
  const quadros = (t0, n = 1000) => { let t = t0, k = 0; while (ctx.ROL.embalo && k++ < n) { t += 16; ctx.rafs.shift()(t); } return k; };
  // 1. thread ocupado: o manipulador do pointerup roda 110 ms depois de o dedo sair; a soltura vale pela hora do evento
  w.scrollTop = 1000; ctx.relogio.t = 1100;
  ctx.soltarEmbalo({ am: sobe() }, ctx.tempoDe({ timeStamp: 990 }));
  assert.ok(ctx.ROL.embalo, 'o embalo começa (a regra antiga, pela hora do manipulador, via 120 ms e desistia)');
  assert.deepEqual({ ...ctx.MED.embalo }, { solto: 990, atraso: 110, parado: 10, v: 3.5, y0: 1000, quadros: 0, fim: null, y1: null, dur: 0 });
  ctx.rafs.shift()(1100);
  assert.equal(w.scrollTop, 1000 + Math.round(3.5 * 48), 'o primeiro quadro alcança até 48 ms do que o dedo teria andado');
  quadros(1100);
  assert.equal(ctx.MED.embalo.fim, 'devagar'); assert.ok(w.scrollTop > 2000, 'andou mais de 1000 px: ' + w.scrollTop);
  // 2. primeiro quadro 0,1 ms depois da soltura: 0,35 px, que o quadro arredonda para 0; o embalo segue
  ctx.rafs.length = 0; w.scrollTop = 4000; ctx.relogio.t = 990;
  ctx.soltarEmbalo({ am: sobe() }, 990);
  ctx.rafs.shift()(990.1);
  assert.equal(w.scrollTop, 4000, 'o quadro arredondou o passo curto');
  assert.ok(ctx.ROL.embalo && ctx.rafs.length === 1 && ctx.MED.embalo.fim === null, 'o quadro curto não encerra o embalo');
  ctx.rafs.shift()(1006.1);
  assert.ok(w.scrollTop >= 4055, 'o quadro seguinte anda (com a fração guardada): ' + w.scrollTop);
  const nq = quadros(1006.1);
  assert.equal(ctx.MED.embalo.fim, 'devagar');
  assert.ok(nq > 50 && w.scrollTop > 5000 && w.scrollTop < 5300, 'decai até 0,03 px/ms: ' + nq + ' quadros, ' + w.scrollTop);
  assert.ok(ctx.ROL.parado, 'o fim do embalo chama a parada');
  // 3. bordas: no fim do quadro (descendo) e no topo (subindo) o embalo termina na borda
  ctx.rafs.length = 0; w.scrollTop = max - 5; ctx.relogio.t = 990;
  ctx.soltarEmbalo({ am: sobe() }, 990); quadros(990);
  assert.equal(w.scrollTop, max); assert.equal(ctx.MED.embalo.fim, 'borda'); assert.equal(ctx.MED.embalo.quadros, 1);
  ctx.rafs.length = 0; w.scrollTop = 3; ctx.relogio.t = 990;
  ctx.soltarEmbalo({ am: desce() }, 990); quadros(990);
  assert.equal(w.scrollTop, 0); assert.equal(ctx.MED.embalo.fim, 'borda');
  // 4. o próximo toque para o embalo; dedo parado ou devagar não começa embalo nenhum
  ctx.rafs.length = 0; w.scrollTop = 4000; ctx.relogio.t = 990;
  ctx.soltarEmbalo({ am: sobe() }, 990); ctx.rafs.shift()(1006); ctx.relogio.t = 1010;
  ctx.pararEmbalo();
  assert.equal(ctx.ROL.embalo, 0); assert.equal(ctx.MED.embalo.fim, 'toque'); assert.equal(ctx.MED.embalo.dur, 20);
  ctx.rafs.length = 0; ctx.relogio.t = 1060;
  ctx.soltarEmbalo({ am: sobe() }, ctx.tempoDe({ timeStamp: 1050 }));
  assert.equal(ctx.ROL.embalo, 0); assert.equal(ctx.MED.embalo.fim, 'parado'); assert.equal(ctx.rafs.length, 0);
  // tempoDe: sem timeStamp, ou numa base de tempo que não é a do performance.now(), vale a hora do manipulador
  ctx.relogio.t = 5000;
  assert.equal(ctx.tempoDe({ timeStamp: 4990 }), 4990);
  assert.equal(ctx.tempoDe({}), 5000); assert.equal(ctx.tempoDe({ timeStamp: 0 }), 5000); assert.equal(ctx.tempoDe({ timeStamp: 1.7e12 }), 5000);
  assert.match(js, /soltarEmbalo\(pn, tempoDe\(e\)\)/, 'o pointerup passa a hora do evento');
});

test('chave mesa.rolagem: ligada por padrão; só o valor false desliga; inválida vira ligada', () => {
  const ler = v => ambiente({ ls: v === undefined ? {} : { 'mesa.rolagem': v } }).lerRolagem();
  assert.equal(ler(undefined), true, 'ausente: ligada');
  assert.equal(ler('true'), true);
  assert.equal(ler('false'), false, 'false: uma página por vez');
  for (const ruim of ['"false"', '0', 'null', '"nao"', '{}', '[]', 'não é JSON', ''])
    assert.equal(ler(ruim), true, 'valor ' + ruim);
  const ctx = ambiente();
  ctx.localStorage.getItem = () => { throw new Error('bloqueado'); };
  assert.equal(ctx.lerRolagem(), true, 'localStorage bloqueado: ligada');
  assert.match(js, /cont: lerRolagem\(\)/, 'lida no arranque, no estado S');
  assert.match(js, /lsSet\('mesa\.rolagem', S\.cont\)/, 'a chave em ⚙ grava');
  assert.match(html, /<input type="checkbox" id="cfgRolagem" checked> Rolagem contínua<\/label>/);
});
