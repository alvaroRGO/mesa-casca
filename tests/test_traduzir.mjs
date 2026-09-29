// Teste do ícone «Traduzir» (sem rede e sem navegador): node --test tests/test_traduzir.mjs
// Roda o código real do index.html (renderSegs, mkBtn, segText e o bloco «traduzir») num DOM mínimo de mentira,
// com trechos sintéticos: nada da tese entra aqui.
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
const FONTE = [js.match(/var KIND = \{[^}]*\};/)[0], fonteFuncao('segText'), fonteFuncao('mkBtn'), bloco('traduzir'), fonteFuncao('renderSegs')].join('\n');
const URL_BASE = 'https://translate.google.com/?sl=en&tl=pt&op=translate&text=';
const SEM_REDE = 'Sem rede: selecione o texto e use Traduzir do Android';

class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.on = {}; this.className = ''; this.textContent = ''; this._html = ''; this.dataset = {}; this.style = {}; this.hidden = false; this.parentNode = null; this.cliques = 0; this.id = ''; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  remove() { const p = this.parentNode; if (p) { p.children = p.children.filter(x => x !== this); this.parentNode = null; } }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  click() { this.cliques++; (this.on.click || []).forEach(f => f({ type: 'click', target: this })); }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  get innerHTML() { return this._html; }
  get firstChild() { return this.children[0] || (this._primeiro ||= new El('span')); }
}

const SEGS = [
  { id: 'p1-1', kind: 'text', bbox: [50, 80, 540, 140], text: 'Rate & error:  50% "drift"\n/ ação ≤ 1' },
  { id: 'p1-2', kind: 'caption', bbox: [50, 150, 540, 170], text: 'Figure 1. A caption.' },
  { id: 'p1-3', kind: 'equation', bbox: [50, 180, 540, 220], label: '(2.1)' },
  { id: 'p1-4', kind: 'table', bbox: [50, 230, 540, 400], label: 'Table 3', caption: 'Sizes & weights' },
  { id: 'p1-5', kind: 'figure', bbox: [50, 410, 540, 600] },
];

