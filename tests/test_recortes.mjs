// Teste dos recortes de equação, tabela e figura (sem rede e sem navegador): node --test tests/test_recortes.mjs
// Roda o código real do index.html (kindOf, segText, renderSegs e o bloco «recortes») num DOM mínimo de mentira,
// com trechos e página sintéticos e um pdf.js de mentira: nada da tese entra aqui.
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
const FONTE = [js.match(/var KIND = \{[^}]*\};/)[0], fonteFuncao('pageSegs'), fonteFuncao('segOf'), fonteFuncao('kindOf'), fonteFuncao('isCrop'), fonteFuncao('segText'), fonteFuncao('mkBtn'),
  bloco('recortes (equacoes, tabelas, figuras)'), fonteFuncao('renderSegs')].join('\n');

class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.on = {}; this.className = ''; this.textContent = ''; this._html = '';
    this.dataset = {}; this.style = {}; this.hidden = false; this.parentNode = null; this.id = ''; this.desenhos = [];
    if (tag === 'canvas') { this.width = 300; this.height = 150; }
  }
  appendChild(c) { if (c.parentNode) c.remove(); c.parentNode = this; this.children.push(c); return c; }
  remove() { const p = this.parentNode; if (p) { p.children = p.children.filter(x => x !== this); this.parentNode = null; } }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  click() { (this.on.click || []).forEach(f => f({ type: 'click', target: this })); }
  set innerHTML(v) { this._html = String(v); this.children.forEach(c => { c.parentNode = null; }); this.children = []; }
  get innerHTML() { return this._html; }
  get firstChild() { return this.children[0] || (this._primeiro ||= new El('span')); }
  getContext() { const el = this; return { fillStyle: '', fillRect() { }, drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh) { el.desenhos.push({ src, sx, sy, sw, sh, dx, dy, dw, dh }); } }; }
}
const todos = (el, out = []) => { el.children.forEach(c => { out.push(c); todos(c, out); }); return out; };

const W = 595.3, H = 841.9;
// pdf.js de mentira: cada render fica pendente até o teste mandar terminar ou cancelar
function pdfFalso() {
  const renders = [];
  const pg = {
    getViewport: ({ scale }) => ({ width: W * scale, height: H * scale, scale }),
    render: ({ canvasContext, viewport }) => {
      const r = { scale: viewport.scale, cancelada: false }; r.promise = new Promise((res, rej) => { r.fim = res; r.falha = rej; });
      r.cancel = () => { r.cancelada = true; r.falha(Object.assign(new Error('cancelada'), { name: 'RenderingCancelledException' })); };
      renders.push(r); return r;
    },
  };
  return { renders, getPage: () => Promise.resolve(pg) };
}
function ambiente({ segs, dpr = 1, paginas } = {}) {
  const ids = {};
  const $ = id => (ids[id] ||= Object.assign(new El(id === 'canvas' ? 'canvas' : 'div'), { id }));
  const criados = [];
  const document = {
    body: new El('body'), createElement: tag => { const e = new El(tag); criados.push(e); return e; }, getElementById: $,
    querySelectorAll: sel => { assert.equal(sel, '#segs canvas.crop'); return todos($('segs')).filter(e => e.tagName === 'CANVAS' && e.className === 'crop'); },
  };
  const S = { page: 1, pages: paginas || [{ label: '1', w: W, h: H, segs }], active: null, comments: [], tiragem: 'abcd1234', pageReady: 0, pdf: null, pdfPageW: W, pdfPageH: H };
  const ctx = {
    document, S, $, criados, faladas: [], traduzidas: [], ativos: [],
    window: { devicePixelRatio: dpr },
    grifosOfPage: () => [], commentsOf: () => [], commentNode: () => new El('div'), openComposer: () => { }, saveBlock: () => { }, store: { remove: () => Promise.resolve() }, toast: () => { },
    mkTradBtn: fn => { const b = new El('button'); b.setAttribute('title', 'Traduzir'); b.addEventListener('click', fn); return b; },
  };
  ctx.speak = t => ctx.faladas.push(t);
  ctx.traduzir = t => ctx.traduzidas.push(t);
  ctx.setActive = id => ctx.ativos.push(id);
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  return ctx;
}
const cartoes = ctx => ctx.$('segs').children.filter(e => /^seg-/.test(e.id));
const recorteDe = el => el.children.find(c => c.tagName === 'CANVAS' && c.className === 'crop') || null;
const botoes = el => el.children.find(c => c.className === 'acts').children;
const esperar = () => new Promise(r => setImmediate(r));

