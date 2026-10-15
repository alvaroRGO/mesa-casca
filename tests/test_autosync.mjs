// Teste da chave «Sincronização automática» (sem rede e sem navegador): node --test tests/test_autosync.mjs
// Roda o sync.js real e o código real do index.html (a chave, os gatilhos da sincronização, o bloco «configuração», o
// boot, acceptTese, syncUi e syncNow) num DOM mínimo de mentira, com um fetch de mentira que registra cada requisição ao
// GitHub e responde 401 (token de mentira): nada sai da máquina e nada da tese entra aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const syncJs = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');
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
const SYNCER = js.match(/var syncer = window\.MesaSync \? MesaSync\.createSync\(\{[\s\S]*?\}\) : null;/);
assert.ok(SYNCER, 'var syncer ausente no index.html');
const FONTE = [syncJs, SYNCER[0], ...['lsGet', 'lsSet', 'nowIso', 'fmtTime', 'hhmm', 'pendingCount', 'syncUi', 'onSyncStatus', 'localSnapshot', 'syncNow', 'acceptTese', 'boot'].map(fonteFuncao),
  bloco('configuração'), bloco('gatilhos da sincronização')].join('\n');

// ---------- DOM de mentira ----------
class El {
  constructor(id) { this.id = id; this.on = {}; this._texto = ''; this.value = ''; this.placeholder = ''; this.className = ''; this.title = ''; this.hidden = false; this.disabled = false; this.checked = false; this.dataset = {}; }
  get textContent() { return this._texto; }
  set textContent(v) { this._texto = String(v); } // como no DOM: sempre texto
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  dispara(t) { (this.on[t] || []).forEach(f => f({ type: t, target: this })); }
  click() { this.dispara('click'); }
}
const GH = 'https://api.github.com/repos/teste/mesa-dados/contents/dados/estado.json';
const pendente = n => ({ id: 'c' + n, pagina: 1, trecho: null, tipo: 'correcao', texto: 'sintético ' + n, criado_em: '2026-10-13T10:0' + n + ':00.000Z', atualizado_em: '2026-10-13T10:0' + n + ':00.000Z', sync: 'pendente' });