function ambiente({ share, online = true, toque = false, android = false, ativo = true, segs = SEGS } = {}) {
  const ids = {};
  const $ = id => (ids[id] ||= Object.assign(new El('div'), { id }));
  const criados = [];
  const document = { body: new El('body'), createElement: tag => { const e = new El(tag); criados.push(e); return e; }, getElementById: $ };
  const navigator = { onLine: online, userAgent: android ? 'Mozilla/5.0 (Linux; Android 14; SM-X710) Chrome/140' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', userActivation: { isActive: ativo } };
  if (share) navigator.share = share;
  const S = { page: 1, pages: [{ label: '1', segs }], active: null, comments: [] };
  const ctx = {
    document, navigator, S, $, criados, toasts: [], ativos: [],
    window: { matchMedia: q => ({ matches: toque && /coarse/.test(q) }) },
    setTimeout: () => 0,
    pageSegs: () => S.pages[S.page - 1].segs, grifosOfPage: () => [], commentsOf: () => [], commentNode: () => new El('div'), drawCrops: () => { },
    openComposer: () => { }, speak: () => { }, saveBlock: () => { }, store: { remove: () => Promise.resolve() },
  };
  ctx.toast = m => ctx.toasts.push(m);
  ctx.setActive = id => ctx.ativos.push(id);
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  return ctx;
}
const trechosRenderizados = ctx => { ctx.renderSegs(); return ctx.$('segs').children.filter(e => /^seg-/.test(e.id)); };
const botaoTraduzir = el => el.children.find(c => c.className === 'acts').children.filter(b => b.getAttribute('title') === 'Traduzir');
const abas = ctx => ctx.criados.filter(e => e.tagName === 'A' && e.cliques > 0);
const esperar = () => new Promise(r => setImmediate(r));
const normal = t => t.replace(/\s+/g, ' ').trim();

test('o ícone «Traduzir» aparece uma vez em cada trecho renderizado, pequeno, só ícone, com title e aria-label', () => {
  const ctx = ambiente();
  const els = trechosRenderizados(ctx);
  assert.equal(els.length, SEGS.length);
  for (const el of els) {
    const bs = botaoTraduzir(el);
    assert.equal(bs.length, 1, 'um ícone em ' + el.id);
    const b = bs[0];
    assert.equal(b.tagName, 'BUTTON');
    assert.equal(b.getAttribute('aria-label'), 'Traduzir');
    assert.equal(b.className, 'btn small icon');
    assert.equal(b.textContent, '');
    assert.match(b.innerHTML, /^<svg [^>]*aria-hidden="true"[^>]*>(<path d="[^"]+"\/>)+<\/svg>$/);
    assert.doesNotMatch(b.innerHTML, /\p{Extended_Pictographic}/u, 'nada de emoji');
  }
  assert.match(html, /\.btn\.small \{[^}]*min-height: 40px/);
  assert.match(html, /\.btn\.icon \{[^}]*min-width: 40px/);
});

test('sem navigator.share: monta a URL do Google Tradutor com o texto codificado e abre numa aba nova', async () => {
  const ctx = ambiente();
  botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
  await esperar();
  const esperado = normal(SEGS[0].text);
  const a = abas(ctx);
  assert.equal(a.length, 1);
  assert.equal(a[0].href, URL_BASE + encodeURIComponent(esperado));
  assert.equal(a[0].target, '_blank');
  assert.equal(a[0].rel, 'noopener');
  const u = new URL(a[0].href);
  assert.equal(u.origin + u.pathname, 'https://translate.google.com/');
  assert.deepEqual([u.searchParams.get('sl'), u.searchParams.get('tl'), u.searchParams.get('op'), u.searchParams.get('text')], ['en', 'pt', 'translate', esperado]);
  assert.deepEqual(ctx.ativos, ['p1-1']);
  assert.deepEqual(ctx.toasts, []);
});

test('equação, tabela e figura: traduz o rótulo e a legenda', async () => {
  const enviados = [];
  const ctx = ambiente({ toque: true, share: d => { enviados.push(d); return Promise.resolve(); } });
  const els = trechosRenderizados(ctx);
  for (const i of [1, 2, 3, 4]) botaoTraduzir(els[i])[0].click();
  await esperar();
  assert.deepEqual(enviados.map(d => d.text), ['Figure 1. A caption.', '(2.1)', 'Table 3: Sizes & weights', 'Figura']);
});

test('tablet (toque ou Android): chama navigator.share só com o texto e não abre aba', async () => {
  for (const op of [{ toque: true }, { android: true }]) {
    const enviados = [];
    const ctx = ambiente({ ...op, share: d => { enviados.push(d); return Promise.resolve(); } });
    botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
    await esperar();
    assert.equal(enviados.length, 1);
    assert.deepEqual(Object.keys(enviados[0]), ['text']);
    assert.equal(enviados[0].text, normal(SEGS[0].text));
    assert.equal(abas(ctx).length, 0);
    assert.deepEqual(ctx.toasts, []);
  }
});

test('computador sem toque (Edge ou Chrome do Windows têm navigator.share): vai direto ao Google Tradutor', async () => {
  let chamou = 0;
  const ctx = ambiente({ share: () => { chamou++; return Promise.resolve(); } });
  botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
  await esperar();
  assert.equal(chamou, 0);
  assert.equal(abas(ctx).length, 1);
});

test('folha cancelada: com o toque ainda válido abre a aba; com o toque gasto mostra um link para tocar', async () => {
  const cancela = () => Promise.reject(Object.assign(new Error('cancelado'), { name: 'AbortError' }));
  const ok = ambiente({ toque: true, share: cancela, ativo: true });
  botaoTraduzir(trechosRenderizados(ok)[0])[0].click();
  await esperar();
  assert.equal(abas(ok).length, 1);
  const gasto = ambiente({ toque: true, share: cancela, ativo: false });
  botaoTraduzir(trechosRenderizados(gasto)[0])[0].click();
  await esperar();
  assert.equal(abas(gasto).length, 0, 'sem toque válido não tenta abrir (o bloqueador barraria)');
  const aviso = gasto.document.body.children.find(e => e.className === 'toast');
  assert.ok(aviso, 'aviso com link');
  const link = aviso.children[0];
  assert.equal(link.tagName, 'A');
  assert.equal(link.href, URL_BASE + encodeURIComponent(normal(SEGS[0].text)));
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener');
  const lancou = ambiente({ toque: true, share: () => { throw new TypeError('sem suporte'); } });
  botaoTraduzir(trechosRenderizados(lancou)[0])[0].click();
  await esperar();
  assert.equal(abas(lancou).length, 1, 'exceção síncrona do share também cai no Google Tradutor');
});

test('sem rede e sem folha: aviso para usar o Traduzir do Android, sem aba', async () => {
  const ctx = ambiente({ online: false });
  botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
  await esperar();
  assert.deepEqual(ctx.toasts, [SEM_REDE]);
  assert.equal(abas(ctx).length, 0);
  const cancelada = ambiente({ online: false, toque: true, share: () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })) });
  botaoTraduzir(trechosRenderizados(cancelada)[0])[0].click();
  await esperar();
  assert.deepEqual(cancelada.toasts, [SEM_REDE]);
  assert.equal(abas(cancelada).length, 0);
});

