// Teste de ponta a ponta no Edge (ou Chrome) sem interface, pelo protocolo DevTools; nenhuma dependência.
// Fase 1 (com rede): abre a casca, espera o service worker, confere o manifest, carrega a tese por arquivo.
//   Ícone «Traduzir»: um por trecho e no compositor; sem folha de compartilhamento abre o Google Tradutor numa aba nova;
//   com a folha (toque emulado) manda só o texto; cancelada, abre a aba ou, com o toque expirado, mostra um link.
//   translate.google.com é desviado para NOTFOUND: nenhum texto da tese sai do PC durante o teste.
//   Recortes, em 1280 px e 740 px com dpr 1 e em 1280 px com dpr 2: na página de equações e na da tabela larga, cada
//   recorte vem da renderização em alta (pelo menos 2 px e dpr px do recorte por px CSS), não passa da largura do cartão,
//   não é esticado (mais estreito fica à esquerda no tamanho de leitura; mais largo é reduzido até caber) e tem tinta;
//   na página do falso positivo, a «equação» curta só de dígitos aparece como texto, com Ler e Traduzir, sem recorte;
//   a cópia em alta é liberada ao ir para uma página sem recortes.
//   Rolagem, em 1280 px (lado a lado) e 740 px (empilhado): a lista de trechos e o PDF rolam cada um no seu quadro
//   (roda do mouse e toque); tocar num trecho da lista centra o realce no PDF sem a lista pular; tocar no PDF centra o
//   trecho na lista sem mover o PDF; «trecho ▶» centra na lista; mudar de página leva os dois ao topo; com o compositor
//   ou a barra «Trecho a trecho», a rolagem máxima da lista deixa o último botão visível; a divisória ajusta os dois.
// Fase 2 (sem rede): reabre o navegador com a rede cortada, abre pelo cache, grifa, comenta, registra dúvida,
//   marca revisada, apaga um grifo, exporta estado.json, confere o armazenamento, recarrega para ver a persistência
//   e confere o aviso do «Traduzir» sem rede.
// Uso:
//   node tests/e2e_edge.mjs --base http://127.0.0.1:8765/ --serve . --pdf <tese.pdf> --trechos <trechos.json> [--manifest <manifest.json>] --out <pasta>
//   node tests/e2e_edge.mjs --base https://<dono>.github.io/mesa-casca/ --pdf <tese.pdf> --trechos <trechos.json> [--repo-dados <dono>/mesa-dados] --out <pasta>
//   [--pag-equacoes N] [--pag-tabela N] [--pag-numero N]: páginas dos recortes (sem elas, escolhidas pelo trechos.json)
// Os caminhos da tese vêm por argumento: nada da tese fica neste repositório.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const BASE = args.base; const OUT = resolve(args.out || './e2e-saida'); const PORT = +(args.port || 9333);
const EDGE = args.edge || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!BASE || !args.pdf || !args.trechos || !EDGE) { console.error('faltam --base, --pdf, --trechos ou o navegador'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const PERFIL = join(OUT, 'perfil'); const DOWN = join(OUT, 'downloads');
rmSync(PERFIL, { recursive: true, force: true }); rmSync(DOWN, { recursive: true, force: true }); mkdirSync(DOWN, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const resultados = []; let falhas = 0;
function check(nome, ok, extra) { resultados.push({ nome, ok: !!ok, extra: extra ?? null }); if (!ok) falhas++; console.log((ok ? 'ok   ' : 'FALHA') + ' ' + nome + (extra != null ? '  ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); }

// ---------- servidor estático (só para --serve) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json' };
function serve(dir, port) {
  const srv = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = join(resolve(dir), p);
    if (!f.startsWith(resolve(dir)) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(readFileSync(f));
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r(srv)));
}

// ---------- DevTools ----------
class CDP {
  constructor(ws) {
    this.ws = ws; this.n = 0; this.pend = new Map(); this.subs = [];
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && this.pend.has(m.id)) { const p = this.pend.get(m.id); this.pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } else if (m.method) this.subs.forEach(f => f(m)); };
  }
  // cada chamada tem 60 s: um navegador travado reprova o teste em vez de pendurá-lo
  send(method, params = {}, sessionId) { const id = ++this.n; const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId; this.ws.send(JSON.stringify(msg)); return new Promise((res, rej) => { const t = setTimeout(() => { this.pend.delete(id); rej(new Error('sem resposta em 60 s: ' + method)); }, 60000); this.pend.set(id, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } }); }); }
}
async function launch(extra = []) {
  // perfil descartável: sem login implícito na conta do Windows, sem sincronização e sem extensões (a extensão sincronizada abria abas e tirava o foco)
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PERFIL}`, '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions', '--disable-component-extensions-with-background-pages', '--disable-features=msImplicitSignin,msEdgeSyncConsent', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1400,1000', ...extra, 'about:blank'], { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); } }
  if (!ver) throw new Error('o navegador não abriu a porta de depuração');
  const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => cdp.send(m, p, sessionId);
  const erros = [];
  cdp.subs.push(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push('console: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.params.entry.url || m.params.entry.text)) erros.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  const abas = [];
  cdp.subs.push(m => {
    if ((m.method !== 'Target.targetCreated' && m.method !== 'Target.targetInfoChanged') || m.params.targetInfo.type !== 'page' || m.params.targetInfo.targetId === targetId) return;
    const t = m.params.targetInfo; let x = abas.find(a => a.id === t.targetId);
    if (!x) { x = { id: t.targetId, urls: [] }; abas.push(x); }
    if (t.url && t.url !== 'about:blank' && x.urls.at(-1) !== t.url) x.urls.push(t.url);
  });
  await cdp.send('Target.setDiscoverTargets', { discover: true });
  await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable'); await S('Network.enable'); await S('DOM.enable');
  const ev = async (expression) => { const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const waitFor = async (expression, ms = 20000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { try { v = await ev(expression); if (v) return v; } catch { } await sleep(200); } return v; };
  const close = async () => { try { await cdp.send('Browser.close'); } catch { } await sleep(800); try { proc.kill(); } catch { } await sleep(500); };
  return { cdp, S, ev, waitFor, close, erros, abas, targetId };
}
const diag = 'window.mesa && window.mesa.diagnostico()';

// falso positivo do extrator (mesma regra do index.html): «equação» curta só com dígitos, pontuação, parênteses e espaços
const ehNumero = s => { const t = String(s.text || '').trim(); return s.kind === 'equation' && t.length < 16 && /\d/.test(t) && /^[\d\s\p{P}]+$/u.test(t); };
const ehRecorte = s => ['equation', 'table', 'figure'].includes(s.kind) && !ehNumero(s);

// ---------- «Traduzir» ----------
const URL_TRAD = 'https://translate.google.com/?sl=en&tl=pt&op=translate&text=';
const KIND = { text: 'Trecho', equation: 'Equação', table: 'Tabela', figure: 'Figura', caption: 'Legenda' };
const textoTrad = s => Array.from(((s.kind === 'text' || s.kind === 'caption' || ehNumero(s)) ? s.text : (s.label || KIND[s.kind]) + (s.caption ? ': ' + s.caption : '')).replace(/\s+/g, ' ').trim()).slice(0, 4500).join('');
const tradDoTrecho = i => `[...document.querySelectorAll('#segs .seg')].filter(e => e.id)[${i}].querySelector('.acts button[title="Traduzir"]')`;
// clique de verdade (mouse), para o navegador contar o toque do usuário como no tablet
async function clicar(b, expr) {
  const p = await b.ev(`(() => { const e = ${expr}; if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); const x = q.left + q.width / 2, y = q.top + q.height / 2; const h = document.elementFromPoint(x, y); return { x, y, topo: !!h && (h === e || e.contains(h)) }; })()`);
  if (!p) return null;
  await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
  await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
  return p;
}
async function esperarAba(b, antes, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (b.abas.length > antes) return b.abas[antes]; await sleep(100); } return null; }
async function fecharAbas(b, antes) { await sleep(300); for (const a of b.abas.splice(antes)) { try { await b.cdp.send('Target.closeTarget', { targetId: a.id }); } catch { } } try { await b.S('Page.bringToFront'); } catch { } await sleep(300); }
const shareFalso = modo => `(() => { window.__partilhas = []; window.__abertas = window.__abertas || []; window.__abertas.length = 0;
  if (!window.__clickOrig) { window.__clickOrig = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { window.__abertas.push({ href: this.href, target: this.target, rel: this.rel }); return window.__clickOrig.call(this); }; }
  const v = { nenhum: undefined, registra: d => { window.__partilhas.push(d); return Promise.resolve(); }, cancela: d => { window.__partilhas.push(d); return Promise.reject(new DOMException('cancelado', 'AbortError')); },
    cancelaDepois: d => { window.__partilhas.push(d); return new Promise((_, rej) => setTimeout(() => rej(new DOMException('cancelado', 'AbortError')), 5600)); } }[${JSON.stringify(modo)}];
  Object.defineProperty(navigator, 'share', { value: v, configurable: true, writable: true }); return true; })()`;

// ---------- recortes de equação, tabela e figura ----------
// cada cartão da página: título, texto, Ler/Traduzir e, se houver recorte, as medidas dele e a fração de pixels escuros
const CARTOES = `[...document.querySelectorAll('#segs .seg')].filter(e => e.id).map(e => {
  const c = e.querySelector('canvas.crop'), cs = getComputedStyle(e), t = e.querySelector('.txt:not(.cap)');
  const base = { id: e.id.slice(4), titulo: e.querySelector('.id span').textContent, txt: t ? t.textContent : null, ler: [...e.querySelectorAll('.acts button')].some(b => b.textContent === 'Ler'), trad: !!e.querySelector('.acts button[title="Traduzir"]') };
  if (!c) return { ...base, crop: false };
  const conteudo = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), esq = e.getBoundingClientRect().left + e.clientLeft + parseFloat(cs.paddingLeft);
  const r = c.getBoundingClientRect(), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let tinta = 0, n = 0;
  for (let k = 0; k < d.length; k += 4 * 101) { n++; if (d[k] < 160 && d[k + 1] < 160 && d[k + 2] < 160) tinta++; }
  return { ...base, crop: true, res: c.dataset.res, px: c.width, pxA: c.height, css: +r.width.toFixed(2), cssA: +r.height.toFixed(2), natural: parseFloat(c.style.width), cartao: +conteudo.toFixed(2), desvioEsq: +(r.left - esq).toFixed(2), tinta: +(tinta / n).toFixed(4), suave: getComputedStyle(c).imageRendering };
})`;
async function testeRecortes(b, larg, alt, dpr, pags, out) {
  const L = larg + ' px, dpr ' + dpr + ': ';
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: dpr, mobile: false });
  await sleep(700);
  for (const [nome, pag] of [['equações', pags.eq], ['tabela larga', pags.tab]]) {
    if (!pag) { check(L + 'página de ' + nome + ' encontrada no trechos.json', false); continue; }
    const esperados = trechos.pages[pag - 1].segs.filter(ehRecorte).length;
    await irPara(b, pag === 1 ? 2 : pag - 1); await irPara(b, pag);
    const pronto = await b.waitFor(`(() => { const cs = [...document.querySelectorAll('#segs canvas.crop')]; return cs.length === ${esperados} && cs.every(c => c.dataset.res === 'alta'); })()`, 20000);
    const cs = (await b.ev(CARTOES)).filter(x => x.crop), rc = (await b.ev(diag)).recorte;
    const razao = cs.map(x => +(x.px / x.css).toFixed(3));
    check(L + nome + ' (p. ' + pag + '): ' + cs.length + ' recorte(s) desenhados da renderização em alta', !!pronto && cs.length === esperados && cs.length > 0 && rc.pagina === pag && rc.escala >= 3 && rc.largura <= 4096, { escala: rc.escala, largura: rc.largura, res: cs.map(x => x.res) });
    check(L + nome + ': nitidez, pelo menos 2 px (e dpr px) do recorte por px CSS exibido', cs.length > 0 && cs.every(x => x.px >= 2 * x.css && x.px >= dpr * x.css), { razao });
    check(L + nome + ': a largura exibida não passa da largura do cartão', cs.length > 0 && cs.every(x => x.css <= x.cartao + 0.5), cs.map(x => [x.css, x.cartao]));
    const estreitos = cs.filter(x => x.natural <= x.cartao), largos = cs.filter(x => x.natural > x.cartao);
    check(L + nome + ': sem esticar (mais estreito: tamanho de leitura, à esquerda; mais largo: reduzido até caber)', cs.length > 0 && estreitos.every(x => Math.abs(x.css - x.natural) <= 0.5 && Math.abs(x.desvioEsq) <= 0.5) && largos.every(x => Math.abs(x.css - x.cartao) <= 0.5), { estreitos: estreitos.map(x => [x.css, x.natural, x.desvioEsq]), largos: largos.map(x => [x.css, x.natural, x.cartao]) });
    check(L + nome + ': proporção mantida, suavizado padrão e conteúdo desenhado', cs.length > 0 && cs.every(x => Math.abs((x.px / x.pxA) / ((x.css - 2) / (x.cssA - 2)) - 1) < 0.02 && x.suave === 'auto' && x.tinta > 0.001), cs.map(x => ({ px: [x.px, x.pxA], css: [x.css, x.cssA], tinta: x.tinta })));
    const q = await b.ev(`(() => { const e = document.querySelector('#segs canvas.crop').closest('.seg'); e.scrollIntoView({ block: 'start' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: Math.min(r.height, innerHeight - r.top) }; })()`);
    const png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...q, scale: 1 } });
    writeFileSync(join(out, 'recorte-p' + pag + '-' + larg + '-dpr' + dpr + '.png'), Buffer.from(png.data, 'base64'));
  }
  // página do falso positivo; se ela não tem recortes, a cópia em alta da página anterior é liberada
  const pn = pags.num, ids = pn ? trechos.pages[pn - 1].segs.filter(ehNumero) : [];
  if (!pn) { check(L + 'página com «equação» curta só de dígitos encontrada no trechos.json', false); return; }
  await irPara(b, pn);
  const cn = await b.ev(CARTOES), alvoN = ids.map(s => ({ s, x: cn.find(x => x.id === s.id) }));
  check(L + 'p. ' + pn + ': «equação» curta só de dígitos aparece como texto (Ler e Traduzir), sem recorte', alvoN.length > 0 && alvoN.every(({ s, x }) => x && !x.crop && x.txt === s.text && x.ler && x.trad && /^Trecho \d+$/.test(x.titulo)), alvoN.map(({ s, x }) => ({ id: s.id, crop: x && x.crop, texto: !!x && x.txt === s.text, ler: x && x.ler, trad: x && x.trad })));
  if (!trechos.pages[pn - 1].segs.some(ehRecorte)) check(L + 'ao ir para uma página sem recortes, a cópia em alta é liberada', (await b.ev(diag)).recorte.pagina === 0 && (await b.ev(`document.querySelectorAll('#segs canvas.crop').length`)) === 0);
  const q = await b.ev(`(() => { const e = document.getElementById(${JSON.stringify('seg-' + ids[0].id)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()`);
  const png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...q, scale: 1 } });
  writeFileSync(join(out, 'numero-p' + pn + '-' + larg + '-dpr' + dpr + '.png'), Buffer.from(png.data, 'base64'));
}

// ---------- rolagem independente da lista de trechos e do PDF ----------
const irPara = async (b, n) => { await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = ${n}; i.dispatchEvent(new Event('change')); })()`); return b.waitFor(`(${diag}).paginaDesenhada === ${n}`, 15000); };
const POS = `(() => { const lw = document.getElementById('listwrap'), cw = document.getElementById('canvaswrap'), se = document.scrollingElement, l = lw.getBoundingClientRect(), c = cw.getBoundingClientRect();
  return { lista: lw.scrollTop, listaMax: lw.scrollHeight - lw.clientHeight, listaTopo: l.top, pdf: cw.scrollTop, pdfMax: cw.scrollHeight - cw.clientHeight, pdfTopo: c.top, janela: se.scrollTop, topo: document.querySelector('.topbar').getBoundingClientRect().top }; })()`;
const DIMS = `(() => { const q = s => document.querySelector(s).getBoundingClientRect(), p = q('.pane.left'), l = q('#listwrap'), c = q('#canvaswrap'), se = document.scrollingElement;
  return { esqL: Math.round(p.width), esqA: Math.round(p.height), listaL: Math.round(l.width), listaA: Math.round(l.height), pdfA: Math.round(c.height), fundo: Math.round(Math.max(c.bottom, l.bottom)), paginaRola: se.scrollHeight > se.clientHeight + 1 }; })()`;
const TRECHOS = `[...document.querySelectorAll('#segs .seg')].filter(e => e.id)`;
// realce ativo centrado no quadro do PDF (ou no limite da rolagem, quando não dá para centrar)
const CENTRO_PDF = `(() => { const hl = document.querySelector('.hl.active'), w = document.getElementById('canvaswrap'); if (!hl) return { realce: false };
  const wr = w.getBoundingClientRect(), hr = hl.getBoundingClientRect(), d = (hr.top - wr.top) - (wr.height - hr.height) / 2, max = w.scrollHeight - w.clientHeight;
  return { realce: true, desvio: Math.round(d), centrado: Math.abs(d) <= 3 || (d < 0 && w.scrollTop <= 1) || (d > 0 && w.scrollTop >= max - 1) }; })()`;
// trecho i centrado no quadro da lista (ou no limite da rolagem)
const CENTRO_LISTA = i => `(() => { const lw = document.getElementById('listwrap'), l = lw.getBoundingClientRect(), e = ${TRECHOS}[${i}], r = e.getBoundingClientRect(), d = (r.top - l.top) - (l.height - r.height) / 2;
  return { ativo: e.classList.contains('active'), desvio: Math.round(d), centrado: Math.abs(d) <= 3 || (d < 0 && lw.scrollTop <= 1) || (d > 0 && lw.scrollTop >= lw.scrollHeight - lw.clientHeight - 1) || (r.height > l.height && Math.abs(r.top - l.top) <= 3) }; })()`;
// o último botão do último trecho: dentro do quadro da lista, acima da barra fixa e sem nada por cima
const ULTIMO_BOTAO = barra => `(() => { const lw = document.getElementById('listwrap'), l = lw.getBoundingClientRect(), u = ${TRECHOS}.at(-1).querySelector('.acts').lastElementChild, r = u.getBoundingClientRect(), bar = document.getElementById('${barra}').getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { naLista: r.top >= l.top - 1 && r.bottom <= l.bottom + 1, acimaDaBarra: r.bottom <= bar.top + 1, livre: !!h && (h === u || u.contains(h)), fim: lw.scrollTop >= lw.scrollHeight - lw.clientHeight - 2, botao: Math.round(r.bottom), barra: Math.round(bar.top), listaVisivel: Math.round(Math.min(l.bottom, bar.top) - l.top) }; })()`;
const ponto = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height / 2, 160)) }; })()`;
const visivel = id => `getComputedStyle(document.getElementById('${id}')).display !== 'none'`;
async function estavel(b, expr, ms = 5000) { let v = await b.ev(expr); const t0 = Date.now(); while (Date.now() - t0 < ms) { await sleep(250); const w = await b.ev(expr); if (JSON.stringify(w) === JSON.stringify(v)) return w; v = w; } return v; }
async function roda(b, p, dy, n) { for (let k = 0; k < n; k++) await b.S('Input.dispatchMouseEvent', { type: 'mouseWheel', x: p.x, y: p.y, deltaX: 0, deltaY: dy }); return estavel(b, POS); }
// arrasto de dedo com toque emulado: dy > 0 desce o dedo (o conteúdo sobe), dy < 0 sobe o dedo; devolve false se o navegador recusar
async function dedo(b, p, dy) {
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  try {
    await b.S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    for (let k = 1; k <= 12; k++) await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: Math.round(p.y + dy * k / 12) }] });
    await b.S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await estavel(b, POS);
    return true;
  } catch { return false; } finally { await b.S('Emulation.setTouchEmulationEnabled', { enabled: false }); }
}
// ponto perto da borda de cima (ou de baixo) de um quadro, para o arrasto do dedo caber na tela
const borda = (sel, topo) => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(), fim = Math.min(r.bottom, innerHeight); return { x: Math.round(r.left + r.width / 2), y: Math.round(${topo} ? r.top + 24 : fim - 24), fim: Math.round(fim) }; })()`;
async function clique(b, x, y) { await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }); }
async function arrasta(b, p, dx, dy) {
  await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let k = 1; k <= 8; k++) await b.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + dx * k / 8, y: p.y + dy * k / 8, button: 'left', buttons: 1 });
  await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x + dx, y: p.y + dy, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(500);
}
async function testeRolagem(b, alvo, larg, alt, out) {
  const L = larg + ' px: ', largo = larg > 900;
  await b.S('Page.bringToFront'); await b.S('Emulation.setFocusEmulationEnabled', { enabled: true });
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: 1, mobile: false });
  await sleep(700);
  await irPara(b, alvo.page + 1); await irPara(b, alvo.page); // começa sem trecho ativo
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page}`, 15000);
  const g = await b.ev(`(() => { const q = s => document.querySelector(s).getBoundingClientRect(), cs = s => getComputedStyle(document.querySelector(s)), se = document.scrollingElement, c = q('#canvaswrap'), l = q('#listwrap'), lw = document.getElementById('listwrap');
    return { ladoALado: l.left >= c.right - 1 && Math.abs(l.top - q('.pageview').top) < 8, empilhado: l.top >= c.bottom - 1, cabem: c.bottom <= innerHeight && l.bottom <= innerHeight, paginaRola: se.scrollHeight > se.clientHeight + 1,
      lista: cs('#listwrap').overflowY + ' ' + cs('#listwrap').overscrollBehaviorY, pdf: cs('#canvaswrap').overflowY + ' ' + cs('#canvaswrap').overscrollBehaviorY, cabecalho: lw.contains(document.getElementById('segTitle')) && lw.contains(document.querySelector('.help')) && lw.contains(document.getElementById('segs')),
      listaAlt: Math.round(l.height), pdfAlt: Math.round(c.height), topoAlt: Math.round(q('.topbar').height), aviso: document.getElementById('banner').hidden ? null : document.getElementById('banner').textContent.slice(0, 60) }; })()`);
  check(L + (largo ? 'PDF e lista lado a lado, os dois cabendo na tela' : 'PDF em cima e lista embaixo, os dois cabendo na tela'), (largo ? g.ladoALado : g.empilhado) && g.cabem, { pdf: g.pdfAlt, lista: g.listaAlt, topo: g.topoAlt, aviso: g.aviso });
  check(L + 'duas áreas de rolagem (overflow auto, overscroll contain), cabeçalho e ajuda dentro da lista, a página não rola', g.lista === 'auto contain' && g.pdf === 'auto contain' && g.cabecalho && !g.paginaRola, { lista: g.lista, pdf: g.pdf });
  // 1. rolar a lista até o último trecho (roda do mouse até o fim e além; depois o dedo, para cima e para baixo além do fim): o PDF não se mexe
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; document.getElementById('canvaswrap').scrollTop = 150; true`);
  const p0 = await estavel(b, POS); const pl = await b.ev(ponto('#listwrap'));
  const p1 = await roda(b, pl, 400, 40);
  const ult = await b.ev(`(() => { const l = document.getElementById('listwrap').getBoundingClientRect(), u = ${TRECHOS}.at(-1).getBoundingClientRect(); return u.bottom <= l.bottom + 1 && u.top < l.bottom; })()`);
  check(L + 'rolar a lista com a roda do mouse até o último trecho não move o PDF', p1.listaMax > 50 && p1.lista >= p1.listaMax - 2 && ult && p0.pdf > 0 && p1.pdf === p0.pdf && p1.pdfTopo === p0.pdfTopo && p1.janela === 0 && p1.topo === p0.topo, { lista: [p0.lista, p1.lista, p1.listaMax], pdf: [p0.pdf, p1.pdf] });
  const lt = await b.ev(borda('#listwrap', true)), lb = await b.ev(borda('#listwrap', false));
  const dl1 = await dedo(b, lt, Math.min(300, lt.fim - lt.y - 8)); const p2 = await estavel(b, POS);
  const dl2 = await dedo(b, lb, -600); const p3 = await estavel(b, POS);
  check(L + 'rolar a lista com o dedo (para cima, e para baixo além do fim) não move o PDF', dl1 && dl2 && p2.lista < p1.lista && p3.lista >= p3.listaMax - 2 && p2.pdf === p0.pdf && p3.pdf === p0.pdf && p2.pdfTopo === p0.pdfTopo && p3.pdfTopo === p0.pdfTopo && p3.janela === 0, { lista: [p1.lista, p2.lista, p3.lista], pdf: [p0.pdf, p2.pdf, p3.pdf] });
  // 2. rolar o PDF (roda até o fim e além; depois o dedo, para cima e para baixo além do fim): a lista não se mexe
  await b.ev(`document.getElementById('canvaswrap').scrollTop = 0; true`);
  const q0 = await estavel(b, POS); const pp = await b.ev(ponto('#canvaswrap'));
  const q1 = await roda(b, pp, 400, 30);
  check(L + 'rolar o PDF com a roda do mouse até o fim não move a lista', q1.pdfMax > 50 && q1.pdf >= q1.pdfMax - 2 && q1.lista === q0.lista && q1.listaTopo === q0.listaTopo && q1.janela === 0, { pdf: [q0.pdf, q1.pdf, q1.pdfMax], lista: [q0.lista, q1.lista] });
  const ct = await b.ev(borda('#canvaswrap', true)), cb = await b.ev(borda('#canvaswrap', false));
  const dp1 = await dedo(b, ct, Math.min(250, ct.fim - ct.y - 8)); const q2 = await estavel(b, POS);
  const dp2 = await dedo(b, cb, -600); const q3 = await estavel(b, POS);
  check(L + 'rolar o PDF com o dedo (para cima, e para baixo além do fim) não move a lista', dp1 && dp2 && q2.pdf < q1.pdf && q3.pdf >= q3.pdfMax - 2 && q2.lista === q0.lista && q3.lista === q0.lista && q3.listaTopo === q0.listaTopo && q3.janela === 0, { pdf: [q1.pdf, q2.pdf, q3.pdf], lista: [q0.lista, q2.lista, q3.lista] });
  // 3. tocar num trecho da lista (o do meio da página): o PDF centra o realce e a lista não pula
  const txt = alvo.segs.map((s, i) => ({ s, i })).filter(x => x.s.kind === 'text');
  const meio = txt.reduce((a, x) => Math.abs((x.s.bbox[1] + x.s.bbox[3]) / 2 / alvo.h - 0.5) < Math.abs((a.s.bbox[1] + a.s.bbox[3]) / 2 / alvo.h - 0.5) ? x : a);
  const segId = JSON.stringify('seg-' + meio.s.id);
  await b.ev(`(() => { const lw = document.getElementById('listwrap'), e = document.getElementById(${segId}); lw.scrollTop += e.getBoundingClientRect().top - lw.getBoundingClientRect().top - 40; document.getElementById('canvaswrap').scrollTop = 0; return true; })()`);
  const t0 = await estavel(b, POS);
  const pt = await b.ev(`(() => { const e = document.getElementById(${segId}), t = e.querySelector('.txt'), r = t.getBoundingClientRect(), x = Math.round(r.left + Math.min(r.width / 2, 120)), y = Math.round(r.top + 10), h = document.elementFromPoint(x, y); return { x, y, topo: e.getBoundingClientRect().top, ok: !!h && (h === t || t.contains(h)) }; })()`);
  await clique(b, pt.x, pt.y); await sleep(300);
  const t1 = await estavel(b, POS); const cp = await b.ev(CENTRO_PDF);
  const e1 = await b.ev(`(() => { const e = document.getElementById(${segId}); return { topo: e.getBoundingClientRect().top, ativo: e.classList.contains('active') }; })()`);
  check(L + 'tocar num trecho da lista centra o realce no PDF sem a lista pular', pt.ok && e1.ativo && cp.realce && cp.centrado && t1.pdf !== t0.pdf && Math.abs(e1.topo - pt.topo) <= 1 && t1.lista === t0.lista && t1.janela === 0, { pdf: [t0.pdf, t1.pdf], desvioPdf: cp.desvio, lista: [t0.lista, t1.lista], trecho: [Math.round(pt.topo), Math.round(e1.topo)] });
  // 4. tocar num trecho no PDF (o mais baixo visível): a lista centra o trecho e o PDF fica parado
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; true`);
  const f0 = await estavel(b, POS);
  const hs = await b.ev(`(() => { const w = document.getElementById('canvaswrap').getBoundingClientRect(), hs = [...document.querySelectorAll('#sheet .hl')]; for (let k = hs.length - 1; k >= 0; k--) { const r = hs[k].getBoundingClientRect(), x = Math.round(r.left + Math.min(r.width / 2, 60)), y = Math.round(r.top + Math.min(r.height / 2, 8)); if (y > w.top + 4 && y < w.bottom - 4 && document.elementFromPoint(x, y) === hs[k]) return { k, x, y }; } return null; })()`);
  if (hs) { await clique(b, hs.x, hs.y); await sleep(300); }
  const f1 = await estavel(b, POS); const cl = hs ? await b.ev(CENTRO_LISTA(hs.k)) : {};
  check(L + 'tocar num trecho no PDF centra o trecho na lista e o PDF fica parado', !!hs && cl.ativo && cl.centrado && f1.lista !== f0.lista && f1.pdf === f0.pdf && f1.pdfTopo === f0.pdfTopo && f1.janela === 0, { trecho: hs && hs.k, desvioLista: cl.desvio, lista: [f0.lista, f1.lista], pdf: [f0.pdf, f1.pdf] });
  // 5. «Trecho a trecho»: «trecho ▶» centra o próximo trecho na lista e o realce no PDF, sem rolar a janela
  await b.ev(`document.getElementById('btnStep').click(); true`);
  await b.waitFor(visivel('stepbar'), 3000);
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; document.getElementById('canvaswrap').scrollTop = 0; true`);
  const s0 = await estavel(b, POS);
  const base = hs ? hs.k : meio.i, volta = base >= alvo.segs.length - 1, k1 = volta ? base - 1 : base + 1;
  const sb = await b.ev(`(() => { const r = document.getElementById('${volta ? 'stepPrev' : 'stepNext'}').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await clique(b, sb.x, sb.y); await sleep(300);
  const s1 = await estavel(b, POS);
  const sl = await b.ev(CENTRO_LISTA(k1)); const sp = await b.ev(CENTRO_PDF);
  check(L + '«trecho ▶» (ou «◀ trecho») centra o trecho seguinte no quadro da lista e o realce no PDF', sl.ativo && sl.centrado && sp.centrado && s1.lista !== s0.lista && s1.janela === 0, { trecho: k1, desvioLista: sl.desvio, desvioPdf: sp.desvio, lista: [s0.lista, s1.lista], pdf: [s0.pdf, s1.pdf] });
  const pls = await b.ev(ponto('#listwrap'));
  await roda(b, pls, 400, 40);
  const ub = await b.ev(ULTIMO_BOTAO('stepbar'));
  const pdfLivre = await b.ev(`document.getElementById('canvaswrap').getBoundingClientRect().bottom <= document.getElementById('stepbar').getBoundingClientRect().top + 1`);
  check(L + 'com «Trecho a trecho», a rolagem máxima da lista deixa o último botão visível acima da barra, que também não cobre o PDF', ub.naLista && ub.acimaDaBarra && ub.livre && ub.fim && pdfLivre, ub);
  await b.ev(`document.getElementById('btnStep').click(); true`);
  // 6. mudar de página: os dois quadros voltam ao topo
  await b.ev(`document.getElementById('listwrap').scrollTop = 400; document.getElementById('canvaswrap').scrollTop = 200; true`);
  const m0 = await estavel(b, POS);
  const nb = await b.ev(`(() => { const r = document.getElementById('btnNext').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await clique(b, nb.x, nb.y);
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page + 1}`, 15000);
  const m1 = await estavel(b, POS);
  check(L + 'mudar de página leva a lista e o PDF ao topo', m0.lista > 0 && m0.pdf > 0 && m1.lista === 0 && m1.pdf === 0 && m1.janela === 0, { antes: [m0.lista, m0.pdf], depois: [m1.lista, m1.pdf] });
  await irPara(b, alvo.page);
  // 7. compositor aberto: a rolagem máxima da lista deixa o último botão visível acima dele
  await b.ev(`(() => { const x = [...${TRECHOS}[0].querySelectorAll('.acts button')].find(b => b.textContent === 'Comentar'); x.click(); return true; })()`);
  await b.waitFor(visivel('composer'), 3000); await sleep(300);
  const pc = await b.ev(`(() => { const l = document.getElementById('listwrap').getBoundingClientRect(), c = document.getElementById('composer').getBoundingClientRect(); return { x: Math.round(l.left + l.width / 2), y: Math.round(l.top + Math.min(40, (Math.min(l.bottom, c.top) - l.top) / 2)) }; })()`);
  await roda(b, pc, 400, 40);
  const uc = await b.ev(ULTIMO_BOTAO('composer'));
  const pdfC = await b.ev(`(() => { const c = document.getElementById('canvaswrap').getBoundingClientRect(), k = document.getElementById('composer').getBoundingClientRect(); return { alt: Math.round(c.height), livre: c.right <= k.left + 1 || c.bottom <= k.top + 1 }; })()`);
  check(L + 'com o compositor aberto, a rolagem máxima da lista deixa o último botão visível acima dele (e o PDF continua à vista)', uc.naLista && uc.acimaDaBarra && uc.livre && uc.fim && uc.listaVisivel >= 100 && pdfC.livre && pdfC.alt >= 80, { ...uc, pdf: pdfC });
  const shot = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'rolagem-' + larg + '-compositor.png'), Buffer.from(shot.data, 'base64'));
  await b.ev(`document.getElementById('btnCompCancel').click(); true`);
  await sleep(300);
  const g2 = await b.ev(DIMS);
  check(L + 'ao fechar o compositor, a lista e o PDF voltam à altura de antes', Math.abs(g2.listaA - g.listaAlt) <= 1 && Math.abs(g2.pdfA - g.pdfAlt) <= 1 && !g2.paginaRola, { lista: [g.listaAlt, g2.listaA], pdf: [g.pdfAlt, g2.pdfA] });
  // 8. divisória: largura no leiaute largo, altura do PDF no empilhado; os dois quadros se ajustam
  const dv = await b.ev(`(() => { const r = document.getElementById('divider').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const d0 = await b.ev(DIMS); const dx = largo ? 90 : 0, dy = largo ? 0 : -70;
  await arrasta(b, dv, dx, dy);
  const d1 = await b.ev(DIMS);
  const okDiv = largo
    ? Math.abs(d1.esqL - d0.esqL - dx) <= 3 && Math.abs(d0.listaL - d1.listaL - dx) <= 3 && d1.listaA === d0.listaA && d1.pdfA === d0.pdfA
    : Math.abs(d1.pdfA - d0.pdfA - dy) <= 3 && Math.abs(d0.listaA - d1.listaA - dy) <= 3 && Math.abs(d1.pdfA + d1.listaA - d0.pdfA - d0.listaA) <= 2;
  check(L + (largo ? 'divisória muda a largura; PDF e lista mantêm a altura inteira' : 'divisória muda a altura do PDF; a lista ocupa o resto'), okDiv && d1.fundo === d0.fundo && !d1.paginaRola, { antes: d0, depois: d1 });
  await arrasta(b, { x: dv.x + dx, y: dv.y + dy }, -dx, -dy);
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page}`, 15000);
  const shot2 = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'rolagem-' + larg + '.png'), Buffer.from(shot2.data, 'base64'));
}

// página de teste: a primeira depois da 10 com pelo menos dois trechos de texto
const trechos = JSON.parse(readFileSync(args.trechos, 'utf8'));
const alvo = trechos.pages.find(p => p.page > 10 && p.segs.filter(s => s.kind === 'text').length >= 2);
const totalPaginas = trechos.pages.length;
// páginas dos recortes: as do argumento ou, sem ele, a primeira com duas equações, a da tabela mais larga e a primeira com falso positivo
const larguraTabela = p => Math.max(0, ...p.segs.filter(s => s.kind === 'table' && s.bbox).map(s => s.bbox[2] - s.bbox[0]));
const PAGS = {
  eq: +args['pag-equacoes'] || (trechos.pages.find(p => p.segs.filter(s => ehRecorte(s) && s.kind === 'equation').length >= 2) || {}).page,
  tab: +args['pag-tabela'] || trechos.pages.reduce((a, p) => (larguraTabela(p) > larguraTabela(a) ? p : a), trechos.pages[0]).page,
  num: +args['pag-numero'] || (trechos.pages.find(p => p.segs.some(ehNumero)) || {}).page,
};

let srv = null;
try {
  // ===== fase 1: com rede =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  let b = await launch(['--host-resolver-rules=MAP translate.google.com ~NOTFOUND']);
  await b.S('Page.navigate', { url: BASE });
  check('a Mesa abre e lê o IndexedDB', await b.waitFor(`${diag} && window.mesa.diagnostico().pronta`));
  const vis = id => `getComputedStyle(document.getElementById('${id}')).display !== 'none'`;
  check('sem tese, abre a tela «Carregar tese»', await b.ev(`${vis('cfgDrawer')} && document.getElementById('cfgTitle').textContent`) === 'Carregar tese');
  check('gavetas, compositor e barra de trecho ocultos na abertura', await b.ev(`!(${vis('drawer')}) && !(${vis('pagesDrawer')}) && !(${vis('composer')}) && !(${vis('stepbar')})`));
  check('service worker ativo e controlando a página', await b.waitFor(`navigator.serviceWorker.ready.then(() => !!navigator.serviceWorker.controller)`, 15000) || await (async () => { await b.S('Page.reload'); return b.waitFor(`!!navigator.serviceWorker.controller`, 15000); })());
  const man = await b.S('Page.getAppManifest');
  check('manifest lido sem erros', man.errors.length === 0 && /Mesa de Revisão/.test(man.data || ''), man.errors);
  try { const ie = await b.S('Page.getInstallabilityErrors'); check('instalável (critérios do navegador)', ie.installabilityErrors.length === 0, ie.installabilityErrors.map(e => e.errorId)); } catch (e) { check('instalável (critérios do navegador)', false, 'não consultado: ' + e.message); }
  if (args['repo-dados']) {
    // o sync.js real contra api.github.com com um token de mentira: tem de voltar 401 legível (CORS aceito) e manter a fila
    const r401 = await b.ev(`(async () => { const st = []; const s = MesaSync.createSync({ getConfig: () => ({ token: 'token-invalido-de-teste', repo: ${JSON.stringify(args['repo-dados'])} }), getLocal: () => ({ comentarios: [{ id: 'cT', pagina: 1, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z', sync: 'pendente' }], grifos: [], revisadas: [], progresso: null }), applyLocal: () => {}, markSent: () => {}, applyRespostas: () => {}, onStatus: x => st.push(x), isOnline: () => true }); const r = await s.syncNow('teste'); return { status: r.status, ok: r.ok, msg: st.at(-1) && st.at(-1).msg }; })()`);
    check('API do GitHub alcançável pelo navegador (CORS) e 401 tratado sem perder a fila', r401.status === 401 && r401.ok === false && /token inválido/.test(r401.msg || ''), r401);
  }
  const cacheN = await b.waitFor(`caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys())))).then(a => a.flat().length)`, 10000);
  check('casca no cache do service worker', cacheN >= 8, cacheN + ' entradas');
  const { root } = await b.S('DOM.getDocument', {});
  const { nodeId } = await b.S('DOM.querySelector', { nodeId: root.nodeId, selector: '#fileInput' });
  await b.S('DOM.setFileInputFiles', { nodeId, files: [resolve(args.pdf), resolve(args.trechos), ...(args.manifest ? [resolve(args.manifest)] : [])] });
  check('tese carregada por arquivo (SHA-256 conferido) e página desenhada', await b.waitFor(`(${diag}).tese && (${diag}).paginaDesenhada > 0`, 30000));
  const d1 = await b.ev(diag);
  check('total de páginas vem do trechos.json', d1.total === totalPaginas, d1.total);
  check('subtítulo com a tiragem', /^Tiragem [0-9a-f]{8}( de \d\d\/\d\d\/\d{4})?, \d+ páginas$/.test(await b.ev(`document.getElementById('subtitle').textContent`)), await b.ev(`document.getElementById('subtitle').textContent`));
  // ----- ícone «Traduzir», com rede -----
  await b.waitFor(`!(${vis('cfgDrawer')})`, 5000);
  await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = ${alvo.page}; i.dispatchEvent(new Event('change')); })()`);
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page}`, 15000);
  const iTexto = alvo.segs.findIndex(s => s.kind === 'text'); const esperado = textoTrad(alvo.segs[iTexto]);
  const tr = await b.ev(`[...document.querySelectorAll('#segs .seg')].filter(e => e.id).map(e => { const bs = [...e.querySelectorAll('.acts button[title="Traduzir"]')]; const r = bs[0] ? bs[0].getBoundingClientRect() : {}; return { n: bs.length, aria: bs[0] && bs[0].getAttribute('aria-label'), svg: !!(bs[0] && bs[0].querySelector('svg')), texto: bs[0] ? bs[0].textContent : null, w: r.width, h: r.height }; })`);
  check('ícone Traduzir em cada trecho da página (title, aria-label, SVG, sem texto)', tr.length === alvo.segs.length && tr.every(x => x.n === 1 && x.aria === 'Traduzir' && x.svg && x.texto === ''), { trechos: tr.length, esperados: alvo.segs.length });
  check('ícone com área de toque de pelo menos 40 × 40 px', tr.length > 0 && tr.every(x => x.w >= 40 && x.h >= 40), tr[0] && { w: tr[0].w, h: tr[0].h });
  for (const tema of ['light', 'dark']) {
    await b.S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema }] });
    const q = await b.ev(`(() => { const a = ${tradDoTrecho(iTexto)}.parentElement; a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()`);
    const png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...q, scale: 2 } });
    writeFileSync(join(OUT, 'icone-traduzir-' + tema + '.png'), Buffer.from(png.data, 'base64'));
  }
  await b.S('Emulation.setEmulatedMedia', { features: [] });
  // sem navigator.share (PC): Google Tradutor numa aba nova
  await b.ev(shareFalso('nenhum'));
  let antes = b.abas.length;
  const c1 = await clicar(b, tradDoTrecho(iTexto));
  await b.waitFor('window.__abertas.length', 3000);
  const ab = await b.ev('window.__abertas[0] || null');
  const abTexto = ab && new URL(ab.href).searchParams.get('text');
  check('sem navigator.share: monta a URL do Google Tradutor com o texto do trecho codificado', !!c1 && c1.topo && ab && ab.href.startsWith(URL_TRAD) && abTexto === esperado && ab.target === '_blank' && ab.rel === 'noopener', ab && { url: ab.href.length + ' caracteres', target: ab.target, rel: ab.rel, texto: abTexto === esperado });
  const nova = await esperarAba(b, antes);
  check('a aba nova abre (não cai no bloqueador de pop-up)', !!nova && (nova.urls.length === 0 || nova.urls.some(u => u.startsWith('https://translate.google.com/'))), nova && (nova.urls.at(-1) || '').split('text=')[0]);
  await fecharAbas(b, antes);
  // tablet: toque emulado e folha de compartilhamento
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const coarse = await b.ev(`matchMedia('(any-pointer: coarse)').matches`);
  await b.ev(shareFalso('registra'));
  antes = b.abas.length;
  await clicar(b, tradDoTrecho(iTexto));
  await b.waitFor('window.__partilhas.length', 3000);
  const sh = await b.ev('window.__partilhas');
  check('tablet (toque): navigator.share recebe só o texto do trecho', coarse && sh.length === 1 && Object.keys(sh[0]).join() === 'text' && sh[0].text === esperado, { coarse, chamadas: sh.length });
  await sleep(700);
  check('com a folha de compartilhamento, nenhuma aba é aberta', b.abas.length === antes && (await b.ev('window.__abertas.length')) === 0);
  await b.ev(shareFalso('cancela'));
  antes = b.abas.length;
  await clicar(b, tradDoTrecho(iTexto));
  const nova2 = await esperarAba(b, antes);
  check('folha cancelada com o toque ainda válido: abre o Google Tradutor', !!nova2 && (await b.ev('window.__partilhas.length')) === 1 && (await b.ev('window.__abertas.length')) === 1);
  await fecharAbas(b, antes);
  await b.ev(shareFalso('cancelaDepois'));
  antes = b.abas.length;
  await clicar(b, tradDoTrecho(iTexto));
  const linkOk = await b.waitFor(`(() => { const a = document.querySelector('.toast a'); return !!a && a.target === '_blank' && a.rel === 'noopener' && new URL(a.href).searchParams.get('text') === ${JSON.stringify(esperado)}; })()`, 9000);
  check('folha cancelada depois de o toque expirar: aviso com link, sem aba bloqueada', linkOk && b.abas.length === antes && (await b.ev('window.__abertas.length')) === 0);
  const c3 = await clicar(b, `document.querySelector('.toast a')`);
  const nova3 = await esperarAba(b, antes);
  check('tocar no link do aviso abre o Google Tradutor', !!c3 && c3.topo && !!nova3);
  await fecharAbas(b, antes);
  // compositor
  await b.ev(shareFalso('registra'));
  await b.ev(`(() => { const x = [...[...document.querySelectorAll('#segs .seg')].filter(e => e.id)[${iTexto}].querySelectorAll('.acts button')].find(b => b.textContent === 'Comentar'); x.click(); return true; })()`);
  const cb = await b.ev(`(() => { const e = document.getElementById('btnCompTrad'); const r = e.getBoundingClientRect(); const c = document.getElementById('compCtx').getBoundingClientRect(); return { vis: getComputedStyle(e).display !== 'none', w: r.width, h: r.height, aoLado: r.left >= c.right && Math.abs(r.top - c.top) < 30, t: e.getAttribute('title'), a: e.getAttribute('aria-label'), svg: !!e.querySelector('svg') }; })()`);
  check('compositor: ícone Traduzir ao lado do trecho em contexto', cb.vis && cb.aoLado && cb.w >= 40 && cb.h >= 40 && cb.t === 'Traduzir' && cb.a === 'Traduzir' && cb.svg, cb);
  const png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, 'compositor-traduzir.png'), Buffer.from(png.data, 'base64'));
  await clicar(b, `document.getElementById('btnCompTrad')`);
  await b.waitFor('window.__partilhas.length', 3000);
  check('compositor: o ícone traduz o trecho em contexto', (await b.ev('window.__partilhas[0] && window.__partilhas[0].text')) === esperado);
  await b.ev(`document.getElementById('btnCompCancel').click(); document.getElementById('btnPageComment').click(); true`);
  check('compositor da página inteira (sem trecho): ícone oculto', await b.ev(`${vis('composer')} && getComputedStyle(document.getElementById('btnCompTrad')).display === 'none'`));
  await b.ev(`document.getElementById('btnCompCancel').click(); true`);
  // equação, tabela ou figura: rótulo e legenda
  const pNT = trechos.pages.find(p => p.segs.some(s => ehRecorte(s) && s.caption));
  if (pNT) {
    const iNT = pNT.segs.findIndex(s => ehRecorte(s) && s.caption);
    await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = ${pNT.page}; i.dispatchEvent(new Event('change')); })()`);
    await b.waitFor(`(${diag}).paginaDesenhada === ${pNT.page}`, 15000);
    await b.ev(shareFalso('registra'));
    await clicar(b, tradDoTrecho(iNT));
    await b.waitFor('window.__partilhas.length', 3000);
    check('equação, tabela ou figura: traduz o rótulo e a legenda', (await b.ev('window.__partilhas[0] && window.__partilhas[0].text')) === textoTrad(pNT.segs[iNT]), pNT.segs[iNT].kind + ' da página ' + pNT.page);
  }
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: false });
  await b.ev('delete navigator.share');
  // ----- recortes de equação, tabela e figura em alta resolução -----
  for (const [larg, alt, dpr] of [[1280, 900, 1], [740, 1000, 1], [1280, 800, 2]]) await testeRecortes(b, larg, alt, dpr, PAGS, OUT);
  // ----- rolagem independente da lista de trechos e do PDF, nos dois leiautes -----
  for (const [larg, alt] of [[1280, 900], [740, 1000]]) await testeRolagem(b, alvo, larg, alt, OUT);
  await b.S('Emulation.clearDeviceMetricsOverride');
  await sleep(700);
  const persist = await b.ev(`navigator.storage.persist().then(p => p)`);
  check('navigator.storage.persist() chamado (resultado informativo)', true, persist);
  const erros1 = b.erros.slice();
  await b.close();
  if (srv) { await new Promise(r => srv.close(r)); srv = null; }

  // ===== fase 2: sem rede =====
  b = await launch(['--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1']);
  await b.S('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await b.cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWN, eventsEnabled: true });
  await b.S('Page.navigate', { url: BASE });
  check('sem rede: a Mesa reabre pelo cache', await b.waitFor(`${diag} && (${diag}).pronta && (${diag}).tese && (${diag}).paginaDesenhada > 0`, 30000));
  check('com a tese guardada, abre direto na leitura (sem a tela de carga)', await b.ev(`!(${vis('cfgDrawer')}) && !(${vis('composer')})`));
  check('navigator.onLine é falso', await b.ev('navigator.onLine') === false);
  check('indicador mostra que está sem token', /sem token/.test(await b.ev(`document.getElementById('syncHint').textContent`)), await b.ev(`document.getElementById('syncHint').textContent`));
  await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = ${alvo.page}; i.dispatchEvent(new Event('change')); })()`);
  check('navega até a página ' + alvo.page, await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page}`, 15000));
  // grifo à mão livre com o mouse
  await b.ev(`document.getElementById('btnMarker').click()`);
  const r = await b.ev(`JSON.stringify(document.getElementById('sheet').getBoundingClientRect())`).then(JSON.parse);
  const seg = alvo.segs.find(s => s.kind === 'text');
  const fy = ((seg.bbox[1] + seg.bbox[3]) / 2) / alvo.h, fx0 = seg.bbox[0] / alvo.w + 0.01, fx1 = Math.min(seg.bbox[2] / alvo.w, fx0 + 0.4);
  const X = f => r.left + f * r.width, Y = r.top + fy * r.height;
  await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: X(fx0), y: Y, button: 'left', buttons: 1, clickCount: 1 });
  for (let k = 1; k <= 12; k++) await b.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: X(fx0 + (fx1 - fx0) * k / 12), y: Y, button: 'left', buttons: 1 });
  await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: X(fx1), y: Y, button: 'left', buttons: 0, clickCount: 1 });
  await b.ev(`document.getElementById('btnMarker').click()`);
  check('grifo à mão livre salvo', await b.waitFor(`(${diag}).grifos === 1`, 5000), await b.ev(diag + '.grifos'));
  // grifo do trecho pelo botão e comentário
  const clickSegBtn = (label, i = 0) => b.ev(`(() => { const bs = [...document.querySelectorAll('#segs .seg')].filter(e => e.id)[${i}].querySelectorAll('.acts button'); const x = [...bs].find(b => b.textContent === ${JSON.stringify(label)}); if (!x) return false; x.click(); return true; })()`);
  check('botão Grifar do trecho', await clickSegBtn('Grifar', 1) && await b.waitFor(`(${diag}).grifos === 2`, 5000));
  check('botão Comentar abre o compositor', await clickSegBtn('Comentar') && await b.ev(vis('composer')));
  check('botão Ditar oculto sem rede', await b.ev(`document.getElementById('btnDictate').hidden`));
  await b.ev(`document.getElementById('compText').value = 'Comentário de teste sem rede'; document.getElementById('btnCompSave').click()`);
  check('comentário salvo', await b.waitFor(`(${diag}).comentarios === 1`, 5000));
  check('botão Dúvida grava comentário do tipo dúvida', await clickSegBtn('Dúvida') && await b.ev(`document.getElementById('btnCompSave').textContent`) === 'Salvar dúvida');
  await b.ev(`document.getElementById('compText').value = 'Dúvida de teste'; document.getElementById('btnCompSave').click()`);
  check('dúvida salva', await b.waitFor(`(${diag}).comentarios === 2`, 5000));
  await b.ev(`document.getElementById('btnReviewed').click()`);
  check('página marcada como revisada', await b.waitFor(`(${diag}).revisadas === 1`, 5000));
  await clickSegBtn('Grifado ✓', 1); await sleep(200); await clickSegBtn('retirar grifo?', 1);
  check('grifo do trecho retirado (vira tombstone)', await b.waitFor(`(${diag}).grifos === 1`, 5000));
  const d2 = await b.ev(diag);
  check('fila «por enviar» conta itens e remoções', d2.porEnviar === 5, d2.porEnviar);
  check('indicador «N por enviar»', /^5 por enviar/.test(await b.ev(`document.getElementById('syncHint').textContent`)), await b.ev(`document.getElementById('syncHint').textContent`));
  const lote = await b.ev(`(() => { let t = ''; const orig = navigator.clipboard && navigator.clipboard.writeText; return new Promise(res => { navigator.clipboard.writeText = x => { t = x; res(t); return Promise.resolve(); }; document.getElementById('btnCopy').click(); setTimeout(() => res(t), 1500); }); })()`);
  writeFileSync(join(OUT, 'lote.txt'), lote || '');
  check('Copiar lote gera o texto do lote', /^LOTE DE REVISÃO, tiragem [0-9a-f]{8}( \(\d\d\/\d\d\/\d{4}\))?, gerado em /.test(lote || '') && /Comentários: 2\. Grifos sem comentário: 1\./.test(lote), (lote || '').split('\n').slice(0, 2).join(' | '));
  await b.ev(`document.getElementById('btnExport2').click()`);
  let arq = null; for (let i = 0; i < 40 && !arq; i++) { await sleep(250); arq = readdirSync(DOWN).find(f => /^estado-.*\.json$/.test(f)); }
  let est = null; try { est = arq && JSON.parse(readFileSync(join(DOWN, arq), 'utf8')); } catch { }
  check('Exportar estado.json baixa o arquivo', !!est, arq);
  check('estado.json exportado tem 2 comentários, 1 grifo, 1 revisada, 1 tombstone', est && est.comentarios.length === 2 && est.grifos.length === 1 && est.revisadas.length === 1 && est.tombstones.length === 1, est && { c: est.comentarios.length, g: est.grifos.length, r: est.revisadas.length, t: est.tombstones.length });
  check('documentos com os campos da Mesa v2.1 mais atualizado_em e sync', est && ['id', 'pagina', 'trecho', 'grifo', 'tipo_trecho', 'y', 'texto_trecho', 'criado_em', 'estado', 'tiragem', 'tipo', 'texto', 'atualizado_em', 'sync'].every(k => k in est.comentarios[0]) && est.comentarios.some(c => c.tipo === 'duvida'));
  const uso = await b.ev(`navigator.storage.estimate().then(e => ({ usoMB: +(e.usage / 1048576).toFixed(2), detalhe: e.usageDetails || null }))`);
  check('tamanho do armazenamento (IndexedDB + cache)', uso.usoMB > 3, uso);
  await b.ev(`document.getElementById('btnSync').click()`);
  check('Sincronizar sem token abre a Configuração', await b.waitFor(vis('cfgDrawer'), 3000));
  await b.ev('window.__antes = 1');
  await b.S('Page.reload', { ignoreCache: false });
  await b.waitFor('!window.__antes', 10000);
  check('sem rede: recarrega e mantém as anotações', await b.waitFor(`${diag} && (${diag}).pronta && (${diag}).tese && (${diag}).comentarios === 2 && (${diag}).grifos === 1 && (${diag}).revisadas === 1 && (${diag}).porEnviar === 5`, 30000), await b.ev(diag).catch(e => e.message));
  check('página atual preservada', (await b.ev(diag)).pagina === alvo.page);
  check('depois de recarregar, gavetas fechadas', await b.ev(`!(${vis('cfgDrawer')}) && !(${vis('drawer')}) && !(${vis('composer')})`));
  await b.ev(shareFalso('nenhum'));
  const antesOff = b.abas.length;
  await clicar(b, tradDoTrecho(alvo.segs.findIndex(s => s.kind === 'text')));
  const avisoOff = await b.waitFor(`[...document.querySelectorAll('.toast')].map(t => t.textContent).find(t => /Traduzir do Android/.test(t)) || ''`, 3000);
  check('sem rede e sem folha: aviso «Sem rede: selecione o texto e use Traduzir do Android»', avisoOff === 'Sem rede: selecione o texto e use Traduzir do Android', avisoOff);
  await sleep(600);
  check('sem rede: o Traduzir não abre aba', b.abas.length === antesOff && (await b.ev('window.__abertas.length')) === 0);
  const shot = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, 'tela-offline.png'), Buffer.from(shot.data, 'base64'));
  const erros = erros1.concat(b.erros).filter(e => !/ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|fonts\.googleapis|Failed to load resource/.test(e));
  check('sem exceções de JavaScript', erros.length === 0, erros.slice(0, 5));
  await b.close();
} catch (e) {
  check('execução do teste', false, e.stack || String(e));
} finally {
  if (srv) srv.close();
}
writeFileSync(join(OUT, 'resultado.json'), JSON.stringify({ base: BASE, navegador: EDGE, quando: new Date().toISOString(), falhas, resultados }, null, 2));
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : `\nfim-a-fim aprovado (${resultados.length} verificações)`);
process.exit(falhas ? 1 : 0);