// autosync: o valor guardado em mesa.autosync (texto JSON) ou 'ausente'; pendentes: comentários por enviar no aparelho
function ambiente({ autosync = 'ausente', token = 'token-de-teste', pendentes = 2, online = true, visivel = true } = {}) {
  const armazenado = autosync === 'ausente' ? {} : { 'mesa.autosync': autosync };
  const ids = {}, ouvintes = { window: {}, document: {} }, intervalos = [];
  const $ = id => (ids[id] ||= new El(id));
  const ctx = {
    $, ids, ouvintes, intervalos, rede: [], motivos: [], toasts: [], banners: [], escritas: 0,
    localStorage: { getItem: k => (k in armazenado ? armazenado[k] : null), setItem: (k, v) => { armazenado[k] = String(v); }, removeItem: k => { delete armazenado[k]; } }, armazenado,
    navigator: { onLine: online },
    document: { visibilityState: visivel ? 'visible' : 'hidden', addEventListener: (t, f) => { (ouvintes.document[t] ||= []).push(f); } },
    addEventListener: (t, f) => { (ouvintes.window[t] ||= []).push(f); },
    setInterval: (f, ms) => { intervalos.push({ f, ms }); return intervalos.length; },
    setTimeout, clearTimeout, AbortController, TextEncoder, TextDecoder, btoa, atob,
    matchMedia: () => ({ matches: false }), indexedDB: {}, location: { protocol: 'http:', hostname: 'teste' },
    // o GitHub de mentira: registra e responde 401, como o GitHub com um token inválido
    fetch: (url, init) => { ctx.rede.push({ url: String(url), metodo: init && init.method }); return Promise.resolve({ status: 401, ok: false, headers: { get: () => null }, json: () => Promise.resolve({}), text: () => Promise.resolve('') }); },
    S: { ready: false, cfg: { token, repo: 'teste/mesa-dados', tiragem: '' }, syncSt: { estado: 'nunca', em: null, erro: '', running: false },
      comments: Array.from({ length: pendentes }, (_, i) => pendente(i + 1)), grifos: [], revDocs: {}, tombs: { comentarios: {}, grifos: {}, revisadas: {} }, progDoc: null,
      tiragem: 'abcd1234', tiragemInfo: null, page: 1, pdf: null, cont: true },
    TOTAL: 0,
    // o que não é da sincronização fica de mentira
    updateDictate: () => { }, writeProgress: () => { ctx.escritas++; }, applyRemote: () => Promise.resolve(), markSent: () => Promise.resolve(), applyRespostas: () => Promise.resolve(),
    loadVoices: () => { }, banner: m => { if (m) ctx.banners.push(m); }, migrateLocalStorage: () => Promise.resolve(), applyTese: () => { }, lerFiltro: () => 'todos',
    loadMsg: () => { }, sha256hex: () => Promise.resolve(null), baixarTese: () => { },
    // linha de versão e rótulo de versão (fora deste teste)
    aplicaIndice: () => true, linhaAberta: () => 'nucleo', nomeLinha: l => l, VERSAO_MESA: 'teste',
    idb: { open: () => Promise.resolve(), put: () => Promise.resolve(), batch: () => Promise.resolve(),
      get: (s, k) => Promise.resolve(s === 'assets' ? (k === 'tese.pdf' ? new ArrayBuffer(8) : { pages: [{}] }) : null) },
    store: { subscribe: () => { ctx.S.ready = true; ctx.syncUi(); return Promise.resolve(); } }, // como o store real: pronta e a dica desenhada
  };
  ctx.window = ctx;
  ctx.toast = m => ctx.toasts.push(m);
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  ctx.S.autosync = ctx.lerAutosync(); // como no estado S do index.html
  // espião dos motivos que chegam ao sync.js (o resto segue o caminho real, até o fetch de mentira)
  const real = ctx.syncer.syncNow; ctx.syncer.syncNow = r => { ctx.motivos.push(r); return real(r); };
  return ctx;
}
const assentar = async (n = 12) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const rede = ctx => ctx.rede.map(r => r.metodo + ' ' + r.url);
const avisosDesligada = ctx => ctx.toasts.filter(t => /sincronização automática desligada/.test(t));
// os gatilhos como o navegador os dispara
const voltaParaAba = ctx => { ctx.document.visibilityState = 'visible'; ctx.ouvintes.document.visibilitychange.forEach(f => f()); };
const temporizador = ctx => { assert.equal(ctx.intervalos.length, 1); assert.equal(ctx.intervalos[0].ms, 5 * 60 * 1000); ctx.intervalos[0].f(); };
const redeDeVolta = ctx => ctx.ouvintes.window.online.forEach(f => f());
const teseCarregada = ctx => ctx.acceptTese({ pages: [{ page: 1, segs: [] }], sha256: null }, new ArrayBuffer(8), null, 'arquivo');
const salvarCfg = ctx => { ctx.renderCfg(); ctx.$('btnCfgSave').click(); };
const chave = (ctx, on) => { ctx.$('cfgAutosync').checked = on; ctx.$('cfgAutosync').dispara('change'); };