test('texto limitado a 4 500 caracteres, sem partir símbolo fora do plano básico', async () => {
  const longo = 'a'.repeat(4499) + '\u{1D465}' + 'b'.repeat(600);
  const enviados = [];
  const ctx = ambiente({ toque: true, share: d => { enviados.push(d); return Promise.resolve(); }, segs: [{ id: 'p1-1', kind: 'text', bbox: [0, 0, 1, 1], text: longo }] });
  botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
  await esperar();
  const t = enviados[0].text;
  assert.equal(Array.from(t).length, 4500);
  assert.ok(t.endsWith('\u{1D465}'));
  assert.doesNotThrow(() => encodeURIComponent(t));
  assert.equal(ctx.textoTraduzir('x\uD835'), 'x�', 'meia letra sozinha vira o caractere de substituição');
  assert.equal(ctx.textoTraduzir('   '), '');
});

test('endereço do Google Tradutor fica abaixo de 15 000 caracteres (o Google recusa acima de ~16 KB)', () => {
  const ctx = ambiente();
  let pesado = ''; while (pesado.length < 5000) pesado += 'ação ≤ ∑ α β ';
  const t = ctx.textoTraduzir(pesado);
  const u = ctx.urlTradutor(t);
  assert.ok(u.length <= 15000, String(u.length));
  const volta = new URL(u).searchParams.get('text');
  assert.ok(volta.length > 1000 && t.startsWith(volta));
  assert.equal(ctx.urlTradutor('abc'), URL_BASE + 'abc');
});

test('trecho vazio não abre nada', async () => {
  const ctx = ambiente({ segs: [{ id: 'p1-1', kind: 'text', bbox: [0, 0, 1, 1], text: '  ' }] });
  botaoTraduzir(trechosRenderizados(ctx)[0])[0].click();
  await esperar();
  assert.equal(abas(ctx).length, 0);
  assert.deepEqual(ctx.toasts, ['Este trecho não tem texto para traduzir']);
});

test('compositor: ícone ao lado do trecho em contexto, visível só quando há trecho', () => {
  assert.match(html, /<div class="ctxrow"><div class="ctx" id="compCtx"><\/div><button class="btn small icon" id="btnCompTrad" type="button" title="Traduzir" aria-label="Traduzir" hidden><\/button><\/div>/);
  assert.match(fonteFuncao('openComposer'), /\$\('btnCompTrad'\)\.hidden = !s;/);
  assert.match(js, /\$\('btnCompTrad'\)\.innerHTML = TRAD_SVG;/);
  assert.match(js, /\$\('btnCompTrad'\)\.addEventListener\('click', function \(\) \{ var s = S\.compose && S\.compose\.seg; if \(s\) traduzir\(segText\(s\)\); \}\);/);
});