const NUMERO = { id: 'p1-1', kind: 'equation', bbox: [300, 779, 323.5, 791], text: '2026', label: 'Equação' };
const EQUACAO = { id: 'p1-2', kind: 'equation', bbox: [272.7, 113.1, 538.6, 197], text: 'y = a x + b (1.1)', label: '(1.1)' };
const TABELA = { id: 'p1-3', kind: 'table', bbox: [93.8, 141.3, 529.9, 693], text: '', label: 'Table 1', caption: 'A wide table' };
const TEXTO = { id: 'p1-4', kind: 'text', bbox: [85, 700, 538, 760], text: 'Plain paragraph.' };

test('falso positivo de equação: curta, só dígitos, pontuação, parênteses e espaços, vira texto comum', () => {
  const ctx = ambiente({ segs: [] });
  const casos = [
    [{ kind: 'equation', text: '2026' }, 'text'], [{ kind: 'equation', text: '(3.1)' }, 'text'], [{ kind: 'equation', text: ' (3.15) ' }, 'text'],
    [{ kind: 'equation', text: '[12], 3–4.' }, 'text'], [{ kind: 'equation', text: '123456789012345' }, 'text'],
    [{ kind: 'equation', text: '1234567890123456' }, 'equation'], [{ kind: 'equation', text: 'x = 2' }, 'equation'], [{ kind: 'equation', text: 'x2 (3.1)' }, 'equation'], [{ kind: 'equation', text: 'F_1' }, 'equation'], [{ kind: 'equation', text: '1 + 2' }, 'equation'],
    [{ kind: 'equation', text: '−1' }, 'equation'], [{ kind: 'equation', text: '(.)' }, 'equation'], [{ kind: 'equation', text: '' }, 'equation'], [{ kind: 'equation' }, 'equation'],
    [{ kind: 'table', text: '2026' }, 'table'], [{ kind: 'figure', text: '12' }, 'figure'], [{ kind: 'text', text: '2026' }, 'text'], [{ kind: 'caption', text: '(3.1)' }, 'caption'],
  ];
  for (const [s, k] of casos) assert.equal(ctx.kindOf(s), k, JSON.stringify(s));
  assert.equal(ctx.isCrop(NUMERO), false);
  assert.equal(ctx.isCrop(EQUACAO), true);
  assert.equal(ctx.isCrop(TABELA), true);
  assert.equal(ctx.segText(NUMERO), '2026', 'Ler, Traduzir e o texto do comentário usam o próprio texto');
  assert.equal(ctx.segText(EQUACAO), '(1.1)');
  assert.equal(ctx.segText(TABELA), 'Table 1: A wide table');
});

test('o falso positivo aparece como cartão de texto, com Ler e Traduzir e sem recorte; equação e tabela de verdade têm recorte', () => {
  const ctx = ambiente({ segs: [NUMERO, EQUACAO, TABELA, TEXTO] });
  ctx.renderSegs();
  const [n, e, t, x] = cartoes(ctx);
  assert.equal(recorteDe(n), null);
  const txt = n.children.find(c => /^txt/.test(c.className));
  assert.equal(txt.className, 'txt');
  assert.equal(txt.textContent, '2026');
  assert.equal(n.children[0].firstChild.textContent, 'Trecho 1');
  const bs = botoes(n);
  const ler = bs.find(b => b.textContent === 'Ler'), trad = bs.find(b => b.getAttribute('title') === 'Traduzir');
  assert.ok(ler && trad, 'Ler e Traduzir no cartão');
  ler.click(); trad.click();
  assert.deepEqual(ctx.faladas, ['2026']);
  assert.deepEqual(ctx.traduzidas, ['2026']);
  assert.ok(recorteDe(e) && recorteDe(t), 'equação e tabela com recorte');
  assert.equal(e.children[0].firstChild.textContent, '(1.1) · trecho 2');
  assert.ok(!botoes(e).some(b => b.textContent === 'Ler'), 'recorte sem Ler');
  assert.equal(recorteDe(x), null);
});