test('chave mesa.autosync: ligada por padrão; só o valor false desliga; inválida vira ligada; a chave em ⚙ grava e mostra', () => {
  const ler = v => ambiente({ autosync: v }).lerAutosync();
  assert.equal(ler('ausente'), true, 'ausente: ligada');
  assert.equal(ler('true'), true);
  assert.equal(ler('false'), false, 'false: desligada');
  for (const ruim of ['"false"', '"desligada"', '0', '1', 'null', '{}', '[]', '[false]', 'não é JSON', ''])
    assert.equal(ler(ruim), true, 'valor ' + JSON.stringify(ruim));
  const bloq = ambiente();
  bloq.localStorage.getItem = () => { throw new Error('bloqueado'); };
  assert.equal(bloq.lerAutosync(), true, 'localStorage bloqueado: ligada');
  assert.match(js, /cont: lerRolagem\(\), autosync: lerAutosync\(\)/, 'lida no estado S, no arranque');
  // no HTML: grupo «Sincronização», rótulo, marcada por padrão e a ajuda de uma linha, na mesma seção
  const sec = html.match(/<section>\s*<h3>Sincronização<\/h3>([\s\S]*?)<\/section>/);
  assert.ok(sec, 'seção «Sincronização» em ⚙');
  assert.match(sec[1], /<label class="chave"><input type="checkbox" id="cfgAutosync" checked> Sincronização automática<\/label>\s*<p class="hint">Desligada, a Mesa só sincroniza quando você toca em Sincronizar\. A fila continua guardada neste aparelho\.<\/p>/);
  // a chave em ⚙: desligar grava false, avisa e não tenta; renderCfg mostra o estado guardado
  const ctx = ambiente();
  ctx.renderCfg();
  assert.equal(ctx.$('cfgAutosync').checked, true, 'ligada por padrão em ⚙');
  chave(ctx, false);
  assert.equal(ctx.S.autosync, false);
  assert.equal(ctx.armazenado['mesa.autosync'], 'false');
  assert.deepEqual([...ctx.toasts], ['Sincronização automática desligada']);
  ctx.renderCfg();
  assert.equal(ctx.$('cfgAutosync').checked, false);
  assert.equal(ambiente({ autosync: ctx.armazenado['mesa.autosync'] }).S.autosync, false, 'a escolha volta ao reabrir');
  chave(ctx, true);
  assert.equal(ctx.armazenado['mesa.autosync'], 'true');
  assert.equal(ctx.toasts.at(-1), 'Sincronização automática ligada');
});

test('desligada: abrir, voltar para a aba e o temporizador (e a rede de volta, a tese carregada e o «Salvar» de ⚙) não chegam ao sync.js nem ao GitHub; ao abrir com fila, um aviso só', async () => {
  const ctx = ambiente({ autosync: 'false', pendentes: 2 });
  ctx.boot(); await assentar();
  assert.equal(ctx.S.ready, true, 'a Mesa abriu');
  assert.deepEqual(ctx.banners, [], 'sem erro no arranque');
  assert.deepEqual(rede(ctx), [], 'abertura: nenhuma requisição');
  assert.deepEqual([...ctx.toasts], ['2 por enviar; sincronização automática desligada'], 'um aviso só ao abrir');
  voltaParaAba(ctx); await assentar();
  temporizador(ctx); await assentar();
  redeDeVolta(ctx); await assentar();
  teseCarregada(ctx); await assentar();
  salvarCfg(ctx); await assentar();
  assert.ok(ctx.toasts.includes('Salvo'), '«Salvar» de ⚙ salvou');
  assert.deepEqual(ctx.motivos, [], 'nenhum gatilho automático chegou ao sync.js');
  assert.deepEqual(rede(ctx), [], 'nenhuma requisição ao GitHub sem toque');
  assert.equal(avisosDesligada(ctx).length, 1, 'o aviso não se repete nos outros gatilhos');
  assert.equal(ctx.$('syncHint').textContent, '2 por enviar · automática desligada');
  // a volta para a aba que esconde a Mesa continua gravando o progresso de leitura (sem rede)
  ctx.document.visibilityState = 'hidden'; ctx.ouvintes.document.visibilitychange.forEach(f => f());
  assert.equal(ctx.escritas, 1);
  // fila vazia: nenhum aviso ao abrir; a dica diz só «automática desligada»
  const vazia = ambiente({ autosync: 'false', pendentes: 0 });
  vazia.boot(); await assentar();
  assert.deepEqual([...vazia.toasts], []);
  assert.deepEqual(rede(vazia), []);
  assert.equal(vazia.$('syncHint').textContent, 'automática desligada');
  // um item por enviar: o singular do aviso
  const um = ambiente({ autosync: 'false', pendentes: 1 });
  um.boot(); await assentar();
  assert.deepEqual([...um.toasts], ['1 por enviar; sincronização automática desligada']);
});

