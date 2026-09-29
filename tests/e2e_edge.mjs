// Teste de ponta a ponta no Edge (ou Chrome) sem interface, pelo protocolo DevTools; nenhuma dependência.
// Fase 1 (com rede): abre a casca, espera o service worker, confere o manifest, carrega a tese por arquivo.
// Fase 2 (sem rede): reabre o navegador com a rede cortada, abre pelo cache, grifa, comenta, registra dúvida,
//   marca revisada, apaga um grifo, exporta estado.json, confere o armazenamento e recarrega para ver a persistência.
// Uso:
//   node tests/e2e_edge.mjs --base http://127.0.0.1:8765/ --serve . --pdf <tese.pdf> --trechos <trechos.json> [--manifest <manifest.json>] --out <pasta>
//   node tests/e2e_edge.mjs --base https://<dono>.github.io/mesa-casca/ --pdf <tese.pdf> --trechos <trechos.json> [--repo-dados <dono>/mesa-dados] --out <pasta>
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
  send(method, params = {}, sessionId) { const id = ++this.n; const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId; this.ws.send(JSON.stringify(msg)); return new Promise((res, rej) => this.pend.set(id, { res, rej })); }
}
async function launch(extra = []) {
  const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PERFIL}`, '--no-first-run', '--no-default-browser-check', '--window-size=1400,1000', ...extra, 'about:blank'], { stdio: 'ignore' });
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
  await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable'); await S('Network.enable'); await S('DOM.enable');
  const ev = async (expression) => { const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const waitFor = async (expression, ms = 20000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { try { v = await ev(expression); if (v) return v; } catch { } await sleep(200); } return v; };
  const close = async () => { try { await cdp.send('Browser.close'); } catch { } await sleep(800); try { proc.kill(); } catch { } await sleep(500); };
  return { cdp, S, ev, waitFor, close, erros };
}
const diag = 'window.mesa && window.mesa.diagnostico()';

// página de teste: a primeira depois da 10 com pelo menos dois trechos de texto
const trechos = JSON.parse(readFileSync(args.trechos, 'utf8'));
const alvo = trechos.pages.find(p => p.page > 10 && p.segs.filter(s => s.kind === 'text').length >= 2);
const totalPaginas = trechos.pages.length;

let srv = null;
try {
  // ===== fase 1: com rede =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  let b = await launch();
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