test('tamanho do recorte: 3 px por ponto do PDF (mais em telas densas, até 4 096 px), e na tela 1,5 px CSS por ponto, com pelo menos 2 px do recorte por px CSS', () => {
  for (const dpr of [1, 1.5, 2]) assert.equal(ambiente({ segs: [], dpr }).cropScale(W), 3, 'dpr ' + dpr);
  assert.equal(ambiente({ segs: [], dpr: 2.625 }).cropScale(W), 1.5 * 2.625);
  assert.equal(ambiente({ segs: [], dpr: 3 }).cropScale(W), 4.5);
  assert.equal(ambiente({ segs: [], dpr: 4 }).cropScale(W), 4.5, 'dpr acima de 3 conta como 3');
  assert.equal(ambiente({ segs: [], dpr: 1 }).cropScale(2000), 4096 / 2000, 'página larga: no máximo 4 096 px');
  let semente = 7; const aleat = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  for (const dpr of [1, 2, 2.625, 3]) {
    const ctx = ambiente({ segs: [], dpr }); const sc = ctx.cropScale(W);
    for (let i = 0; i < 400; i++) {
      const x0 = aleat() * 500, y0 = aleat() * 780, w = 2 + aleat() * (W - x0), h = 2 + aleat() * (H - y0);
      const g = ctx.cropGeom({ bbox: [x0, y0, Math.min(W, x0 + w), Math.min(H, y0 + h)] }, { w: W, h: H }, sc);
      assert.ok(g.pw / g.css >= Math.max(2, Math.min(dpr, 3)), `dpr ${dpr}: ${g.pw} px para ${g.css} px CSS`);
      assert.ok(Math.abs(g.css - g.w * 1.5) <= 1, `tamanho de leitura: ${g.css} x ${g.w * 1.5}`);
      assert.ok(g.x >= 0 && g.y >= 0 && g.x + g.w <= W + 1e-9 && g.y + g.h <= H + 1e-9, 'dentro da página');
    }
  }
  const ctx = ambiente({ segs: [] });
  const g = ctx.cropGeom(NUMERO, { w: W, h: H }, 3);
  assert.ok(Math.abs(g.x - (300 - 0.006 * W)) < 1e-9 && Math.abs(g.y - (779 - 0.006 * H)) < 1e-9, 'margem de 0,6 % da página em volta do trecho');
});

test('o canvas de cada recorte tem o tamanho da renderização em alta, largura CSS de leitura, e é o mesmo em cada redesenhada da lista', () => {
  const ctx = ambiente({ segs: [EQUACAO, TABELA] });
  ctx.renderSegs();
  const c1 = recorteDe(cartoes(ctx)[0]), t1 = recorteDe(cartoes(ctx)[1]);
  const ge = ctx.cropGeom(EQUACAO, { w: W, h: H }, 3), gt = ctx.cropGeom(TABELA, { w: W, h: H }, 3);
  assert.deepEqual([c1.width, c1.height, c1.style.width], [ge.pw, ge.ph, ge.css + 'px']);
  assert.deepEqual([t1.width, t1.height, t1.style.width], [gt.pw, gt.ph, gt.css + 'px']);
  assert.equal(c1.style.height, undefined, 'a altura sai da proporção do canvas (height: auto no CSS)');
  assert.ok(gt.css > 600, 'tabela larga: o tamanho natural passa do cartão e o CSS (max-width: 100%) reduz');
  assert.match(html, /\.seg \.crop \{ display: block; max-width: 100%; height: auto;[^}]*\}/);
  assert.doesNotMatch(html.match(/\.seg \.crop \{[^}]*\}/)[0], /[{;]s*width: 100%|image-rendering/, 'sem esticar e com o suavizado padrão');
  c1.dataset.res = 'alta';
  ctx.renderSegs();
  assert.equal(recorteDe(cartoes(ctx)[0]), c1, 'mesmo canvas');
  assert.equal(c1.dataset.res, 'alta', 'sem redesenhar');
  ctx.S.page = 2; ctx.S.pages.push({ label: '2', w: W, h: H, segs: [EQUACAO] });
  ctx.renderSegs();
  assert.notEqual(recorteDe(cartoes(ctx)[0]), c1, 'outra página, outro canvas');
  assert.deepEqual([c1.width, c1.height, t1.width], [0, 0, 0], 'os recortes da página anterior são liberados');
});