test('ligada (padrão): os gatilhos de hoje, com os mesmos motivos, e cada um uma tentativa ao GitHub', async () => {
  const ctx = ambiente({ pendentes: 2 });
  ctx.boot(); await assentar();
  assert.deepEqual([...ctx.motivos], ['abertura']);
  assert.deepEqual(rede(ctx), ['GET ' + GH], 'abertura: a leitura do estado.json');
  assert.deepEqual(avisosDesligada(ctx), [], 'ligada: sem o aviso');
  voltaParaAba(ctx); await assentar();
  temporizador(ctx); await assentar();
  redeDeVolta(ctx); await assentar();
  teseCarregada(ctx); await assentar();
  salvarCfg(ctx); await assentar();
  assert.deepEqual([...ctx.motivos], ['abertura', 'visivel', 'timer', 'online', 'tese', 'config']);
  assert.deepEqual(rede(ctx), Array(6).fill('GET ' + GH), 'uma tentativa por gatilho (o 401 para antes de gravar)');
  assert.equal(ctx.S.syncSt.estado, 'erro');
  assert.equal(ctx.$('syncHint').textContent, '2 por enviar · erro', 'a dica de hoje');
  // como hoje: aba escondida, sem rede ou temporizador com a aba escondida não tentam
  const n = ctx.rede.length;
  ctx.document.visibilityState = 'hidden'; ctx.ouvintes.document.visibilitychange.forEach(f => f());
  ctx.intervalos[0].f(); await assentar();
  ctx.document.visibilityState = 'visible'; ctx.navigator.onLine = false; ctx.intervalos[0].f(); await assentar();
  assert.equal(ctx.rede.length, n);
  assert.equal(ctx.escritas, 1, 'a aba escondida grava o progresso, como hoje');
});

test('toque em Sincronizar (e em «Sincronizar agora») sempre tenta, com a chave ligada ou desligada; religar tenta na hora', async () => {
  for (const autosync of ['false', 'ausente']) {
    const ctx = ambiente({ autosync });
    ctx.S.ready = true;
    ctx.$('btnSync').click(); await assentar();
    assert.deepEqual([...ctx.motivos], ['botao'], autosync);
    assert.deepEqual(rede(ctx), ['GET ' + GH], autosync + ': o toque chega ao GitHub');
    assert.deepEqual([...ctx.toasts], ['Não sincronizou: token inválido ou expirado: cole um novo em Configuração'], autosync);
    ctx.$('btnSyncNow').click(); await assentar();
    assert.deepEqual([...ctx.motivos], ['botao', 'botao'], autosync + ': «Sincronizar agora» em ⚙');
    assert.equal(ctx.rede.length, 2);
    if (autosync === 'false') assert.equal(ctx.$('syncHint').textContent, '2 por enviar · automática desligada', 'o toque que falha não muda a dica');
  }
  // sem token, como hoje: abre ⚙ e pede o token, sem requisição
  const semToken = ambiente({ autosync: 'false', token: '' });
  semToken.S.ready = true; semToken.$('cfgDrawer').hidden = true;
  semToken.$('btnSync').click(); await assentar();
  assert.deepEqual(rede(semToken), []);
  assert.equal(semToken.$('cfgDrawer').hidden, false);
  assert.deepEqual([...semToken.toasts], ['Cole o token em Configuração para sincronizar']);
  // religar volta ao padrão e sincroniza na hora; desligar não tenta
  const ctx = ambiente({ autosync: 'false' });
  ctx.S.ready = true;
  chave(ctx, true); await assentar();
  assert.deepEqual([...ctx.motivos], ['chave']);
  assert.deepEqual(rede(ctx), ['GET ' + GH]);
  voltaParaAba(ctx); await assentar();
  assert.deepEqual([...ctx.motivos], ['chave', 'visivel'], 'religada: a volta para a aba sincroniza de novo');
  chave(ctx, false); await assentar();
  voltaParaAba(ctx); temporizador(ctx); await assentar();
  assert.deepEqual([...ctx.motivos], ['chave', 'visivel'], 'desligada de novo: nada');
});

test('dica ao lado de Sincronizar: «automática desligada» com a fila vazia e «N por enviar · automática desligada» com fila; ligada, os textos de hoje', () => {
  const ctx = ambiente({ pendentes: 0 });
  const dica = ({ auto, n = 0, token = true, estado = 'nunca', em = null, running = false, online = true }) => {
    ctx.S.autosync = auto; ctx.S.comments = Array.from({ length: n }, (_, i) => pendente(i + 1)); ctx.S.cfg.token = token ? 'token-de-teste' : '';
    ctx.S.syncSt = { estado, em, erro: estado === 'erro' ? 'o GitHub respondeu 500' : '', running }; ctx.navigator.onLine = online;
    ctx.syncUi();
    return [ctx.$('syncHint').textContent, ctx.$('syncHint').className, ctx.$('syncCount').textContent];
  };
  const em = '2026-10-13T13:05:00.000Z', hora = ctx.hhmm(em);
  // desligada
  assert.deepEqual(dica({ auto: false }), ['automática desligada', 'sync-hint', '0']);
  assert.deepEqual(dica({ auto: false, n: 3 }), ['3 por enviar · automática desligada', 'sync-hint', '3']);
  assert.deepEqual(dica({ auto: false, estado: 'ok', em }), ['automática desligada', 'sync-hint', '0'], 'fila vazia depois de um toque que enviou');
  assert.deepEqual(dica({ auto: false, n: 1, token: false }), ['1 por enviar · automática desligada', 'sync-hint', '1']);
  assert.deepEqual(dica({ auto: false, n: 2, online: false }), ['2 por enviar · automática desligada', 'sync-hint', '2']);
  assert.deepEqual(dica({ auto: false, n: 2, running: true, estado: 'erro' }), ['sincronizando…', 'sync-hint', '2'], 'o toque em curso');
  assert.deepEqual(dica({ auto: false, n: 2, estado: 'erro' }), ['2 por enviar · automática desligada', 'sync-hint err', '2'], 'o toque que falhou deixa a dica em vermelho');
  // ligada: os textos de hoje
  assert.deepEqual(dica({ auto: true }), ['nada enviado ainda', 'sync-hint', '0']);
  assert.deepEqual(dica({ auto: true, token: false }), ['nada enviado ainda · sem token', 'sync-hint', '0']);
  assert.deepEqual(dica({ auto: true, n: 2, token: false }), ['2 por enviar · sem token', 'sync-hint', '2']);
  assert.deepEqual(dica({ auto: true, estado: 'ok', em }), ['sincronizado às ' + hora, 'sync-hint', '0']);
  assert.deepEqual(dica({ auto: true, n: 1, online: false, estado: 'offline' }), ['1 por enviar · sem rede', 'sync-hint', '1']);
  assert.deepEqual(dica({ auto: true, n: 1, estado: 'erro' }), ['1 por enviar · erro', 'sync-hint err', '1']);
  assert.deepEqual(dica({ auto: true, n: 1, running: true }), ['sincronizando…', 'sync-hint', '1']);
});

test('invariante: só syncAuto, os toques (clickSync) e window.mesa.sincronizar chamam o syncNow; nenhum gatilho de «focus»', () => {
  const chamadas = (js.match(/syncNow\(/g) || []).length;
  assert.equal(chamadas, 5, 'function syncNow, syncer.syncNow, syncAuto, clickSync e sincronizar');
  assert.match(fonteFuncao('syncNow'), /return syncer\.syncNow\(reason\);/);
  assert.match(fonteFuncao('syncAuto'), /return S\.autosync \? syncNow\(reason\) : Promise\.resolve\(null\);/);
  assert.match(fonteFuncao('clickSync'), /syncNow\('botao'\)/);
  assert.match(js, /sincronizar: function \(\) \{ return syncNow\('manual'\); \}/);
  const auto = [...js.matchAll(/syncAuto\('([a-z]+)'\)/g)].map(m => m[1]).sort();
  assert.deepEqual(auto, ['abertura', 'chave', 'config', 'online', 'tese', 'timer', 'visivel']);
  assert.match(fonteFuncao('boot'), /syncAbertura\(\);/);
  assert.doesNotMatch(js, /addEventListener\('focus'/);
  assert.match(js, /\$\('btnSync'\)\.addEventListener\('click', clickSync\);/);
  assert.match(js, /\$\('btnSyncNow'\)\.addEventListener\('click', function \(\) \{ clickSync\(\); \}\);/);
  // «Carregar tese» continua um toque que baixa do repositório (não passa pela chave)
  assert.doesNotMatch(fonteFuncao('baixarTese'), /autosync|syncAuto/);
});