test('desenho: provisório do canvas visível; depois uma renderização em alta, única por página, só depois da página visível; liberada ao mudar de página', async () => {
  const pdf = pdfFalso();
  const ctx = ambiente({ segs: [EQUACAO, TABELA, TEXTO] });
  ctx.S.pdf = pdf;
  const vis = ctx.$('canvas'); vis.width = 600; vis.height = Math.round(600 * H / W);
  ctx.renderSegs();
  await esperar();
  assert.equal(pdf.renders.length, 0, 'nada antes de a página visível terminar');
  let c = recorteDe(cartoes(ctx)[0]);
  assert.equal(c.desenhos.length, 0);
  ctx.S.pageReady = 1; ctx.drawCrops();
  await esperar();
  assert.equal(pdf.renders.length, 1);
  assert.equal(pdf.renders[0].scale, 3);
  c = recorteDe(cartoes(ctx)[0]);
  const g = ctx.cropGeom(EQUACAO, { w: W, h: H }, 1), sv = 600 / W;
  assert.equal(c.dataset.res, 'provisoria');
  assert.equal(c.desenhos.at(-1).src, vis);
  assert.ok(Math.abs(c.desenhos.at(-1).sx - g.x * sv) < 1e-6 && Math.abs(c.desenhos.at(-1).sw - g.w * sv) < 1e-6);
  ctx.renderSegs(); ctx.drawCrops();
  await esperar();
  assert.equal(pdf.renders.length, 1, 'uma renderização em alta por página');
  assert.equal(c.desenhos.length, 1, 'o provisório não é redesenhado');
  pdf.renders[0].fim();
  await esperar(); await esperar();
  const hi = ctx.criados.filter(e => e.tagName === 'CANVAS' && e.className !== 'crop').at(-1);
  assert.equal(hi.width, Math.ceil(W * 3), 'página inteira a 3 px por ponto');
  for (const k of [0, 1]) {
    const r = recorteDe(cartoes(ctx)[k]), s = [EQUACAO, TABELA][k], gg = ctx.cropGeom(s, { w: W, h: H }, 1), d = r.desenhos.at(-1);
    assert.equal(r.dataset.res, 'alta');
    assert.equal(d.src, hi);
    assert.ok(Math.abs(d.sx - gg.x * 3) < 1e-6 && Math.abs(d.sy - gg.y * 3) < 1e-6 && Math.abs(d.sw - gg.w * 3) < 1e-6 && Math.abs(d.sh - gg.h * 3) < 1e-6, 'recorta a região do trecho');
    assert.deepEqual([d.dx, d.dy, d.dw, d.dh], [0, 0, r.width, r.height], 'um pixel da renderização para um pixel do recorte');
    assert.ok(Math.abs(d.sw - r.width) <= 1 && Math.abs(d.sh - r.height) <= 1, 'sem esticar os pixels');
  }
  ctx.renderSegs(); ctx.drawCrops();
  assert.equal(recorteDe(cartoes(ctx)[0]).desenhos.length, 2, 'depois de pronto, nada é redesenhado');
  // mudar de página com uma renderização em alta pendente: cancela e libera
  ctx.S.pages.push({ label: '2', w: W, h: H, segs: [TABELA] });
  ctx.freeHires(); ctx.freeCrops(); ctx.S.page = 2; ctx.S.pageReady = 2;
  assert.equal(hi.width, 0, 'a cópia em alta da página anterior é liberada');
  ctx.renderSegs();
  await esperar(); await esperar();
  assert.equal(pdf.renders.length, 2);
  ctx.freeHires(); ctx.S.page = 1;
  await esperar();
  assert.equal(pdf.renders[1].cancelada, true, 'renderização em curso cancelada ao sair da página');
  // página sem recortes: nenhuma renderização extra
  ctx.S.pages.push({ label: '3', w: W, h: H, segs: [TEXTO, NUMERO] });
  ctx.freeHires(); ctx.freeCrops(); ctx.S.page = 3; ctx.S.pageReady = 3;
  ctx.renderSegs(); ctx.drawCrops();
  await esperar();
  assert.equal(pdf.renders.length, 2, 'página sem equação, tabela ou figura não renderiza de novo');
});
