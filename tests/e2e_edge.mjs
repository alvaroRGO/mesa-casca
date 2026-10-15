// Teste de ponta a ponta no Edge (ou Chrome) sem interface, pelo protocolo DevTools; nenhuma dependência.
// Fase 1 (com rede): abre a casca, espera o service worker, confere o manifest, carrega a tese por arquivo.
//   Ícone «Traduzir»: um por trecho e no compositor; sem folha de compartilhamento abre o Google Tradutor numa aba nova;
//   com a folha (toque emulado) manda só o texto; cancelada, abre a aba ou, com o toque expirado, mostra um link.
//   translate.google.com é desviado para NOTFOUND: nenhum texto da tese sai do PC durante o teste.
//   «Ditar», com um reconhecimento de fala de mentira que imita o Chrome do Android (o Edge sem interface não reconhece
//   fala): o botão fica ao lado da caixa e a dica fixa embaixo; vira «Parar» com o ponto vermelho; a parcial fica na
//   linha cinza e nunca na caixa; finais repetidas entram uma vez; o fim prematuro da sessão recomeça; «Parar» entrega a
//   última frase e não recomeça; «no-speech» recomeça em silêncio; permissão negada esconde o botão e avisa.
//   Recortes, em 1280 px e 740 px com dpr 1 e em 1280 px com dpr 2: na página de equações e na da tabela larga, cada
//   recorte vem da renderização em alta (pelo menos 2 px e dpr px do recorte por px CSS), não passa da largura do cartão,
//   não é esticado (mais estreito fica à esquerda no tamanho de leitura; mais largo é reduzido até caber) e tem tinta;
//   na página do falso positivo, a «equação» curta só de dígitos aparece como texto, com Ler e Traduzir, sem recorte;
//   a cópia em alta é liberada ao ir para uma página sem recortes. Tiragem sem falso positivo e sem --pag-numero: a
//   verificação dele sai «não se aplica» (não conta como ok nem como falha; o caso segue em tests/test_recortes.mjs) e a
//   liberação da cópia em alta é conferida na primeira página de texto sem recortes.
//   Rolagem, em 1280 px (lado a lado) e 740 px (empilhado), nos dois modos do PDF (rolagem contínua e, pela chave em ⚙,
//   uma página por vez): a lista de trechos e o PDF rolam cada um no seu quadro (roda do mouse e toque); tocar num trecho
//   da lista centra o realce no PDF sem a lista pular; tocar no PDF centra o trecho na lista sem mover o PDF; «trecho ▶»
//   centra na lista; mudar de página leva a lista ao topo e a folha da página nova ao topo do quadro; com o compositor ou
//   a barra «Trecho a trecho», a rolagem máxima da lista deixa o último botão visível; a divisória ajusta os dois.
// Fase 2 (sem rede): reabre o navegador com a rede cortada, abre pelo cache, grifa, comenta, registra dúvida,
//   marca revisada, apaga um grifo, exporta estado.json, confere o armazenamento, recarrega para ver a persistência
//   e confere o aviso do «Traduzir» sem rede.
//   Filtro de comentários, em 1280 px e 740 px: com comentários respondidos de teste gravados no IndexedDB (ids de trecho
//   do trechos.json e um id ausente na tiragem), os três botões da gaveta com os totais em texto; lista, número do botão,
//   gaveta e pontos do PDF obedecendo a «Todos», «Sem resposta» e «Respondidos»; «Mostrar N» no fim da lista (sem contar
//   o de trecho ausente) volta a «Todos»; mapa de páginas com anel cinza na página só com respondidos; «Copiar lote» e o
//   diagnóstico com tudo; o filtro sobrevive a recarregar; salvar com «Respondidos» avisa e não troca o filtro.
// Fase R (com rede, perfil próprio, CPU 4 vezes mais lenta): rolagem contínua do PDF em 1280 px e 740 px, dpr 1 e 2, nos
//   dois modos (chave «Rolagem contínua» em ⚙): roda do mouse e dedo da p. 1 à p. 5 (na página única, só dentro da
//   folha), embalo do dedo com a S Pen, salto pelo seletor, ◀ ▶ e mapa (folha no topo do quadro), compositor aberto com
//   rolagem e salvar (o comentário fica na página da abertura), «✓ p. N e próxima», pinça (transform ao vivo, sem folha
//   branca, âncora no ponto entre os dedos), grifo numa folha que não é a corrente, «Trecho a trecho» passando para a
//   página seguinte, recortes depois de rolar, reabrir numa página salva sem virada e o teto de megapixels em todas as
//   amostras.
// Fase S (com rede, perfil próprio, GitHub de mentira pelo protocolo DevTools): chave «Sincronização automática» em ⚙.
//   Toda requisição da página a api.github.com é interceptada (Fetch) e respondida aqui (preflight 204, o resto 401, como
//   um token inválido), e api.github.com resolve para NOTFOUND no navegador: nada sai do PC. Token e repositório de
//   mentira entram por ⚙ (ligada, o «Salvar» tenta). Em 1280 px e 740 px: a chave no grupo «Sincronização», ligada, com
//   a ajuda de uma linha; desligar com um toque; a dica «automática desligada» (fila vazia) e «N por enviar · automática
//   desligada»; recarregar com a fila cheia: nenhuma requisição a api.github.com nos primeiros 20 s, mesmo com a volta
//   para a aba, o foco e a rede de volta simulados, e um aviso só «N por enviar; sincronização automática desligada»;
//   tocar em Sincronizar dispara a tentativa; religar volta ao padrão (tenta na hora, ao abrir e ao voltar para a aba).
// Fase P (com rede, perfil próprio, tudo fictício, GitHub de mentira em memória pelo protocolo DevTools): linhas de versão
//   e «Proposta de modificação». Duas tiragens de mentira (PDFs gerados no teste) de duas linhas, comentários das duas no
//   mesmo trecho, quatro propostas: carga pelo repositório com o índice; isolamento entre as linhas (lista, pontos,
//   grifos, contador, mapa, gaveta, Copiar lote) nos dois sentidos, inclusive o pendente não sincronizado; o cartão em
//   cada estado (proposta, aceita, modificada, rejeitada, mudança de decisão, já aplicada, equação com o LaTeX);
//   «Próxima proposta» e o contador; Sincronizar com a chave desconhecida preservada; dois aparelhos (dois contextos do
//   navegador); exportar e importar estado.json; o cliente antigo (sync.js de b001cd8) que apaga a coleção e o aparelho
//   novo que a devolve. Provas em imagem a 390 px e 1024 px em <out>/propostas.
// Uso:
//   node tests/e2e_edge.mjs --base http://127.0.0.1:8765/ --serve . --pdf <tese.pdf> --trechos <trechos.json> [--manifest <manifest.json>] --out <pasta>
//   node tests/e2e_edge.mjs --base http://127.0.0.1:8765/ --serve . --out <pasta> --fases P   (só a fase P: não precisa da tese)
//   [--fases 12RSP]: as fases que rodam (1 inclui a 2); o padrão é todas
//   node tests/e2e_edge.mjs --base https://<dono>.github.io/mesa-casca/ --pdf <tese.pdf> --trechos <trechos.json> [--repo-dados <dono>/mesa-dados] --out <pasta>
//   [--pag-equacoes N] [--pag-tabela N] [--pag-numero N]: páginas dos recortes (sem elas, escolhidas pelo trechos.json)
// Os caminhos da tese vêm por argumento: nada da tese fica neste repositório.
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { join, resolve, extname, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const RAIZ_CASCA = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const BASE = args.base; const OUT = resolve(args.out || './e2e-saida'); const PORT = +(args.port || 9333);
const EDGE = args.edge || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
// só a fase P (tudo fictício) dispensa a tese
const SO_P = String(args.fases || '').toUpperCase() === 'P';
if (!BASE || (!SO_P && (!args.pdf || !args.trechos)) || !EDGE) { console.error('faltam --base, --pdf, --trechos ou o navegador'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const PERFIL = join(OUT, 'perfil'); const PERFIL_R = join(OUT, 'perfil-rolagem'); const PERFIL_S = join(OUT, 'perfil-sinc'); const DOWN = join(OUT, 'downloads');
rmSync(PERFIL, { recursive: true, force: true }); rmSync(PERFIL_R, { recursive: true, force: true }); rmSync(PERFIL_S, { recursive: true, force: true }); rmSync(DOWN, { recursive: true, force: true }); mkdirSync(DOWN, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const resultados = []; let falhas = 0, naoSeAplicam = 0;
function check(nome, ok, extra) { resultados.push({ nome, ok: !!ok, extra: extra ?? null }); if (!ok) falhas++; console.log((ok ? 'ok   ' : 'FALHA') + ' ' + nome + (extra != null ? '  ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); }
// verificação cujo caso a tiragem não tem: fica registrada (ok nulo, com o motivo) e não conta como ok nem como falha
function naoSeAplica(nome, motivo) { resultados.push({ nome, ok: null, naoSeAplica: true, extra: motivo }); naoSeAplicam++; console.log('n/a   ' + nome + '  ' + motivo); }

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
// ---------- processos do navegador ----------
// No Windows, Browser.close e o kill do processo lançado não levavam sempre a árvore inteira: filhos do navegador (GPU,
// utilitários; o OnDeviceModelService nasce minutos depois do lançamento) ficavam vivos e presos ao perfil, e o
// relançamento com o mesmo perfil (fase 2) não abria a porta de depuração. Agora o fechamento espera a árvore inteira
// acabar: todo processo do navegador com o perfil (ou a porta de depuração) na linha de comando, e os descendentes,
// sai por taskkill /T /F, e o perfil só fica livre quando nenhum sobra, o lockfile some e nenhum arquivo da pasta do
// perfil segue aberto (pastaLivre). O lançamento tenta de novo, com a árvore encerrada, por até 4 min. Cada evento
// fica em resultado.json («processos»).
const EXE = basename(EDGE).toLowerCase(), LANCAR_MS = 240000, PROCESSOS = [], ABERTOS = new Set();
// recursos desligados: o login implícito e a sincronização (perfil descartável) e o modelo local de IA (OnDeviceModelService)
const DESLIGADAS = ['msImplicitSignin', 'msEdgeSyncConsent', 'OptimizationGuideOnDeviceModel', 'OnDeviceModelPerformanceParams'].join(',');
function nav(msg) { PROCESSOS.push({ em: new Date().toISOString(), msg }); console.log('[navegador] ' + msg); }
function processosDoNavegador() {
  const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Get-CimInstance Win32_Process -Filter "Name='${EXE}'" | ForEach-Object { '' + $_.ProcessId + '|' + $_.ParentProcessId + '|' + $_.CommandLine }`], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  return out.split(/\r?\n/).filter(Boolean).map(l => { const [pid, ppid, ...c] = l.split('|'); return { pid: +pid, ppid: +ppid, cmd: c.join('|').toLowerCase() }; });
}
// processos do perfil: o caminho do perfil na linha de comando (--user-data-dir, o banco do crashpad; «perfil» não pega
// «perfil-rolagem») ou a porta de depuração deste teste, mais todos os descendentes deles
function processosDoPerfil(perfil) {
  const ps = processosDoNavegador(), esc = x => x.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc(perfil) + '(?=["\\s\\\\]|$)|--remote-debugging-port=' + PORT + '(?!\\d)');
  const ids = new Set(ps.filter(p => re.test(p.cmd)).map(p => p.pid));
  for (let mudou = true; mudou;) { mudou = false; for (const p of ps) if (!ids.has(p.pid) && ids.has(p.ppid)) { ids.add(p.pid); mudou = true; } }
  return ps.filter(p => ids.has(p.pid));
}
const tipo = p => (p.cmd.match(/--utility-sub-type=(\S+)/) || p.cmd.match(/--type=(\S+)/) || [0, 'navegador'])[1];
// dos pids dados, os que já saíram mas o Windows ainda lista (terminando, com um fio preso no núcleo: visto num
// filho da GPU e num renderizador depois do Browser.close com a máquina carregada); o taskkill não os alcança
// («não há ocorrência da tarefa em execução»); o que eles ainda seguram no perfil, a sonda da pasta (pastaLivre) acusa
function jaSairam(pids) {
  if (!pids.length) return new Set();
  const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `foreach ($i in @(${pids.join(',')})) { try { if ([System.Diagnostics.Process]::GetProcessById($i).HasExited) { $i } } catch { $i } }`], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  return new Set(out.split(/\s+/).filter(Boolean).map(Number));
}
// a pasta do perfil sem nenhum arquivo aberto: no Windows, renomear uma pasta falha enquanto houver um arquivo aberto
// dentro dela. Um processo que já saiu, mas o Windows ainda lista, pode seguir com arquivos do perfil abertos (visto com
// a máquina carregada: o perfil sem processo vivo e sem lockfile não pôde ser apagado logo depois), e a fase 2 reabre
// esse perfil (service worker, cache e IndexedDB da fase 1). A sonda renomeia a pasta e devolve o nome na hora.
async function sondaPasta(dir) {
  const tmp = dir + '.sonda';
  if (existsSync(tmp)) { try { rmSync(tmp, { recursive: true, force: true }); } catch { return false; } }
  try { renameSync(dir, tmp); } catch { return false; }
  for (let i = 0; ; i++) {
    try { renameSync(tmp, dir); return true; } catch (e) { if (i >= 50) throw new Error('não consegui devolver o nome da pasta: ' + tmp + ' (' + e.code + ')'); await sleep(200); }
  }
}
const pastaLivre = async dir => !existsSync(dir) || sondaPasta(dir);
// diagnóstico da pasta do perfil presa, para o resultado.json: as pastas que não se deixam renomear (do perfil até as
// mais fundas) e os processos com arquivo aberto direto nelas, pelo Gerenciador de Reinicialização do Windows (o script
// do PowerShell e a lista de arquivos vão para a pasta de saída do teste)
const DONOS_PS1 = `param([string]$lista)
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class Donos {
  [StructLayout(LayoutKind.Sequential)] struct RM_UNIQUE_PROCESS { public int dwProcessId; public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct RM_PROCESS_INFO { public RM_UNIQUE_PROCESS Process; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string strAppName; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)] public string strServiceShortName; public int ApplicationType; public uint AppStatus; public uint TSSessionId; [MarshalAs(UnmanagedType.Bool)] public bool bRestartable; }
  [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)] static extern int RmStartSession(out uint h, int f, string k);
  [DllImport("rstrtmgr.dll")] static extern int RmEndSession(uint h);
  [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)] static extern int RmRegisterResources(uint h, uint n, string[] f, uint a, IntPtr b, uint c, string[] d);
  [DllImport("rstrtmgr.dll")] static extern int RmGetList(uint h, out uint need, ref uint n, [In, Out] RM_PROCESS_INFO[] info, ref uint reasons);
  public static List<string> De(string[] arquivos) {
    var r = new List<string>(); uint h; if (RmStartSession(out h, 0, Guid.NewGuid().ToString()) != 0) return r;
    try {
      if (RmRegisterResources(h, (uint)arquivos.Length, arquivos, 0, IntPtr.Zero, 0, null) != 0) return r;
      uint need = 0, n = 0, reasons = 0; int e = RmGetList(h, out need, ref n, null, ref reasons);
      if (e == 234 && need > 0) { var info = new RM_PROCESS_INFO[need]; n = need; if (RmGetList(h, out need, ref n, info, ref reasons) == 0) for (int i = 0; i < n; i++) r.Add(info[i].Process.dwProcessId + " " + info[i].strAppName); }
    } finally { RmEndSession(h); }
    return r;
  }
}
'@
[Donos]::De([string[]](Get-Content -LiteralPath $lista -Encoding UTF8)) | ForEach-Object { $_ }
`;
async function quemPrende(perfil) {
  const pastas = [], arqs = [];
  const desce = async d => {
    pastas.push(d.slice(perfil.length).replace(/^[\\/]/, '') || '(raiz do perfil)');
    const itens = readdirSync(d, { withFileTypes: true });
    for (const n of itens) if (n.isFile() && arqs.length < 300) arqs.push(join(d, n.name));
    for (const n of itens) if (n.isDirectory() && !n.name.endsWith('.sonda') && !(await sondaPasta(join(d, n.name)))) await desce(join(d, n.name));
  };
  await desce(perfil);
  let donos = [];
  if (arqs.length) {
    const ps1 = join(OUT, 'donos.ps1'), lista = join(OUT, 'donos-arquivos.txt');
    writeFileSync(ps1, DONOS_PS1); writeFileSync(lista, arqs.join('\r\n'));
    donos = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-lista', lista], { encoding: 'utf8', timeout: 60000, windowsHide: true }).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  }
  return { pastas, donos, arquivos: arqs.length };
}
// encerra a árvore do navegador presa ao perfil e espera o perfil ficar livre: nenhum processo vivo, sem lockfile e sem
// arquivo aberto na pasta do perfil
async function liberarPerfil(perfil, quando, ms = 120000) {
  if (process.platform !== 'win32') return true;
  const t0 = Date.now(), mortos = new Set(), terminando = new Set(); let aberto = 0, seguidas = 0;
  for (;;) {
    let vivos = []; try { vivos = processosDoPerfil(perfil); } catch (e) { nav('não consegui listar os processos: ' + e.message); }
    const tentados = vivos.filter(p => mortos.has(p.pid)).map(p => p.pid);
    if (tentados.length) { let sairam = new Set(); try { sairam = jaSairam(tentados); } catch { } sairam.forEach(x => terminando.add(x)); vivos = vivos.filter(p => !sairam.has(p.pid)); }
    const lock = join(perfil, 'lockfile'); let preso = false;
    if (existsSync(lock)) { try { rmSync(lock); } catch { preso = true; } }
    let livre = false;
    if (!vivos.length && !preso) { livre = await pastaLivre(perfil); if (!livre) { aberto++; seguidas++; } else seguidas = 0; } else seguidas = 0;
    // 5 sondas seguidas com arquivo aberto (de 5 a 10 s): uma vez, quem segura a pasta
    if (seguidas === 5) {
      try { const q = await quemPrende(perfil); nav(`${quando}: a pasta do perfil segue com arquivo aberto; pastas que não se deixam renomear: ${q.pastas.join(', ')}; processos com arquivo aberto nelas (${q.arquivos} arquivos consultados): ${q.donos.join('; ') || 'nenhum identificado'}`); }
      catch (e) { nav(`${quando}: não consegui dizer quem segura a pasta do perfil: ${e.message}`); }
    }
    if (livre) {
      if (mortos.size || aberto) nav(`${quando}: perfil livre em ${Date.now() - t0} ms${mortos.size ? `, depois de encerrar ${mortos.size} processo(s)` : ''}${terminando.size ? ` (${terminando.size} já saíram e o Windows ainda os lista, terminando)` : ''}${aberto ? `; a pasta do perfil teve arquivo aberto em ${aberto} sonda(s)` : ''}`);
      return true;
    }
    if (Date.now() - t0 > ms) { nav(`${quando}: perfil ainda preso depois de ${ms / 1000} s (${vivos.map(tipo).join(', ') || (preso ? 'lockfile' : 'arquivo aberto na pasta do perfil')})`); return false; }
    const novos = vivos.filter(p => !mortos.has(p.pid));
    if (novos.length) nav(`${quando}: encerrando ${novos.length} processo(s) do navegador presos ao perfil: ${novos.map(p => p.pid + ' ' + tipo(p)).join(', ')}`);
    for (const p of vivos) { mortos.add(p.pid); try { execFileSync('taskkill', ['/T', '/F', '/PID', String(p.pid)], { stdio: 'ignore', windowsHide: true }); } catch { } }
    await sleep(1000);
  }
}
const vivo = proc => proc.exitCode === null && proc.signalCode === null;
async function launch(extra = [], perfil = PERFIL) {
  // perfil descartável: sem login implícito na conta do Windows, sem sincronização e sem extensões (a extensão sincronizada abria abas e tirava o foco);
  // sem atualização de componentes nem o modelo local de IA (o utilitário OnDeviceModelService nascia minutos depois e prendia o perfil)
  const argv = ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions', '--disable-component-extensions-with-background-pages', '--disable-component-update', `--disable-features=${DESLIGADAS}`, '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1400,1000', ...extra, 'about:blank'];
  const t0 = Date.now(); let proc = null, ver = null;
  for (let tent = 1; !ver; tent++) {
    const resta = LANCAR_MS - (Date.now() - t0);
    if (resta <= 0) throw new Error(`o navegador não abriu a porta de depuração em ${Math.round((Date.now() - t0) / 1000)} s (${tent - 1} tentativa(s); perfil preso ou porta fechada)`);
    // com a máquina carregada, a raiz encerrada pode seguir segurando o lockfile por minutos (já saiu, mas o Windows
    // ainda não a desmontou): sem perfil livre, nenhum lançamento abriria a porta
    if (!(await liberarPerfil(perfil, 'antes de lançar', Math.min(120000, resta)))) continue;
    proc = spawn(EDGE, argv, { stdio: 'ignore' });
    for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); } }
    if (ver) { if (tent > 1) nav(`lançado na tentativa ${tent}, ${Math.round((Date.now() - t0) / 1000)} s depois da primeira`); break; }
    nav(`o navegador não abriu a porta de depuração em 20 s (tentativa ${tent}${vivo(proc) ? '' : ', o processo lançado saiu com ' + proc.exitCode}); encerrando a árvore e tentando de novo`);
    try { proc.kill(); } catch { }
  }
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
  // fecha pelo protocolo, espera a raiz sair (até 10 s) e só volta com a árvore inteira encerrada e o perfil livre
  const close = async () => {
    ABERTOS.delete(close);
    try { await Promise.race([cdp.send('Browser.close'), sleep(5000)]); } catch { }
    try { ws.close(); } catch { }
    for (let i = 0; i < 40 && vivo(proc); i++) await sleep(250);
    if (vivo(proc)) { nav('a raiz não saiu 10 s depois do Browser.close'); try { proc.kill(); } catch { } }
    if (process.platform !== 'win32') { await sleep(500); return; }
    await liberarPerfil(perfil, 'ao fechar'); // preso ainda: o próximo launch espera e tenta de novo
  };
  ABERTOS.add(close);
  return { cdp, S, ev, waitFor, close, erros, abas, targetId, sessionId };
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

// ---------- «Ditar» com um reconhecimento de fala de mentira ----------
// o index.html procura o SpeechRecognition na hora de ditar, então dá para trocá-lo depois de a página abrir
const SR_FALSO = `(() => { const reg = window.__sr = { inst: [], starts: 0, config: [] };
  class SRFalso { constructor() { reg.inst.push(this); this.stops = 0; this.aborts = 0; }
    start() { reg.starts++; reg.config.push({ continuous: this.continuous, interimResults: this.interimResults, lang: this.lang, maxAlternatives: this.maxAlternatives }); }
    stop() { this.stops++; } abort() { this.aborts++; } }
  window.SpeechRecognition = SRFalso; window.webkitSpeechRecognition = SRFalso;
  window.__res = (i, l) => reg.inst.at(-1).onresult({ resultIndex: i, results: l.map(([t, f]) => Object.assign([{ transcript: t, confidence: 0.9 }], { isFinal: !!f })) });
  window.__fim = () => reg.inst.at(-1).onend(); window.__erro = e => reg.inst.at(-1).onerror({ error: e }); return true; })()`;
const DITADO = `({ caixa: document.getElementById('compText').value, previa: getComputedStyle(document.getElementById('dictPrev')).display === 'none' ? null : document.getElementById('dictPrev').textContent,
  rotulo: document.getElementById('btnDictate').textContent.trim(), aria: document.getElementById('btnDictate').getAttribute('aria-pressed'), starts: __sr.starts, stops: __sr.inst.length ? __sr.inst.at(-1).stops : 0,
  avisos: [...document.querySelectorAll('.toast')].map(t => t.textContent) })`;
async function testeDitado(b, iTexto, out) {
  await b.ev(SR_FALSO);
  await b.ev(`(() => { const x = [...[...document.querySelectorAll('#segs .seg')].filter(e => e.id)[${iTexto}].querySelectorAll('.acts button')].find(b => b.textContent === 'Comentar'); x.click(); return true; })()`);
  await b.waitFor(`getComputedStyle(document.getElementById('composer')).display !== 'none'`, 3000);
  const g = await b.ev(`(() => { const q = id => document.getElementById(id).getBoundingClientRect(), bt = q('btnDictate'), tx = q('compText'), h = document.getElementById('dictHelp'), hr = h.getBoundingClientRect();
    return { visivel: getComputedStyle(document.getElementById('btnDictate')).display !== 'none', rotulo: document.getElementById('btnDictate').textContent.trim(), aoLado: bt.left >= tx.right - 1 && bt.top < tx.bottom && bt.bottom > tx.top,
      dica: h.textContent, dicaVisivel: getComputedStyle(h).display !== 'none' && hr.height > 0, dicaAbaixo: hr.top >= tx.bottom - 1, dicaPequena: parseFloat(getComputedStyle(h).fontSize) <= 13, previaOculta: getComputedStyle(document.getElementById('dictPrev')).display === 'none' }; })()`);
  check('Ditar: com rede, o botão «Ditar» fica ao lado da caixa e a dica fixa e pequena fica embaixo dela', g.visivel && g.rotulo === 'Ditar' && g.aoLado && g.dica === 'Dica: o microfone do teclado dita sem rede.' && g.dicaVisivel && g.dicaAbaixo && g.dicaPequena && g.previaOculta, g);
  await clicar(b, `document.getElementById('btnDictate')`);
  const s1 = await b.ev(`(() => { const bt = document.getElementById('btnDictate'), dot = bt.querySelector('.dot'), cs = getComputedStyle(dot); return { rotulo: bt.textContent.trim(), aria: bt.getAttribute('aria-pressed'), ponto: cs.display !== 'none' && dot.getBoundingClientRect().width >= 8, cor: cs.backgroundColor, config: __sr.config[0] }; })()`);
  check('Ditar: ao tocar, vira «Parar» com um ponto vermelho; reconhecimento pt-BR, uma frase por sessão, com parciais', s1.rotulo === 'Parar' && s1.aria === 'true' && s1.ponto && s1.cor === 'rgb(224, 50, 43)' && JSON.stringify(s1.config) === JSON.stringify({ continuous: false, interimResults: true, lang: 'pt-BR', maxAlternatives: 1 }), s1);
  await b.ev(`__res(0, [['primeira', 0]]); __res(0, [['primeira', 0], ['primeira frase', 0]]); true`);
  const p = await b.ev(`(() => { const pv = document.getElementById('dictPrev'), r = pv.getBoundingClientRect(), t = document.getElementById('compText').getBoundingClientRect(); return { texto: pv.textContent, visivel: getComputedStyle(pv).display !== 'none', abaixo: r.top >= t.bottom - 1, cinza: getComputedStyle(pv).color === getComputedStyle(document.querySelector('.hint')).color, caixa: document.getElementById('compText').value }; })()`);
  check('Ditar: a parcial aparece em cinza embaixo da caixa, e a caixa continua vazia', p.texto === 'primeira frase' && p.visivel && p.abaixo && p.cinza && p.caixa === '', p);
  const png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'ditado-parcial.png'), Buffer.from(png.data, 'base64'));
  await b.ev(`__res(1, [['primeira', 0], ['primeira frase do ditado', 1]]); __res(1, [['primeira', 0], ['primeira frase do ditado', 1]]); __res(2, [['primeira', 0], ['primeira frase do ditado', 1], ['primeira frase do ditado', 1]]); __fim(); true`);
  const a1 = await b.ev(DITADO);
  check('Ditar: a final repetida (mesmo índice e índice novo) entra uma vez; o fim prematuro da sessão recomeça sozinho', a1.caixa === 'primeira frase do ditado' && a1.previa === null && a1.starts === 2 && a1.rotulo === 'Parar', a1);
  await b.ev(`__res(0, [['segunda', 0]]); __res(0, [['segunda frase', 1]]); __res(0, [['segunda frase mais longa', 1]]); __res(0, [['segunda frase', 1]]); __fim(); __res(0, [['segunda frase mais longa', 1]]); true`);
  await clicar(b, `document.getElementById('btnDictate')`);
  await b.ev(`__res(0, [['e fim', 1]]); __fim(); true`);
  const a2 = await b.ev(DITADO);
  check('Ditar: cada frase uma única vez na caixa; «Parar» entrega a última frase e não recomeça', a2.caixa === 'primeira frase do ditado segunda frase mais longa e fim' && a2.starts === 3 && a2.stops === 1 && a2.rotulo === 'Ditar' && a2.aria === 'false' && a2.previa === null && a2.avisos.length === 0, a2);
  await clicar(b, `document.getElementById('btnDictate')`);
  const st0 = await b.ev('__sr.starts');
  await b.ev(`__erro('no-speech'); __fim(); true`);
  const ns = await b.ev(DITADO);
  check('Ditar: «no-speech» recomeça em silêncio', ns.starts === st0 + 1 && ns.rotulo === 'Parar' && ns.avisos.length === 0, ns);
  await clicar(b, `document.getElementById('btnDictate')`); await b.ev(`__fim(); true`);
  await clicar(b, `document.getElementById('btnDictate')`);
  const st1 = await b.ev('__sr.starts');
  await b.ev(`__erro('not-allowed'); __fim(); true`);
  const bl = await b.ev(`({ ...${DITADO}, oculto: getComputedStyle(document.getElementById('btnDictate')).display === 'none', salvo: localStorage.getItem('mesa.srBlocked') })`);
  check('Ditar: permissão negada esconde o botão nesta sessão, avisa «Use o microfone do teclado» e não recomeça', bl.oculto && bl.starts === st1 && bl.rotulo === 'Ditar' && bl.avisos.includes('Use o microfone do teclado') && bl.salvo === null, bl);
  await b.ev(`document.getElementById('btnCompCancel').click(); true`);
}

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
  if (!pn) {
    naoSeAplica(L + '«equação» curta só de dígitos aparece como texto (Ler e Traduzir), sem recorte', 'a tiragem não tem «equação» curta só de dígitos; o caso segue em tests/test_recortes.mjs');
    const ps = pags.semRecorte;
    if (!ps) { check(L + 'página de texto sem recortes encontrada no trechos.json', false); return; }
    await irPara(b, ps);
    check(L + 'ao ir para uma página sem recortes (p. ' + ps + '), a cópia em alta é liberada', await b.waitFor(`(${diag}).recorte.pagina === 0 && document.querySelectorAll('#segs canvas.crop').length === 0`, 5000));
    return;
  }
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
// o mesmo arrasto, mas o dedo para antes de soltar: sem o embalo do navegador, a rolagem anda só o tamanho do arrasto
async function dedoLento(b, p, dy) {
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  try {
    await b.S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    for (let k = 1; k <= 12; k++) await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: Math.round(p.y + dy * k / 12) }] });
    for (let k = 0; k < 4; k++) { await sleep(60); await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: Math.round(p.y + dy) }] }); }
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
// topo da folha da página n (ou da corrente) na faixa do quadro: offsetTop, porque o #canvaswrap é position: relative
const TOPO = n => `document.querySelector('.sheet[data-p="${n}"]').offsetTop`;
const TOPO_CUR = `document.querySelector('.sheet.cur').offsetTop`;
// modo do PDF pela chave de ⚙ Configuração, grupo «Leitura», «Rolagem contínua»
async function modo(b, cont) {
  await b.ev(`document.getElementById('btnCfg').click(); true`);
  await b.waitFor(visivel('cfgDrawer'), 3000);
  const ok0 = await b.ev(`(() => { const c = document.getElementById('cfgRolagem'), s = c.closest('section'); return !!s && s.querySelector('h3').textContent === 'Leitura' && c.closest('label').textContent.trim() === 'Rolagem contínua' && getComputedStyle(c).display !== 'none'; })()`);
  if ((await b.ev(`document.getElementById('cfgRolagem').checked`)) !== cont) await b.ev(`document.getElementById('cfgRolagem').click(); true`);
  await b.ev(`document.getElementById('btnCfgClose').click(); true`);
  const ok = await b.waitFor(`(${diag}).rolagem === '${cont ? 'continua' : 'unica'}' && (${diag}).paginaDesenhada === (${diag}).pagina`, 15000);
  const ls = await b.ev(`localStorage.getItem('mesa.rolagem')`);
  await sleep(300);
  return ok0 && !!ok && (cont ? ls === null || ls === 'true' : ls === 'false');
}
async function testeRolagem(b, alvo, larg, alt, out, cont) {
  const L = larg + ' px, ' + (cont ? 'rolagem contínua' : 'uma página por vez') + ': ', largo = larg > 900, M = cont ? 'continua' : 'unica';
  await b.S('Page.bringToFront'); await b.S('Emulation.setFocusEmulationEnabled', { enabled: true });
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: 1, mobile: false });
  await sleep(700);
  await irPara(b, alvo.page + 1); await irPara(b, alvo.page); // começa sem trecho ativo
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page}`, 15000);
  await estavel(b, POS);
  const g = await b.ev(`(() => { const q = s => document.querySelector(s).getBoundingClientRect(), cs = s => getComputedStyle(document.querySelector(s)), se = document.scrollingElement, c = q('#canvaswrap'), l = q('#listwrap'), lw = document.getElementById('listwrap');
    return { ladoALado: l.left >= c.right - 1 && Math.abs(l.top - q('.pageview').top) < 8, empilhado: l.top >= c.bottom - 1, cabem: c.bottom <= innerHeight && l.bottom <= innerHeight, paginaRola: se.scrollHeight > se.clientHeight + 1,
      lista: cs('#listwrap').overflowY + ' ' + cs('#listwrap').overscrollBehaviorY, pdf: cs('#canvaswrap').overflowY + ' ' + cs('#canvaswrap').overscrollBehaviorY, cabecalho: lw.contains(document.getElementById('segTitle')) && lw.contains(document.querySelector('.help')) && lw.contains(document.getElementById('segs')),
      listaAlt: Math.round(l.height), pdfAlt: Math.round(c.height), topoAlt: Math.round(q('.topbar').height), aviso: document.getElementById('banner').hidden ? null : document.getElementById('banner').textContent.slice(0, 60) }; })()`);
  check(L + (largo ? 'PDF e lista lado a lado, os dois cabendo na tela' : 'PDF em cima e lista embaixo, os dois cabendo na tela'), (largo ? g.ladoALado : g.empilhado) && g.cabem, { pdf: g.pdfAlt, lista: g.listaAlt, topo: g.topoAlt, aviso: g.aviso });
  check(L + 'duas áreas de rolagem (overflow auto, overscroll contain), cabeçalho e ajuda dentro da lista, a página não rola', g.lista === 'auto contain' && g.pdf === 'auto contain' && g.cabecalho && !g.paginaRola, { lista: g.lista, pdf: g.pdf });
  // 1. rolar a lista até o último trecho (roda do mouse até o fim e além; depois o dedo, para cima e para baixo além do fim): o PDF não se mexe
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR} + 150; true`);
  const p0 = await estavel(b, POS); const pl = await b.ev(ponto('#listwrap'));
  const p1 = await roda(b, pl, 400, 40);
  const ult = await b.ev(`(() => { const l = document.getElementById('listwrap').getBoundingClientRect(), u = ${TRECHOS}.at(-1).getBoundingClientRect(); return u.bottom <= l.bottom + 1 && u.top < l.bottom; })()`);
  check(L + 'rolar a lista com a roda do mouse até o último trecho não move o PDF', p1.listaMax > 50 && p1.lista >= p1.listaMax - 2 && ult && p0.pdf > 0 && p1.pdf === p0.pdf && p1.pdfTopo === p0.pdfTopo && p1.janela === 0 && p1.topo === p0.topo, { lista: [p0.lista, p1.lista, p1.listaMax], pdf: [p0.pdf, p1.pdf] });
  const lt = await b.ev(borda('#listwrap', true)), lb = await b.ev(borda('#listwrap', false));
  const dl1 = await dedo(b, lt, Math.min(300, lt.fim - lt.y - 8)); const p2 = await estavel(b, POS);
  const dl2 = await dedo(b, lb, -600); const p3 = await estavel(b, POS);
  check(L + 'rolar a lista com o dedo (para cima, e para baixo além do fim) não move o PDF', dl1 && dl2 && p2.lista < p1.lista && p3.lista >= p3.listaMax - 2 && p2.pdf === p0.pdf && p3.pdf === p0.pdf && p2.pdfTopo === p0.pdfTopo && p3.pdfTopo === p0.pdfTopo && p3.janela === 0, { lista: [p1.lista, p2.lista, p3.lista], pdf: [p0.pdf, p2.pdf, p3.pdf] });
  // 2. rolar o PDF: a lista não se mexe. Uma página por vez: roda até o fim da folha e além, depois o dedo para cima e
  //    para baixo além do fim. Rolagem contínua: dentro da folha corrente (passar de folha é a cena da rolagem contínua)
  if (!cont) {
    await b.ev(`document.getElementById('canvaswrap').scrollTop = 0; true`);
    const q0 = await estavel(b, POS); const pp = await b.ev(ponto('#canvaswrap'));
    const q1 = await roda(b, pp, 400, 30);
    check(L + 'rolar o PDF com a roda do mouse até o fim da folha não move a lista nem troca a página', q1.pdfMax > 50 && q1.pdf >= q1.pdfMax - 2 && q1.lista === q0.lista && q1.listaTopo === q0.listaTopo && q1.janela === 0 && (await b.ev(`(${diag}).pagina`)) === alvo.page, { pdf: [q0.pdf, q1.pdf, q1.pdfMax], lista: [q0.lista, q1.lista] });
    const ct = await b.ev(borda('#canvaswrap', true)), cb = await b.ev(borda('#canvaswrap', false));
    const dp1 = await dedo(b, ct, Math.min(250, ct.fim - ct.y - 8)); const q2 = await estavel(b, POS);
    const dp2 = await dedo(b, cb, -600); const q3 = await estavel(b, POS);
    check(L + 'rolar o PDF com o dedo (para cima, e para baixo além do fim) não move a lista', dp1 && dp2 && q2.pdf < q1.pdf && q3.pdf >= q3.pdfMax - 2 && q2.lista === q0.lista && q3.lista === q0.lista && q3.listaTopo === q0.listaTopo && q3.janela === 0, { pdf: [q1.pdf, q2.pdf, q3.pdf], lista: [q0.lista, q2.lista, q3.lista] });
  } else {
    await b.ev(`document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR}; true`);
    const q0 = await estavel(b, POS); const pp = await b.ev(ponto('#canvaswrap'));
    const q1 = await roda(b, pp, 100, 3);
    check(L + 'rolar o PDF com a roda dentro da folha não move a lista nem troca a página', q1.pdf > q0.pdf && q1.lista === q0.lista && q1.listaTopo === q0.listaTopo && q1.janela === 0 && (await b.ev(`(${diag}).pagina`)) === alvo.page, { pdf: [q0.pdf, q1.pdf], lista: [q0.lista, q1.lista] });
    const ct = await b.ev(borda('#canvaswrap', true));
    const dp1 = await dedo(b, ct, Math.min(160, Math.max(40, q1.pdf - q0.pdf - 40), ct.fim - ct.y - 8)); const q2 = await estavel(b, POS);
    const cb = await b.ev(borda('#canvaswrap', false));
    const dp2 = await dedo(b, cb, -160); const q3 = await estavel(b, POS);
    check(L + 'rolar o PDF com o dedo dentro da folha (para cima e para baixo) não move a lista nem troca a página', dp1 && dp2 && q2.pdf < q1.pdf && q3.pdf > q2.pdf && q2.lista === q0.lista && q3.lista === q0.lista && q3.listaTopo === q0.listaTopo && q3.janela === 0 && (await b.ev(`(${diag}).pagina`)) === alvo.page, { pdf: [q1.pdf, q2.pdf, q3.pdf], lista: [q0.lista, q2.lista, q3.lista] });
  }
  // 3. tocar num trecho da lista (o do meio da página): o PDF centra o realce e a lista não pula
  const txt = alvo.segs.map((s, i) => ({ s, i })).filter(x => x.s.kind === 'text');
  const meio = txt.reduce((a, x) => Math.abs((x.s.bbox[1] + x.s.bbox[3]) / 2 / alvo.h - 0.5) < Math.abs((a.s.bbox[1] + a.s.bbox[3]) / 2 / alvo.h - 0.5) ? x : a);
  const segId = JSON.stringify('seg-' + meio.s.id);
  await b.ev(`(() => { const lw = document.getElementById('listwrap'), e = document.getElementById(${segId}); lw.scrollTop += e.getBoundingClientRect().top - lw.getBoundingClientRect().top - 40; document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR}; return true; })()`);
  const t0 = await estavel(b, POS);
  const pt = await b.ev(`(() => { const e = document.getElementById(${segId}), t = e.querySelector('.txt'), r = t.getBoundingClientRect(), x = Math.round(r.left + Math.min(r.width / 2, 120)), y = Math.round(r.top + 10), h = document.elementFromPoint(x, y); return { x, y, topo: e.getBoundingClientRect().top, ok: !!h && (h === t || t.contains(h)) }; })()`);
  await clique(b, pt.x, pt.y); await sleep(300);
  const t1 = await estavel(b, POS); const cp = await b.ev(CENTRO_PDF);
  const e1 = await b.ev(`(() => { const e = document.getElementById(${segId}); return { topo: e.getBoundingClientRect().top, ativo: e.classList.contains('active') }; })()`);
  check(L + 'tocar num trecho da lista centra o realce no PDF sem a lista pular', pt.ok && e1.ativo && cp.realce && cp.centrado && t1.pdf !== t0.pdf && Math.abs(e1.topo - pt.topo) <= 1 && t1.lista === t0.lista && t1.janela === 0 && (await b.ev(`(${diag}).pagina`)) === alvo.page, { pdf: [t0.pdf, t1.pdf], desvioPdf: cp.desvio, lista: [t0.lista, t1.lista], trecho: [Math.round(pt.topo), Math.round(e1.topo)] });
  // 4. tocar num trecho no PDF (o mais baixo visível da folha corrente): a lista centra o trecho e o PDF fica parado
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; true`);
  const f0 = await estavel(b, POS);
  const hs = await b.ev(`(() => { const w = document.getElementById('canvaswrap').getBoundingClientRect(), hs = [...document.querySelectorAll('.sheet.cur .hl')]; for (let k = hs.length - 1; k >= 0; k--) { const r = hs[k].getBoundingClientRect(), x = Math.round(r.left + Math.min(r.width / 2, 60)), y = Math.round(r.top + Math.min(r.height / 2, 8)); if (y > w.top + 4 && y < w.bottom - 4 && document.elementFromPoint(x, y) === hs[k]) return { k, x, y }; } return null; })()`);
  if (hs) { await clique(b, hs.x, hs.y); await sleep(300); }
  const f1 = await estavel(b, POS); const cl = hs ? await b.ev(CENTRO_LISTA(hs.k)) : {};
  check(L + 'tocar num trecho no PDF centra o trecho na lista e o PDF fica parado', !!hs && cl.ativo && cl.centrado && f1.lista !== f0.lista && f1.pdf === f0.pdf && f1.pdfTopo === f0.pdfTopo && f1.janela === 0, { trecho: hs && hs.k, desvioLista: cl.desvio, lista: [f0.lista, f1.lista], pdf: [f0.pdf, f1.pdf] });
  // 5. «Trecho a trecho»: «trecho ▶» centra o próximo trecho na lista e o realce no PDF, sem rolar a janela
  await b.ev(`document.getElementById('btnStep').click(); true`);
  await b.waitFor(visivel('stepbar'), 3000);
  await b.ev(`document.getElementById('listwrap').scrollTop = 0; document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR}; true`);
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
  // 6. mudar de página: a lista volta ao topo e a folha da página nova vai ao topo do quadro (uma página por vez: 0)
  await b.ev(`document.getElementById('listwrap').scrollTop = 400; document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR} + 200; true`);
  const m0 = await estavel(b, POS);
  const nb = await b.ev(`(() => { const r = document.getElementById('btnNext').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await clique(b, nb.x, nb.y);
  await b.waitFor(`(${diag}).paginaDesenhada === ${alvo.page + 1}`, 15000);
  const m1 = await estavel(b, POS), topo1 = await b.ev(TOPO(alvo.page + 1));
  check(L + 'mudar de página leva a lista ao topo e a folha da página nova ao topo do quadro', m0.lista > 0 && m0.pdf > 0 && m1.lista === 0 && Math.abs(m1.pdf - topo1) <= 1 && (cont || m1.pdf === 0) && m1.janela === 0, { antes: [m0.lista, m0.pdf], depois: [m1.lista, m1.pdf], topoDaFolha: topo1 });
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
  writeFileSync(join(out, 'rolagem-' + larg + '-' + M + '-compositor.png'), Buffer.from(shot.data, 'base64'));
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
  check(L + 'depois da divisória, a mesma página corrente', (await b.ev(`(${diag}).pagina`)) === alvo.page);
  const shot2 = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'rolagem-' + larg + '-' + M + '.png'), Buffer.from(shot2.data, 'base64'));
}

// ---------- rolagem contínua do PDF (folhas), nos dois modos, com a CPU 4 vezes mais lenta ----------
// folha que domina o quadro, pela geometria da página (sem a histerese do app)
const DOMINANTE = `(() => { const w = document.getElementById('canvaswrap'), y = w.scrollTop, h = w.clientHeight; let m = 0, p = 0;
  for (const s of document.querySelectorAll('#canvaswrap .sheet')) { if (getComputedStyle(s).display === 'none') continue; const v = Math.min(y + h, s.offsetTop + s.offsetHeight) - Math.max(y, s.offsetTop); if (v > m) { m = v; p = +s.dataset.p; } } return p; })()`;
// o registro mais recente de uma coleção do IndexedDB (comentários, grifos) ou um pelo id (revisadas)
const ULTIMO = st => `(async () => { const db = await new Promise((res, rej) => { const r = indexedDB.open('mesa'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const all = await new Promise((res, rej) => { const q = db.transaction('${st}').objectStore('${st}').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); db.close();
  return all.filter(x => x.sync !== 'tombstone').sort((a, b) => String(a.criado_em || a.em).localeCompare(String(b.criado_em || b.em))).at(-1) || null; })()`;
const REVISADA = n => `(async () => { const db = await new Promise((res, rej) => { const r = indexedDB.open('mesa'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const x = await new Promise((res, rej) => { const q = db.transaction('revisadas').objectStore('revisadas').get('${n}'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); db.close(); return x || null; })()`;
let mpMaior = 0;
async function amostraMP(b) { const d = await b.ev(diag); if (d.megapixels > mpMaior) mpMaior = d.megapixels; return d; }
// rajadas da roda do mouse (4 eventos), parando entre elas, até a página n ficar corrente ou acabar o limite
async function rodaAte(b, n, dy, max = 40) {
  const pc = await b.ev(ponto('#canvaswrap')), vistas = [await b.ev(`(${diag}).pagina`)]; let d = null;
  for (let k = 0; k < max; k++) {
    for (let i = 0; i < 4; i++) await b.S('Input.dispatchMouseEvent', { type: 'mouseWheel', x: pc.x, y: pc.y, deltaX: 0, deltaY: dy });
    await estavel(b, POS, 4000); await sleep(250);
    d = await amostraMP(b);
    if (d.pagina !== vistas.at(-1)) vistas.push(d.pagina);
    if (d.pagina === n) break;
  }
  return { vistas, d };
}
// arrasto de dois dedos (pinça) em volta do ponto m; devolve o transform do quadro no meio do gesto
async function pinca(b, m, d0, d1) {
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const pts = d => [{ x: m.x, y: Math.round(m.y - d / 2), id: 1 }, { x: m.x, y: Math.round(m.y + d / 2), id: 2 }];
  let meio = null;
  try {
    await b.S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(d0) });
    for (let k = 1; k <= 8; k++) {
      await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d0 + (d1 - d0) * k / 8) });
      if (k === 6) meio = await b.ev(`document.getElementById('canvaswrap').style.transform`);
    }
    await b.S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await b.S('Emulation.setTouchEmulationEnabled', { enabled: false }); }
  return meio;
}
// o desenho da folha corrente ocupa a folha inteira, sem borda nem cantos arredondados (classe própria, não a .pg do mapa
// de páginas), e o bitmap tem a largura e a altura da folha vezes a densidade efetiva (1:1, sem reamostrar)
const DESENHO_1A1 = `(() => { const s = document.querySelector('.sheet.cur'), c = s && s.querySelector('canvas.folha-cv'), d = window.mesa.diagnostico(); if (!c) return null; const cs = getComputedStyle(c);
  return { folha: [s.clientWidth, s.clientHeight], desenhoCss: [c.clientWidth, c.clientHeight], bitmap: [c.width, c.height], esperado: [Math.floor(s.clientWidth * d.dpr), Math.floor(s.clientHeight * d.dpr)], borda: cs.borderTopWidth, raio: cs.borderTopLeftRadius, classe: c.className }; })()`;
// folha e fração dela sob o ponto (x, y) da tela
const SOB = (x, y) => `(() => { const s = document.elementFromPoint(${x}, ${y}).closest('.sheet'); if (!s) return null; const r = s.getBoundingClientRect(); return { p: +s.dataset.p, fx: (${x} - r.left) / r.width, fy: (${y} - r.top) / r.height }; })()`;
async function testeFolhas(b, larg, alt, dpr, cont, rodada, out) {
  const L = larg + ' px, dpr ' + dpr + ', ' + (cont ? 'rolagem contínua' : 'uma página por vez') + ', CPU 4x: ', R = larg + '-dpr' + dpr + '-' + (cont ? 'continua' : 'unica');
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: dpr, mobile: false });
  await sleep(800);
  check(L + 'chave «Rolagem contínua» em ⚙ → «Leitura» ' + (cont ? 'ligada' : 'desligada'), await modo(b, cont));
  mpMaior = 0;
  // 1. roda do mouse da p. 1 à p. 5
  await irPara(b, 1); await b.ev(`document.getElementById('canvaswrap').scrollTop = 0; true`); await estavel(b, POS);
  if (cont) {
    const r = await rodaAte(b, 5, 120);
    const fim = await b.ev(`({ input: document.getElementById('pageInput').value, titulo: document.getElementById('segTitle').textContent, des: (${diag}).paginaDesenhada })`);
    check(L + 'a roda do mouse leva da p. 1 à p. 5 pelas folhas, em sequência; #pageInput e a lista acompanham', r.d.pagina === 5 && fim.input === '5' && /^Página 5\b/.test(fim.titulo) && fim.des === 5 && r.vistas.every((p, i) => i === 0 || p === r.vistas[i - 1] + 1), { vistas: r.vistas, ...fim });
  } else {
    const r = await rodaAte(b, 5, 120, 6), pdf = await b.ev(POS);
    check(L + 'a roda do mouse rola só dentro da folha da p. 1 (uma página por vez)', r.d.pagina === 1 && (await b.ev(`document.getElementById('pageInput').value`)) === '1' && pdf.pdf >= pdf.pdfMax - 2, { vistas: r.vistas, pdf: [pdf.pdf, pdf.pdfMax] });
  }
  await b.waitFor(`(${diag}).paginaDesenhada === (${diag}).pagina`, 15000);
  const um = await b.ev(DESENHO_1A1);
  check(L + 'o desenho da folha ocupa a folha inteira, sem borda, com o bitmap 1:1 (folha vezes a densidade efetiva)', !!um && um.desenhoCss[0] === um.folha[0] && um.desenhoCss[1] === um.folha[1] && um.borda === '0px' && um.raio === '0px' && Math.abs(um.bitmap[0] - um.esperado[0]) <= 1 && Math.abs(um.bitmap[1] - um.esperado[1]) <= 1, um);
  // 2. dedo (S Pen desligada: a rolagem é do navegador) da p. 1 à p. 5, um arrasto de quase um quadro por vez
  await irPara(b, 1); await b.ev(`document.getElementById('canvaswrap').scrollTop = 0; true`); await estavel(b, POS);
  const vt = [1]; let dd = null;
  for (let k = 0; k < 40; k++) {
    const ct = await b.ev(borda('#canvaswrap', true)), cb = await b.ev(borda('#canvaswrap', false));
    await dedoLento(b, cb, -(cb.y - ct.y)); await sleep(250);
    dd = await amostraMP(b); if (dd.pagina !== vt.at(-1)) vt.push(dd.pagina);
    if (dd.pagina === 5 || (!cont && k >= 3)) break;
  }
  if (cont) check(L + 'o dedo leva da p. 1 à p. 5 pelas folhas; #pageInput acompanha', dd.pagina === 5 && (await b.ev(`document.getElementById('pageInput').value`)) === '5' && vt.every((p, i) => i === 0 || p === vt[i - 1] + 1), { vistas: vt });
  else check(L + 'o dedo rola só dentro da folha da p. 1', dd.pagina === 1 && (await b.ev(`document.getElementById('pageInput').value`)) === '1', { vistas: vt });
  // 3. com a S Pen ligada, o dedo rola pela Mesa: o arrasto rápido continua com embalo depois de soltar
  await b.ev(`document.getElementById('btnPen').click(); true`);
  await irPara(b, 10); await b.ev(`document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR}; true`); await estavel(b, POS);
  // registro do teste, na captura (antes do app): hora do evento e do manipulador de cada pointermove e do pointerup do
  // dedo, o scrollTop na soltura e nos dois quadros seguintes
  await b.ev(`(() => { const w = document.getElementById('canvaswrap'), r = window.__emb = { mv: [], up: null, solto: null, q: [] };
    const mv = e => { if (e.pointerType === 'touch') r.mv.push([Math.round(e.timeStamp), Math.round(performance.now())]); };
    const up = e => { if (e.pointerType !== 'touch') return; r.up = [Math.round(e.timeStamp), Math.round(performance.now())]; r.solto = w.scrollTop; w.removeEventListener('pointermove', mv, true); w.removeEventListener('pointerup', up, true);
      requestAnimationFrame(t => { r.q.push([Math.round(t), w.scrollTop]); requestAnimationFrame(t2 => { r.q.push([Math.round(t2), w.scrollTop]); }); }); };
    w.addEventListener('pointermove', mv, true); w.addEventListener('pointerup', up, true); return true; })()`);
  const cbx = await b.ev(borda('#canvaswrap', false));
  // os tempos dos eventos são os de um arrasto rápido de verdade (um evento a cada 10 ms, a soltura 10 ms depois do
  // último): sem eles, cada evento leva a hora em que o protocolo o despacha, depois da resposta do anterior, e com a
  // CPU 4x o dedo sintético ficava tão lento quanto o renderizador (o app usa a hora dos eventos, e.timeStamp)
  const t0 = Date.now() / 1000, quando = k => ({ timestamp: t0 + k * 0.010 });
  await b.S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  try {
    await b.S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cbx.x, y: cbx.y, id: 1 }], ...quando(0) });
    for (let k = 1; k <= 8; k++) await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cbx.x, y: cbx.y - 35 * k, id: 1 }], ...quando(k) });
    await b.S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], ...quando(9) });
  } finally { await b.S('Emulation.setTouchEmulationEnabled', { enabled: false }); }
  await sleep(1500);
  const em = await b.ev(`(() => { const w = document.getElementById('canvaswrap'), r = window.__emb || {}, e = window.mesa.diagnostico().medidor.embalo, u = r.mv && r.mv[r.mv.length - 1];
    return { solto: r.solto, agora: w.scrollTop, max: w.scrollHeight - w.clientHeight, quadros: r.q, eventos: r.mv ? r.mv.length : 0, paradoNoEvento: r.up && u ? r.up[0] - u[0] : null, atrasoDoManipulador: r.up ? r.up[1] - r.up[0] : null,
      app: e && { v: e.v, parado: e.parado, atraso: e.atraso, y0: e.y0, y1: e.y1, quadros: e.quadros, fim: e.fim, dur: e.dur } }; })()`);
  check(L + 'S Pen ligada: o arrasto rápido do dedo continua rolando (embalo) depois de soltar', em.solto != null && (em.agora > em.solto + 30 || em.agora >= em.max - 2), em);
  await estavel(b, POS);
  if (cont) check(L + 'S Pen ligada: depois do embalo, a página corrente é a que domina o quadro', (await b.ev(`(${diag}).pagina`)) === (await b.ev(DOMINANTE)));
  await b.ev(`document.getElementById('btnPen').click(); true`);
  // 4. salto pelo seletor, ◀ ▶ e mapa: a folha vai ao topo do quadro
  const topoOk = async n => { await b.waitFor(`(${diag}).pagina === ${n} && (${diag}).paginaDesenhada === ${n}`, 15000); const p = await estavel(b, POS), t = await b.ev(TOPO(n)), d = await amostraMP(b); return { ok: Math.abs(p.pdf - t) <= 1 && (cont || p.pdf === 0) && p.lista === 0 && d.pagina === n && (await b.ev(`document.getElementById('pageInput').value`)) === String(n), pdf: p.pdf, topo: t }; };
  await irPara(b, 40); const j1 = await topoOk(40);
  await b.ev(`document.getElementById('btnNext').click(); true`); const j2 = await topoOk(41);
  await b.ev(`document.getElementById('btnPrev').click(); true`); const j3 = await topoOk(40);
  await b.ev(`document.getElementById('btnPages').click(); true`); await b.waitFor(visivel('pagesDrawer'), 3000);
  await b.ev(`[...document.querySelectorAll('#pgrid .pg')][59].click(); true`); const j4 = await topoOk(60);
  check(L + 'número digitado, ▶, ◀ e mapa levam a folha da página ao topo do quadro, desenhada, com a lista no topo', j1.ok && j2.ok && j3.ok && j4.ok && !(await b.ev(visivel('pagesDrawer'))), { seletor: j1, proxima: j2, anterior: j3, mapa: j4 });
  // 5. compositor aberto («Comentar a p. N»), rolar duas folhas, salvar: o comentário fica na página da abertura
  await irPara(b, 40); await b.ev(`document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR}; true`); await estavel(b, POS);
  const rot = await b.ev(`document.getElementById('btnPageComment').textContent`);
  await b.ev(`document.getElementById('btnPageComment').click(); true`); await b.waitFor(visivel('composer'), 3000);
  const onde = await b.ev(`document.getElementById('compWhere').textContent`);
  if (cont) { const pc = await b.ev(ponto('#canvaswrap')); for (let k = 0; k < 12 && (await b.ev(DOMINANTE)) < 42; k++) { for (let i = 0; i < 4; i++) await b.S('Input.dispatchMouseEvent', { type: 'mouseWheel', x: pc.x, y: pc.y, deltaX: 0, deltaY: 120 }); await estavel(b, POS, 4000); } await sleep(300); } else { await b.ev(`document.getElementById('btnNext').click(); true`); await b.waitFor(`(${diag}).paginaDesenhada === 41`, 15000); await b.ev(`document.getElementById('btnNext').click(); true`); await b.waitFor(`(${diag}).paginaDesenhada === 42`, 15000); }
  const meio = await b.ev(`({ pagina: (${diag}).pagina, dominante: ${DOMINANTE}, topo: document.getElementById('canvaswrap').scrollTop })`);
  const texto = 'Comentário de teste da rolagem ' + rodada;
  await b.ev(`document.getElementById('compText').value = ${JSON.stringify(texto)}; document.getElementById('btnCompSave').click(); true`);
  const aviso = await b.waitFor(`[...document.querySelectorAll('.toast')].map(t => t.textContent).find(t => /^Salvo na p\\. /.test(t)) || ''`, 4000);
  const cm = await b.ev(ULTIMO('comentarios'));
  await sleep(300);
  const depois = await b.ev(`({ pagina: (${diag}).pagina, dominante: ${DOMINANTE} })`);
  check(L + '«Comentar a p. 40» aberto: rolar duas folhas não muda a página; salvar grava a p. 40; fechado, a página volta a seguir a rolagem',
    rot === 'Comentar a p. 40' && onde === 'p. 40' && meio.pagina === (cont ? 40 : 42) && (!cont || meio.dominante >= 42) && aviso === 'Salvo na p. 40' && !!cm && cm.pagina === 40 && cm.tipo === 'pagina' && cm.texto === texto && (!cont || depois.pagina === depois.dominante),
    { rot, onde, meio, aviso, gravado: cm && { pagina: cm.pagina, tipo: cm.tipo }, depois });
  // 6. «✓ p. N e próxima»: marca a página corrente (a do rótulo) e vai à próxima não revisada
  const N = 61 + 2 * rodada;
  await irPara(b, N); await estavel(b, POS);
  const rotulos = await b.ev(`['btnReviewed', 'btnReviewedNext', 'btnPageComment'].map(id => document.getElementById(id).textContent)`);
  await b.ev(`document.getElementById('btnReviewedNext').click(); true`);
  const prox = await b.waitFor(`(${diag}).pagina === ${N + 1} && (${diag}).paginaDesenhada === ${N + 1}`, 15000);
  const rev = await b.ev(REVISADA(N)), pr = await estavel(b, POS), tp = await b.ev(TOPO(N + 1));
  check(L + '«✓ p. ' + N + ' e próxima» marca a p. ' + N + ' e leva a folha da p. ' + (N + 1) + ' ao topo; rótulos com o número da página', rotulos.join('|') === 'Marcar p. ' + N + ' revisada|✓ p. ' + N + ' e próxima|Comentar a p. ' + N && !!prox && !!rev && rev.pagina === N && Math.abs(pr.pdf - tp) <= 1, { rotulos, revisada: !!rev, pdf: [pr.pdf, tp] });
  // 7. pinça (S Pen ligada): retorno ao vivo por transform, sem folha branca, o ponto entre os dedos fica no lugar
  await b.ev(`document.getElementById('btnPen').click(); true`);
  await irPara(b, 30); await b.ev(`document.getElementById('canvaswrap').scrollTop = ${TOPO_CUR} + 120; true`); await estavel(b, POS);
  const m = await b.ev(`(() => { const r = document.getElementById('canvaswrap').getBoundingClientRect(); return { x: Math.round(r.left + r.width * 0.4), y: Math.round(r.top + r.height * 0.45) }; })()`);
  const a0 = await b.ev(SOB(m.x, m.y));
  const tr = await pinca(b, m, 120, 180);
  const logo = await b.ev(`(() => { const s = document.querySelector('.sheet.cur'), c = s.querySelector('canvas.folha-cv'); return { ok: s.classList.contains('ok'), largura: c ? c.width : 0, zoom: document.getElementById('zoomLabel').textContent, transform: document.getElementById('canvaswrap').style.transform }; })()`);
  await b.waitFor(`(${diag}).paginaDesenhada === (${diag}).pagina`, 15000); await estavel(b, POS); await sleep(400);
  const a1 = await b.ev(SOB(m.x, m.y)), dz = await amostraMP(b);
  const esc = tr && +(tr.match(/scale\(([\d.]+)\)/) || [])[1];
  check(L + 'pinça: o quadro amplia ao vivo durante o gesto (transform) e o zoom vira 150 % no fim', esc > 1.25 && esc < 1.6 && logo.zoom === '150 %' && logo.transform === '' && dz.zoom === 1.5, { transform: tr, logo });
  check(L + 'pinça: sem folha branca (o desenho antigo estica até o novo)', logo.ok && logo.largura > 0, logo);
  check(L + 'pinça: o ponto entre os dedos fica no mesmo lugar da página (vertical e horizontal)', !!a0 && !!a1 && a0.p === a1.p && Math.abs(a0.fy - a1.fy) < 0.02 && Math.abs(a0.fx - a1.fx) < 0.03, { antes: a0, depois: a1 });
  await b.ev(`document.getElementById('btnZoomOut').click(); document.getElementById('btnZoomOut').click(); true`);
  await b.waitFor(`(${diag}).zoom === 1 && (${diag}).paginaDesenhada === (${diag}).pagina`, 15000); await amostraMP(b);
  await b.ev(`document.getElementById('btnPen').click(); true`);
  // 8. grifo numa folha que não é a corrente (rolagem contínua): a folha tocada vira a corrente e o grifo é gravado nela
  await irPara(b, 70); await estavel(b, POS);
  if (cont) await b.ev(`(() => { const w = document.getElementById('canvaswrap'), s = document.querySelector('.sheet[data-p="70"]'); w.scrollTop = s.offsetTop + s.offsetHeight - Math.round(w.clientHeight * 0.62); return true; })()`);
  await estavel(b, POS); await sleep(300);
  const pg0 = await b.ev(`(${diag}).pagina`), alvoG = cont ? 71 : 70, ng0 = (await b.ev(diag)).grifos;
  const rg = await b.ev(`(() => { const s = document.querySelector('.sheet[data-p="${alvoG}"]').getBoundingClientRect(), w = document.getElementById('canvaswrap').getBoundingClientRect(), topo = Math.max(s.top, w.top), fim = Math.min(s.bottom, w.bottom); return { x0: s.left + s.width * 0.2, x1: s.left + s.width * 0.6, y: Math.round(topo + Math.min(60, (fim - topo) / 2)), visivel: Math.round(fim - topo) }; })()`);
  await b.ev(`document.getElementById('btnMarker').click(); true`);
  await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: rg.x0, y: rg.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let k = 1; k <= 12; k++) await b.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rg.x0 + (rg.x1 - rg.x0) * k / 12, y: rg.y, button: 'left', buttons: 1 });
  await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rg.x1, y: rg.y, button: 'left', buttons: 0, clickCount: 1 });
  await b.ev(`document.getElementById('btnMarker').click(); true`);
  await b.waitFor(`(${diag}).grifos === ${ng0 + 1}`, 5000);
  const gr = await b.ev(ULTIMO('grifos')), dg = await b.ev(`({ pagina: (${diag}).pagina, input: document.getElementById('pageInput').value, titulo: document.getElementById('segTitle').textContent })`);
  check(L + (cont ? 'grifo na folha de baixo (a p. 71, com a p. 70 corrente): gravado na p. 71, que vira a corrente' : 'grifo na folha corrente: gravado na p. 70'),
    pg0 === 70 && !!gr && gr.pagina === alvoG && !!gr.pts && dg.pagina === alvoG && dg.input === String(alvoG) && new RegExp('^Página ' + alvoG + '\\b').test(dg.titulo), { antes: pg0, grifo: gr && { pagina: gr.pagina, traco: !!gr.pts }, depois: dg, faixaVisivel: rg.visivel });
  // 8b. (rolagem contínua) um toque no grifo abre o aviso; a roda desce duas folhas: o aviso fecha no começo da rolagem
  // e, quando ela para, a página acompanha a folha que domina o quadro
  if (cont) {
    const xm = Math.round((rg.x0 + rg.x1) / 2);
    await b.S('Input.dispatchMouseEvent', { type: 'mousePressed', x: xm, y: rg.y, button: 'left', buttons: 1, clickCount: 1 });
    await b.S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xm, y: rg.y, button: 'left', buttons: 0, clickCount: 1 });
    const abriu = await b.waitFor(`!!document.querySelector('#canvaswrap .pop')`, 3000);
    const pw = await b.ev(ponto('#canvaswrap'));
    for (let k = 0; k < 16 && (await b.ev(DOMINANTE)) < alvoG + 2; k++) { for (let i = 0; i < 4; i++) await b.S('Input.dispatchMouseEvent', { type: 'mouseWheel', x: pw.x, y: pw.y, deltaX: 0, deltaY: 120 }); await estavel(b, POS, 4000); }
    await sleep(400);
    const dp = await b.ev(`({ aviso: !!document.querySelector('#canvaswrap .pop'), pagina: (${diag}).pagina, dominante: ${DOMINANTE}, input: document.getElementById('pageInput').value })`);
    check(L + 'aviso do grifo aberto na p. ' + alvoG + ' e a roda desce duas folhas: o aviso fecha e a página acompanha a folha do quadro', !!abriu && !dp.aviso && dp.dominante >= alvoG + 2 && dp.pagina === dp.dominante && dp.input === String(dp.dominante), { abriu: !!abriu, ...dp });
  }
  // 9. «Trecho a trecho» no último trecho da página: o primeiro trecho da página seguinte, centrado, sem voltar
  const T = trechos.pages.find(p => p.page > 80 && p.segs.length >= 3 && trechos.pages[p.page] && trechos.pages[p.page].segs.length >= 2);
  await irPara(b, T.page); await estavel(b, POS);
  await b.ev(`document.getElementById('btnStep').click(); true`); await b.waitFor(visivel('stepbar'), 3000);
  for (let k = 1; k < T.segs.length; k++) { await b.ev(`document.getElementById('stepNext').click(); true`); await sleep(120); }
  await estavel(b, POS);
  await b.ev(`document.getElementById('stepNext').click(); true`);
  const amostras = []; for (let k = 0; k < 8; k++) { await sleep(200); amostras.push(await b.ev(`(${diag}).pagina`)); }
  await estavel(b, POS);
  const tt = await b.ev(`({ ativo: (document.querySelector('#segs .seg.active') || {}).id || null, pagina: (${diag}).pagina, centro: ${CENTRO_PDF} })`);
  const prim = trechos.pages[T.page].segs[0].id;
  check(L + '«Trecho a trecho» no fim da p. ' + T.page + ': o primeiro trecho da p. ' + (T.page + 1) + ', centrado, e a página não volta', tt.pagina === T.page + 1 && tt.ativo === 'seg-' + prim && tt.centro.realce && tt.centro.centrado && amostras.every(p => p === T.page + 1), { ...tt, amostras });
  await b.ev(`document.getElementById('btnStep').click(); true`);
  // 10. recortes depois de rolar: a cópia em alta da página de equações só desenha com a rolagem quieta (parada e 250 ms
  // sem evento de rolagem: a roda dispara um scrollend a cada entalhe do lote) e é interrompida se a rolagem voltar
  // durante o desenho. Um ouvinte do teste, na captura do documento (roda antes do ouvinte do app no mesmo evento),
  // registra todos os eventos de rolagem do quadro; nenhum pode cair nos 250 ms antes do começo da cópia que ficou pronta
  // nem durante o desenho dela (depois do fim, a rolagem é livre: a cópia pronta vale para a página)
  const pe = PAGS.eq, esperados = trechos.pages[pe - 1].segs.filter(ehRecorte).length;
  const ROLS = `(() => { window.__rols = []; if (!window.__ouveRols) { window.__ouveRols = 1; document.addEventListener('scroll', e => { if (e.target && e.target.id === 'canvaswrap') window.__rols.push(performance.now()); }, { capture: true, passive: true }); } return true; })()`;
  const PRONTO = `(() => { const cs = [...document.querySelectorAll('#segs canvas.crop')]; return (${diag}).pagina === ${pe} && (${diag}).recorte.pagina === ${pe} && cs.length === ${esperados} && cs.every(c => c.dataset.res === 'alta'); })()`;
  const janela = (rc, rols) => {
    const antes = rols.filter(t => t < rc.ini), depois = rols.filter(t => t > rc.fim);
    return { eventosDeRolagem: rols.length, dentroDaJanela: rols.filter(t => t >= rc.ini - 250 && t <= rc.fim).map(t => Math.round(t - rc.ini)),
      folgaDoTeste: antes.length ? Math.round(rc.ini - Math.max(...antes)) : null, depoisDoFim: depois.length };
  };
  const quieta = (rc, cont) => { const ini = rc.inicio || {}; return ini.parado === true && ini.gesto === false && ini.embalo === false && ini.fila === false && ini.desdeTroca >= 250 && (typeof rc.calma === 'number' ? rc.calma >= 250 : !cont); };
  await irPara(b, Math.max(1, pe - 1)); await estavel(b, POS);
  await b.ev(ROLS);
  if (cont) await rodaAte(b, pe, 120); else { await b.ev(`document.getElementById('btnNext').click(); true`); }
  const pronto = await b.waitFor(PRONTO, 20000);
  const rc = (await b.ev(diag)).medidor.recorte, jn = janela(rc, await b.ev('window.__rols'));
  check(L + 'recortes da p. ' + pe + ' depois de rolar: em alta, começados com a rolagem parada, sem gesto nem embalo, com a fila de desenho vazia, 250 ms ou mais depois da troca e do último evento de rolagem; nenhum evento de rolagem nos 250 ms antes do começo nem durante o desenho',
    !!pronto && rc.p === pe && quieta(rc, cont) && jn.dentroDaJanela.length === 0,
    { pronto: !!pronto, recorte: rc, ...jn });
  // 10b. a rolagem que volta durante a cópia em alta a interrompe. Com a cópia da p. pe em curso (diagnóstico,
  // recorte.emCurso), o teste rola 60 px dentro da folha e entrega o evento de rolagem no mesmo instante: o do navegador
  // só chegaria no quadro seguinte, depois de uma fatia do pdf.js, e uma cópia curta podia terminar nela. A vigia olha a
  // cada tarefa e a cada quadro, então vê a cópia antes da primeira fatia. A cópia em curso tem de ser cancelada, e a que
  // fica pronta recomeça 250 ms ou mais depois, sem evento de rolagem nos 250 ms antes do começo nem durante o desenho
  await irPara(b, pe + 1); await estavel(b, POS);
  await b.ev(ROLS);
  await b.ev(`(() => { window.__estimulo = new Promise(res => { const w = document.getElementById('canvaswrap'), t0 = performance.now(); let feito = false;
    const olha = () => { if (feito) return true; const r = window.mesa.diagnostico().recorte;
      if (r.emCurso === ${pe}) { feito = true; const de = w.scrollTop; w.scrollTop = de + 60; w.dispatchEvent(new Event('scroll')); res({ t: performance.now(), de, para: w.scrollTop }); return true; }
      if (performance.now() - t0 > 25000) { feito = true; res(null); return true; }
      return false; };
    const porTarefa = () => { if (!olha()) setTimeout(porTarefa, 0); }, porQuadro = () => { if (!olha()) requestAnimationFrame(porQuadro); };
    porTarefa(); requestAnimationFrame(porQuadro); }); return true; })()`);
  await irPara(b, pe);
  const est = await b.ev('window.__estimulo');
  const pronto2 = await b.waitFor(PRONTO, 20000);
  const rc2 = (await b.ev(diag)).medidor.recorte, jn2 = janela(rc2, await b.ev('window.__rols'));
  check(L + 'a rolagem que volta durante a cópia em alta da p. ' + pe + ' a interrompe: a cópia em curso é cancelada, e a que fica pronta recomeça 250 ms ou mais depois, sem evento de rolagem nos 250 ms antes do começo nem durante o desenho',
    !!est && est.para > est.de && !!pronto2 && rc2.p === pe && rc2.interrompida >= 1 && rc2.ini >= est.t + 250 && quieta(rc2, true) && jn2.dentroDaJanela.length === 0,
    { estimulo: est, pronto: !!pronto2, recorte: rc2, ...jn2 });
  // 11. reabrir numa página salva acima de 1: a folha dela no topo, sem virada espontânea
  await irPara(b, 33); await estavel(b, POS); await sleep(300);
  await b.ev('window.__antes = 1');
  await b.S('Page.reload', { ignoreCache: false });
  await b.waitFor('!window.__antes', 10000);
  await b.waitFor(`${diag} && (${diag}).pronta && (${diag}).tese && (${diag}).paginaDesenhada === 33`, 30000);
  const vira = []; for (let k = 0; k < 8; k++) { await sleep(200); vira.push(await b.ev(`(${diag}).pagina`)); }
  const ab = await b.ev(`({ topo: document.getElementById('canvaswrap').scrollTop, folha: ${TOPO(33)}, input: document.getElementById('pageInput').value, trocas: (${diag}).medidor.trocas.map(t => t.via), modo: (${diag}).rolagem })`);
  check(L + 'reabrir na p. 33: a folha 33 no topo do quadro e nenhuma virada pela rolagem', vira.every(p => p === 33) && Math.abs(ab.topo - ab.folha) <= 1 && ab.input === '33' && !ab.trocas.includes('rolagem') && ab.modo === (cont ? 'continua' : 'unica'), { vira, ...ab });
  // memória: o teto vale em todas as amostras
  const df = await amostraMP(b);
  check(L + 'memória: megapixels vivos sempre dentro do teto (' + df.tetoMP + ' MP) em todas as amostras', mpMaior > 0 && mpMaior <= df.tetoMP, { maior: mpMaior, agora: df.megapixels, folhasVivas: df.folhasVivas, dpr: df.dpr });
  const png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'folhas-' + R + '.png'), Buffer.from(png.data, 'base64'));
}

// ---------- filtro de comentários (gaveta «Comentários») ----------
// Comentários respondidos de mentira entram direto no IndexedDB, como ficam no tablet depois de uma sincronização com
// respostas; levam só ids de trecho do trechos.json (nenhum texto da tese) e um id de trecho que não existe na tiragem.
const INJETA = docs => `(async () => { const db = await new Promise((res, rej) => { const r = indexedDB.open('mesa'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  await new Promise((res, rej) => { const tx = db.transaction(['comentarios', 'revisadas'], 'readwrite'); for (const [s, d] of ${JSON.stringify(docs)}) tx.objectStore(s).put(d); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  db.close(); return true; })()`;
// botões, número do botão «Comentários», cartões da lista, «Mostrar N», pontos do PDF (na ordem dos trechos) e a gaveta
const ESTADO_FILTRO = `(() => { const q = id => document.getElementById(id), dr = q('drawer'), aberta = getComputedStyle(dr).display !== 'none', d = dr.getBoundingClientRect();
  const botoes = ['todos', 'sem_resposta', 'respondidos'].map(f => { const b = q('filtro-' + f), r = b.getBoundingClientRect(); return { texto: b.textContent, on: b.classList.contains('on'), aria: b.getAttribute('aria-pressed'), visivel: aberta && r.width > 0 && r.height >= 40 && r.left >= d.left - 1 && r.right <= d.right + 1 && r.top >= 0 && r.bottom <= innerHeight }; });
  const mo = q('segOcultos');
  return { botoes, ativo: ['todos', 'sem_resposta', 'respondidos'].filter(f => q('filtro-' + f).classList.contains('on')), cmCount: q('cmCount').textContent, cms: document.querySelectorAll('#segs .cm').length,
    mostrar: mo ? mo.textContent : null, mostrarNoFim: !!mo && q('segs').lastElementChild === mo, hl: [...document.querySelectorAll('.sheet.cur .hl')].map(h => h.className.replace(/ active/, '')),
    gaveta: aberta ? document.querySelectorAll('#drawerList .cm').length : null, guardado: localStorage.getItem('mesa.filtro'), comentarios: window.mesa.diagnostico().comentarios }; })()`;
const COPIAR_LOTE = `(() => { let t = ''; return new Promise(res => { navigator.clipboard.writeText = x => { t = x; res(t); return Promise.resolve(); }; document.getElementById('btnCopy').click(); setTimeout(() => res(t), 1500); }); })()`;
// marca do mapa de páginas: classe e o ::after (anel cinza ou ponto azul), comparado à cor var(--muted) de .hint
const MARCA = n => `(() => { const e = [...document.querySelectorAll('#pgrid .pg')][${n - 1}], a = getComputedStyle(e, '::after'), muted = getComputedStyle(document.querySelector('.hint')).color;
  return { classe: e.className, fundo: a.backgroundColor, borda: a.borderTopColor, conteudo: a.content, anelCinza: a.backgroundColor === 'rgba(0, 0, 0, 0)' && a.borderTopColor === muted && parseFloat(a.borderTopWidth) >= 2, fundoPg: getComputedStyle(e).backgroundColor }; })()`;
// um aviso (toast) por cima dos botões roubaria o toque (no leiaute estreito ele cobre a segunda linha da barra do topo): espera ele sumir
const semAviso = b => b.waitFor(`!document.querySelector('.toast')`, 4000);
async function abrirGaveta(b) { if (!(await b.ev(visivel('drawer')))) { await semAviso(b); await clicar(b, `document.getElementById('btnDrawer')`); } return b.waitFor(visivel('drawer'), 3000); }
async function filtrar(b, f) { await abrirGaveta(b); await semAviso(b); const c = await clicar(b, `document.getElementById('filtro-${f}')`); await sleep(200); return !!c && c.topo; }
async function fecharGaveta(b) { await b.ev(`document.getElementById('btnDrawerClose').click(); true`); await sleep(200); }
async function testeFiltro(b, P, Q, larg, alt, out) {
  const L = larg + ' px: ', i0 = 0, i1 = 1;
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: 1, mobile: false });
  await sleep(600);
  await irPara(b, P.page);
  const tocouT = await filtrar(b, 'todos');
  const e0 = await b.ev(ESTADO_FILTRO);
  check(L + 'gaveta: três botões em texto, «Todos (7)», «Sem resposta (2)», «Respondidos (5)», visíveis e tocáveis; «Todos» ativo', tocouT && e0.botoes.map(x => x.texto).join('|') === 'Todos (7)|Sem resposta (2)|Respondidos (5)' && e0.botoes.every(x => x.visivel) && e0.ativo.join() === 'todos' && e0.botoes[0].aria === 'true', e0.botoes);
  check(L + '«Todos»: lista com os 5 comentários da página, sem «Mostrar N»; ponto azul no trecho com sem resposta e anel no só respondido; número 7; gaveta com 7', e0.cms === 5 && e0.mostrar === null && e0.hl[i0] === 'hl has' && e0.hl[i1] === 'hl has done' && e0.cmCount === '7' && e0.gaveta === 7, { cms: e0.cms, mostrar: e0.mostrar, hl: e0.hl.slice(0, 2), cmCount: e0.cmCount, gaveta: e0.gaveta });
  let png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'filtro-gaveta-todos-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  // «Sem resposta»
  const tocouS = await filtrar(b, 'sem_resposta');
  const e1 = await b.ev(ESTADO_FILTRO);
  check(L + '«Sem resposta»: 2 na lista e na gaveta, número 2, «Mostrar 3 respondidos» no fim da lista (o de trecho ausente não conta), PDF só com o ponto do trecho aberto', tocouS && e1.ativo.join() === 'sem_resposta' && e1.botoes[1].aria === 'true' && e1.cms === 2 && e1.gaveta === 2 && e1.cmCount === '2' && e1.mostrar === 'Mostrar 3 respondidos' && e1.mostrarNoFim && e1.hl[i0] === 'hl has' && e1.hl[i1] === 'hl' && e1.guardado === '"sem_resposta"', { ativo: e1.ativo, cms: e1.cms, gaveta: e1.gaveta, cmCount: e1.cmCount, mostrar: e1.mostrar, hl: e1.hl.slice(0, 2) });
  check(L + 'com filtro, os totais dos botões não mudam e o diagnóstico conta todos', e1.botoes.map(x => x.texto).join('|') === 'Todos (7)|Sem resposta (2)|Respondidos (5)' && e1.comentarios === 7, e1.botoes.map(x => x.texto));
  png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'filtro-gaveta-sem-resposta-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  const lote = await b.ev(COPIAR_LOTE);
  check(L + '«Copiar lote» com «Sem resposta» leva tudo (7 comentários, inclusive os por enviar e os respondidos)', /Comentários: 7\. /.test(lote || '') && (lote || '').includes('Comentário de teste sem rede') && (lote || '').includes('Comentário respondido de teste 1'), (lote || '').split('\n')[1]);
  await fecharGaveta(b);
  const q1 = await b.ev(`(() => { const e = document.getElementById('segOcultos'); e.scrollIntoView({ block: 'center' }); const r = e.closest('#listwrap').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()`);
  png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...q1, scale: 1 } });
  writeFileSync(join(out, 'filtro-mostrar-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  // mapa de páginas com «Sem resposta»: a página só com respondidos fica sem marca
  await semAviso(b); await clicar(b, `document.getElementById('btnPages')`); await b.waitFor(visivel('pagesDrawer'), 3000);
  const ms = await b.ev(MARCA(Q.page)), mp = await b.ev(MARCA(P.page));
  check(L + 'mapa com «Sem resposta»: p. ' + Q.page + ' (só respondidos) sem marca; p. ' + P.page + ' (grifo e sem resposta) com o ponto azul', !/ has/.test(ms.classe) && / has/.test(mp.classe) && !/done/.test(mp.classe), { q: ms.classe, p: mp.classe });
  await b.ev(`document.getElementById('btnPagesClose').click(); true`);
  // «Respondidos»
  const tocouR = await filtrar(b, 'respondidos');
  const e2 = await b.ev(ESTADO_FILTRO);
  check(L + '«Respondidos»: 3 na lista e 5 na gaveta, número 5, «Mostrar 2 sem resposta»; o trecho com sem resposta oculto mantém o ponto azul, o só respondido tem anel', tocouR && e2.ativo.join() === 'respondidos' && e2.cms === 3 && e2.gaveta === 5 && e2.cmCount === '5' && e2.mostrar === 'Mostrar 2 sem resposta' && e2.mostrarNoFim && e2.hl[i0] === 'hl has' && e2.hl[i1] === 'hl has done', { cms: e2.cms, gaveta: e2.gaveta, cmCount: e2.cmCount, mostrar: e2.mostrar, hl: e2.hl.slice(0, 2) });
  await fecharGaveta(b);
  await b.waitFor(`(${diag}).paginaDesenhada === ${P.page}`, 15000);
  const anelPdf = await b.ev(`(() => { const h = [...document.querySelectorAll('.sheet.cur .hl')][${i1}], a = getComputedStyle(h, '::after'), muted = getComputedStyle(document.querySelector('.hint')).color; h.scrollIntoView({ block: 'center' }); const w = document.getElementById('canvaswrap').getBoundingClientRect();
    return { anel: a.backgroundColor === 'rgba(0, 0, 0, 0)' && a.borderTopColor === muted && parseFloat(a.borderTopWidth) >= 2, fundo: a.backgroundColor, borda: a.borderTopColor, clip: { x: w.left, y: w.top, width: w.width, height: w.height } }; })()`);
  check(L + 'PDF: o trecho só com respondidos tem anel cinza (var(--muted)), não ponto verde', anelPdf.anel, { fundo: anelPdf.fundo, borda: anelPdf.borda });
  png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...anelPdf.clip, scale: 1 } });
  writeFileSync(join(out, 'filtro-pdf-respondidos-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  await semAviso(b); await clicar(b, `document.getElementById('btnPages')`); await b.waitFor(visivel('pagesDrawer'), 3000);
  const mr = await b.ev(MARCA(Q.page));
  check(L + 'mapa com «Respondidos»: p. ' + Q.page + ' (revisada, só respondidos) com anel cinza sobre o verde, nunca ponto verde', / has done/.test(mr.classe) && / rev/.test(mr.classe) && mr.anelCinza && mr.conteudo !== 'none', mr);
  const qp = await b.ev(`(() => { const e = [...document.querySelectorAll('#pgrid .pg')][${Q.page - 1}]; e.scrollIntoView({ block: 'center' }); const r = document.getElementById('pgrid').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: Math.min(r.height, innerHeight - r.top) }; })()`);
  png = await b.S('Page.captureScreenshot', { format: 'png', clip: { ...qp, scale: 1 } });
  writeFileSync(join(out, 'filtro-mapa-respondidos-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  await b.ev(`document.getElementById('btnPagesClose').click(); true`);
  // «Mostrar N» volta a «Todos»
  await filtrar(b, 'sem_resposta');
  await fecharGaveta(b);
  const cm = await clicar(b, `document.getElementById('segOcultos')`); await sleep(200);
  const e3 = await b.ev(ESTADO_FILTRO);
  check(L + 'tocar em «Mostrar 3 respondidos» volta a «Todos» e guarda a escolha', !!cm && cm.topo && e3.ativo.join() === 'todos' && e3.cms === 5 && e3.mostrar === null && e3.cmCount === '7' && e3.guardado === '"todos"', { ativo: e3.ativo, cms: e3.cms, guardado: e3.guardado });
  // a escolha sobrevive a recarregar
  await filtrar(b, 'sem_resposta');
  await fecharGaveta(b);
  await b.ev('window.__antes = 1');
  await b.S('Page.reload', { ignoreCache: false });
  await b.waitFor('!window.__antes', 10000);
  await b.waitFor(`${diag} && (${diag}).pronta && (${diag}).comentarios === 7 && (${diag}).paginaDesenhada === ${P.page}`, 30000);
  const e4a = await b.ev(ESTADO_FILTRO);
  await abrirGaveta(b);
  const e4 = await b.ev(ESTADO_FILTRO);
  check(L + 'depois de recarregar, o filtro continua «Sem resposta» (o primeiro desenho já sai filtrado: lista 2, número 2, «Mostrar 3 respondidos»)', e4a.cms === 2 && e4a.cmCount === '2' && e4a.mostrar === 'Mostrar 3 respondidos' && e4.ativo.join() === 'sem_resposta' && e4.botoes[1].aria === 'true' && e4.gaveta === 2, { lista: e4a.cms, cmCount: e4a.cmCount, ativo: e4.ativo });
  png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'filtro-recarregado-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  await filtrar(b, 'todos');
  await fecharGaveta(b);
}
// salvar com «Respondidos» ativo: salva normalmente, avisa onde o novo está e não troca o filtro
async function testeFiltroSalvar(b, P, out) {
  await filtrar(b, 'respondidos');
  await fecharGaveta(b);
  await b.ev(`(() => { const x = [...${TRECHOS}[1].querySelectorAll('.acts button')].find(b => b.textContent === 'Comentar'); x.click(); return true; })()`);
  await b.waitFor(visivel('composer'), 3000);
  await b.ev(`document.getElementById('compText').value = 'Comentário novo com o filtro Respondidos'; true`);
  await clicar(b, `document.getElementById('btnCompSave')`);
  const aviso = await b.waitFor(`[...document.querySelectorAll('.toast')].map(t => t.textContent).find(t => /^Salvo na p\\. /.test(t)) || ''`, 3000);
  const e = await b.ev(ESTADO_FILTRO);
  check('salvar com «Respondidos»: avisa «Salvo na p. ' + P.page + '; está em «Sem resposta»», salva e não troca o filtro', aviso === 'Salvo na p. ' + P.page + '; está em «Sem resposta»' && e.comentarios === 8 && e.guardado === '"respondidos"' && e.ativo.join() === 'respondidos' && e.mostrar === 'Mostrar 3 sem resposta' && e.cmCount === '5', { aviso, comentarios: e.comentarios, guardado: e.guardado, mostrar: e.mostrar });
  const png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'filtro-salvar-respondidos.png'), Buffer.from(png.data, 'base64'));
  await filtrar(b, 'todos');
  await fecharGaveta(b);
}

// ---------- chave «Sincronização automática» (⚙ → «Sincronização») ----------
// GitHub de mentira: as requisições da página a api.github.com são interceptadas pelo protocolo (Fetch) e respondidas
// aqui mesmo (o preflight com 204, o resto com 401, como um token inválido); cada uma fica registrada (também por
// Network.requestWillBeSent), só método, caminho e hora, nunca os cabeçalhos
const GH_CORS = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: 'authorization, accept, content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET, PUT' }, { name: 'Content-Type', value: 'application/json' }];
const GH_ESTADO = '/repos/teste-e2e/mesa-dados/contents/dados/estado.json';
async function githubFalso(b) {
  const reg = { pedidos: [], interceptados: [] };
  b.cdp.subs.push(m => {
    if (m.sessionId !== b.sessionId) return;
    if (m.method === 'Network.requestWillBeSent' && /^https:\/\/api\.github\.com\//.test(m.params.request.url)) reg.pedidos.push({ t: Date.now(), metodo: m.params.request.method, caminho: new URL(m.params.request.url).pathname });
    if (m.method === 'Fetch.requestPaused') {
      const q = m.params.request, pre = q.method === 'OPTIONS';
      reg.interceptados.push({ t: Date.now(), metodo: q.method, caminho: new URL(q.url).pathname });
      b.S('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: pre ? 204 : 401, responseHeaders: GH_CORS, body: pre ? '' : Buffer.from('{"message":"Bad credentials"}').toString('base64') }).catch(() => { });
    }
  });
  await b.S('Fetch.enable', { patterns: [{ urlPattern: '*://api.github.com/*', requestStage: 'Request' }] });
  return reg;
}
const ghMarca = gh => ({ p: gh.pedidos.length, i: gh.interceptados.length });
const ghNovos = (gh, d) => ({ pedidos: gh.pedidos.slice(d.p), interceptados: gh.interceptados.slice(d.i) });
// tentativas de sincronização (sem o preflight), pelo maior dos dois registros
const tentativas = n => Math.max(n.pedidos.filter(x => x.metodo !== 'OPTIONS').length, n.interceptados.filter(x => x.metodo !== 'OPTIONS').length);
const nenhuma = n => !n.pedidos.length && !n.interceptados.length;
const caminhos = n => [...new Set(n.pedidos.concat(n.interceptados).filter(x => x.metodo !== 'OPTIONS').map(x => x.metodo + ' ' + x.caminho))];
async function esperarTentativa(gh, d, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (tentativas(ghNovos(gh, d)) > 0) return true; await sleep(100); } return false; }
// avisos (toasts) de cada documento, gravados desde o começo da página (antes dos scripts dela)
const TOASTS = `window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent); }).observe(document, { childList: true, subtree: true });`;
const AJUDA_SINC = 'Desligada, a Mesa só sincroniza quando você toca em Sincronizar. A fila continua guardada neste aparelho.';
const CHAVE_SINC = `(() => { const c = document.getElementById('cfgAutosync'), l = c.closest('label'), s = c.closest('section'), p = l.nextElementSibling, d = document.getElementById('cfgDrawer').getBoundingClientRect();
  l.scrollIntoView({ block: 'center' }); const r = l.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { secao: s && s.querySelector('h3').textContent, rotulo: l.textContent.trim(), marcada: c.checked, ajuda: p && p.tagName === 'P' ? p.textContent : null, tocavel: r.height >= 40 && r.left >= d.left - 1 && r.right <= d.right + 1 && !!h && l.contains(h) }; })()`;
const DICA = `(() => { const h = document.getElementById('syncHint'), r = h.getBoundingClientRect(); return { texto: h.textContent, numero: document.getElementById('syncCount').textContent, visivel: getComputedStyle(h).display !== 'none' && r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth }; })()`;
const dicaDesligada = n => n ? n + ' por enviar · automática desligada' : 'automática desligada';
// a chave pelo ⚙, com um toque no rótulo (como Alvaro faria); devolve o estado antes do toque e se a escolha ficou guardada
async function chaveSinc(b, on) {
  await semAviso(b); await clicar(b, `document.getElementById('btnCfg')`); await b.waitFor(visivel('cfgDrawer'), 3000);
  const ui = await b.ev(CHAVE_SINC);
  if (ui.marcada !== on) await clicar(b, `document.getElementById('cfgAutosync').closest('label')`);
  const ok = await b.waitFor(`localStorage.getItem('mesa.autosync') === '${on}' && (${diag}).autosync === ${on} && document.getElementById('cfgAutosync').checked === ${on}`, 3000);
  return { ui, ok: !!ok };
}
async function fecharCfg(b) { await b.ev(`document.getElementById('btnCfgClose').click(); true`); await b.waitFor(`!(${visivel('cfgDrawer')})`, 3000); }
async function recarregar(b, pag) {
  await b.ev('window.__antes = 1');
  await b.S('Page.reload', { ignoreCache: false });
  await b.waitFor('!window.__antes', 10000);
  return b.waitFor(`${diag} && (${diag}).pronta && (${diag}).tese && (${diag}).paginaDesenhada === ${pag}`, 30000);
}
async function testeAutosync(b, gh, larg, alt, pag, out) {
  const L = larg + ' px: ';
  await b.S('Emulation.setDeviceMetricsOverride', { width: larg, height: alt, deviceScaleFactor: 1, mobile: false });
  await sleep(600);
  await irPara(b, pag);
  // 1. a chave em ⚙: ligada, com a ajuda; desligar com um toque
  const des = await chaveSinc(b, false);
  check(L + '⚙ → «Sincronização»: chave «Sincronização automática» ligada, com a ajuda de uma linha, visível e tocável', des.ui.secao === 'Sincronização' && des.ui.rotulo === 'Sincronização automática' && des.ui.marcada === true && des.ui.ajuda === AJUDA_SINC && des.ui.tocavel, des.ui);
  let png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'autosync-chave-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  check(L + 'um toque desliga a chave: mesa.autosync = false e o aviso «Sincronização automática desligada»', des.ok && (await b.ev(`window.__toasts.includes('Sincronização automática desligada')`)));
  await fecharCfg(b);
  // 2. a dica com a fila como está e com um item a mais (a p. pag marcada revisada)
  const n0 = (await b.ev(diag)).porEnviar, d0 = await b.ev(DICA);
  check(L + 'desligada, ' + n0 + ' por enviar: a dica ao lado de Sincronizar diz «' + dicaDesligada(n0) + '»', d0.texto === dicaDesligada(n0) && d0.numero === String(n0) && d0.visivel, d0);
  await semAviso(b); await clicar(b, `document.getElementById('btnReviewed')`);
  await b.waitFor(`(${diag}).porEnviar === ${n0 + 1}`, 5000);
  const n = n0 + 1, d1 = await b.ev(DICA);
  check(L + 'desligada, com a p. ' + pag + ' marcada revisada: «' + dicaDesligada(n) + '»', d1.texto === dicaDesligada(n) && d1.visivel, d1);
  // 3. recarregar com a chave desligada e a fila cheia: 20 s sem requisição ao GitHub, mesmo com a volta para a aba, o
  //    foco e a rede de volta simulados; um aviso só ao abrir
  const marca = ghMarca(gh), t0 = Date.now();
  const abriu = await recarregar(b, pag);
  const dg = await b.ev(diag);
  check(L + 'recarregada com a chave desligada: abre na leitura, chave ainda desligada, ' + n + ' por enviar', !!abriu && dg.autosync === false && dg.porEnviar === n && (await b.ev(`localStorage.getItem('mesa.autosync')`)) === 'false', { autosync: dg.autosync, porEnviar: dg.porEnviar });
  await sleep(Math.max(0, t0 + 5000 - Date.now()));
  await b.ev(`document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('online')); true`);
  await sleep(Math.max(0, t0 + 20000 - Date.now()));
  const vinte = ghNovos(gh, marca);
  check(L + 'desligada: nenhuma requisição a api.github.com nos primeiros 20 s depois de recarregar (abertura, volta para a aba, foco e rede de volta)', nenhuma(vinte), { segundos: Math.round((Date.now() - t0) / 1000), pedidos: vinte.pedidos.length, interceptados: vinte.interceptados.length });
  const avisos = await b.ev(`window.__toasts.filter(t => /sincronização automática/.test(t))`);
  check(L + 'ao abrir com a fila cheia: um aviso só, «' + n + ' por enviar; sincronização automática desligada»', avisos.length === 1 && avisos[0] === n + ' por enviar; sincronização automática desligada', avisos);
  const d2 = await b.ev(DICA);
  check(L + 'depois de recarregar, a dica diz «' + dicaDesligada(n) + '»', d2.texto === dicaDesligada(n) && d2.visivel, d2);
  png = await b.S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, 'autosync-desligada-' + larg + '.png'), Buffer.from(png.data, 'base64'));
  // 4. tocar em Sincronizar dispara a tentativa (o GitHub de mentira responde 401)
  const m4 = ghMarca(gh);
  await semAviso(b); const tocou = await clicar(b, `document.getElementById('btnSync')`);
  const tentou = await esperarTentativa(gh, m4);
  const aviso4 = await b.waitFor(`window.__toasts.find(t => /^Não sincronizou: /.test(t)) || ''`, 8000);
  const d4 = await b.ev(DICA), n4 = ghNovos(gh, m4);
  check(L + 'desligada: tocar em Sincronizar dispara a tentativa (GET do estado.json) e avisa o 401; a dica continua «' + dicaDesligada(n) + '»', !!tocou && tocou.topo && tentou && caminhos(n4).join() === 'GET ' + GH_ESTADO && /token inválido/.test(aviso4) && d4.texto === dicaDesligada(n), { tentativas: tentativas(n4), caminhos: caminhos(n4), aviso: aviso4, dica: d4.texto });
  // 5. religar volta ao padrão: tenta na hora; recarregada, tenta ao abrir e ao voltar para a aba
  const m5 = ghMarca(gh);
  const lig = await chaveSinc(b, true);
  const tentou5 = await esperarTentativa(gh, m5);
  await fecharCfg(b);
  const d5 = await b.ev(DICA);
  check(L + 'religada em ⚙: mesa.autosync = true, tenta na hora e a dica sai de «automática desligada»', lig.ok && tentou5 && !/automática desligada/.test(d5.texto), { tentativas: tentativas(ghNovos(gh, m5)), dica: d5.texto });
  const m6 = ghMarca(gh);
  const abriu6 = await recarregar(b, pag);
  const tentou6 = await esperarTentativa(gh, m6, 10000);
  await b.waitFor(`(${diag}).sync.estado === 'erro'`, 10000); await sleep(300);
  const m7 = ghMarca(gh);
  await b.ev(`document.dispatchEvent(new Event('visibilitychange')); true`);
  const tentou7 = await esperarTentativa(gh, m7);
  const avisos6 = await b.ev(`window.__toasts.filter(t => /sincronização automática/.test(t))`), d6 = await b.ev(DICA);
  check(L + 'religada e recarregada: volta ao padrão (tenta ao abrir e ao voltar para a aba, sem o aviso de desligada)', !!abriu6 && tentou6 && tentou7 && avisos6.length === 0 && !/automática desligada/.test(d6.texto), { abertura: tentativas(ghNovos(gh, m6)) - tentativas(ghNovos(gh, m7)), volta: tentativas(ghNovos(gh, m7)), avisos: avisos6, dica: d6.texto });
}

// ---------- fase P: linhas de versão e «Proposta de modificação», tudo fictício ----------
// Duas tiragens de mentira (PDFs gerados aqui, com texto inventado em ASCII): uma da linha «nucleo» e outra da
// «fallback», com comentários das duas na mesma página e no mesmo trecho, um grifo e uma página revisada do núcleo, e
// quatro propostas na do fallback (uma «toca a reivindicação», uma «já aplicada», uma de equação com o trecho LaTeX e
// uma de prioridade C). O repositório de dados é um GitHub de mentira em memória, servido pelo protocolo (Fetch) aos
// dois «aparelhos» (dois contextos do navegador, cada um com o seu IndexedDB) e, no Node, ao cliente antigo (o sync.js
// de b001cd8). api.github.com resolve para NOTFOUND: nada sai do PC. Provas em imagem a 390 px (telefone) e 1024 px.
const PERFIL_P = join(OUT, 'perfil-propostas'), DOWN_P = join(OUT, 'downloads-propostas'), FOTOS_P = join(OUT, 'propostas');
const sha256hex = buf => createHash('sha256').update(buf).digest('hex');
// PDF mínimo: uma página por lista de linhas, Helvetica 12, de cima para baixo a partir de y = 760, 40 pt entre linhas
function pdfFicticio(paginas) {
  const objs = [], add = s => { objs.push(s); return objs.length; };
  const cat = add(null), pags = add(null), fonte = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'), kids = [];
  paginas.forEach(linhas => {
    const conteudo = linhas.map((l, i) => `BT /F1 12 Tf 72 ${760 - i * 40} Td (${l.replace(/[\\()]/g, m => '\\' + m)}) Tj ET`).join('\n');
    const c = add(`<< /Length ${Buffer.byteLength(conteudo, 'latin1')} >>\nstream\n${conteudo}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pags} 0 R /MediaBox [0 0 595.3 841.9] /Resources << /Font << /F1 ${fonte} 0 R >> >> /Contents ${c} 0 R >>`));
  });
  objs[cat - 1] = `<< /Type /Catalog /Pages ${pags} 0 R >>`;
  objs[pags - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
// trechos.json no formato do extrator (schema 2): um trecho por linha, caixa em pontos com o topo da página em 0
function trechosFicticios(pdf, paginas, equacoes = {}) {
  return { schema: 2, sha256: sha256hex(pdf), pages: paginas.map((linhas, ip) => ({ page: ip + 1, label: String(ip + 1), w: 595.3, h: 841.9,
    segs: linhas.map((l, i) => { const id = `p${ip + 1}-${i + 1}`, top = +(71.9 + 40 * i).toFixed(1), eq = !!equacoes[id];
      return Object.assign({ id, kind: eq ? 'equation' : 'text', bbox: [70, top, 525, +(top + 14).toFixed(1)], y: top, h: 14, text: l }, eq ? { label: equacoes[id] } : {}); }) })) };
}
const TXT_NUC = [
  ['Nucleo de teste, pagina um, primeiro paragrafo inventado.', 'Segundo paragrafo do nucleo de teste, com uma frase sobre o modelo.', 'Terceiro paragrafo do nucleo de teste.'],
  ['Pagina dois do nucleo de teste.', 'Outro paragrafo do nucleo.'],
  ['Pagina tres do nucleo de teste, paragrafo unico.'],
];
const TXT_FB = [
  ['Versao de teste da outra linha, pagina um, primeiro paragrafo.', 'Segundo paragrafo da outra linha sobre o mesmo assunto.', 'O modelo estima os coeficientes do voo com a perda fisica e os dados gravados.'],
  ['A versao anterior dizia que o modelo valida a hipotese.', 'x = y - z (2.1)', 'Paragrafo final da pagina dois.'],
  ['Pagina tres da outra linha, paragrafo unico com texto suficiente para uma proposta.'],
];
const T0P = '2026-10-15T17:00:00.000Z';
function dadosFicticios() {
  const pdfN = pdfFicticio(TXT_NUC), pdfF = pdfFicticio(TXT_FB), tn = sha256hex(pdfN).slice(0, 8), tf = sha256hex(pdfF).slice(0, 8);
  const treN = trechosFicticios(pdfN, TXT_NUC), treF = trechosFicticios(pdfF, TXT_FB, { 'p2-2': 'Equação (2.1)' });
  const man = (t, pdf, tre, linha, nome) => ({ tiragem: t, sha256: sha256hex(pdf), arquivo: 'tese.pdf', bytes: pdf.length, paginas: tre.pages.length, data: '15/10/2026, ' + nome, nome, linha });
  const prop = (id, pagina, trecho, extra) => Object.assign({ id, tiragem: tf, linha: 'fallback', pagina, trecho, texto_trecho: treF.pages[pagina - 1].segs.find(s => s.id === trecho).text.slice(0, 240),
    origem: ['R1'], prova: 'regua-de-teste.md', prioridade: 'B', toca_reivindicacao: false, ja_aplicada: false, depende_de: '', tex: null,
    estado: 'proposta', texto_final: '', criado_em: T0P, atualizado_em: T0P, decidido_em: null, sync: 'enviado' }, extra);
  const props = [
    prop('xe2e0000000a', 1, 'p1-3', { proposta: 'O modelo identifica os coeficientes do voo com a perda fisica e os dados gravados.', motivo: 'Coeficientes se identificam; estados se estimam (regra de teste).',
      diff: [['igual', 'O modelo '], ['sai', 'estima '], ['entra', 'identifica '], ['igual', 'os coeficientes do voo com a perda fisica e os dados gravados.']], prioridade: 'A', toca_reivindicacao: true,
      origem: ['R1', 'c-teste'], tex: { arquivo: 'cap1.tex', antes: 'O modelo estima os coeficientes', depois: 'O modelo identifica os coeficientes' } }),
    prop('xe2e0000000b', 2, 'p2-1', { proposta: 'A versao anterior dizia que o modelo valida a hipotese.', motivo: 'Frase reescrita numa rodada anterior de teste.', ja_aplicada: true,
      diff: [['igual', 'A versao anterior dizia que o modelo '], ['sai', 'comprova '], ['entra', 'valida '], ['igual', 'a hipotese.']], origem: ['B2'] }),
    prop('xe2e0000000c', 2, 'p2-2', { proposta: 'x = y - z (2.1)', motivo: 'Sinal conferido no codigo de teste.', prioridade: 'A', depende_de: 'Q2',
      diff: [['igual', 'x = y '], ['sai', '+ '], ['entra', '- '], ['igual', 'z (2.1)']], tex: { arquivo: 'cap2.tex', antes: 'x = y + z', depois: 'x = y - z' } }),
    prop('xe2e0000000d', 3, 'p3-1', { proposta: 'Pagina tres da outra linha, paragrafo curto.', motivo: 'Paragrafo mais curto.', prioridade: 'C',
      diff: [['igual', 'Pagina tres da outra linha, paragrafo '], ['sai', 'unico com texto suficiente para uma proposta.'], ['entra', 'curto.']] }),
  ];
  const com = (id, t, linha, texto) => Object.assign({ id, pagina: 1, trecho: 'p1-2', grifo: null, tipo_trecho: 'text', y: 111.9, texto_trecho: 'texto', criado_em: T0P, estado: 'aberto', tiragem: t, tipo: 'correcao', texto, atualizado_em: T0P, sync: 'enviado' }, linha ? { linha } : {});
  const estado = { schema: 1, tiragem: tf, gerado_em: T0P, atualizado_em: T0P,
    comentarios: [com('cnuc1', tn, null, 'Comentario de teste do nucleo na p. 1'), com('cfb1', tf, 'fallback', 'Comentario de teste da outra linha na p. 1')],
    grifos: [{ id: 'gnuc1', pagina: 1, x: 0.1176, y: 0.0854, w: 0.7643, h: 0.0166, trecho: 'p1-1', texto_trecho: 'texto', criado_em: T0P, tiragem: tn, atualizado_em: T0P, sync: 'enviado' }],
    revisadas: [{ id: '2', pagina: 2, em: T0P, tiragem: tn, atualizado_em: T0P, sync: 'enviado' }], propostas: props, progresso: null, tombstones: [], extra_e2e: { versao: 'teste' } };
  const repo = { n: 0, log: [], commits: [], files: {} };
  const poe = (p, buf) => { repo.files[p] = { buf: Buffer.isBuffer(buf) ? buf : Buffer.from(typeof buf === 'string' ? buf : JSON.stringify(buf, null, 1)), sha: 'sha' + (++repo.n) }; };
  poe('tiragens/atual.json', { tiragem: tf });
  poe('tiragens/index.json', { tiragens: [{ tiragem: tn, linha: 'nucleo', nome: 'Nucleo de teste', paginas: 3 }, { tiragem: tf, linha: 'fallback', nome: 'Outra linha de teste', paginas: 3 }] });
  for (const [t, pdf, tre, linha, nome] of [[tn, pdfN, treN, 'nucleo', 'Nucleo de teste'], [tf, pdfF, treF, 'fallback', 'Outra linha de teste']]) {
    poe(`tiragens/${t}/tese.pdf`, pdf); poe(`tiragens/${t}/trechos.json`, tre); poe(`tiragens/${t}/manifest.json`, man(t, pdf, tre, linha, nome));
  }
  poe('dados/estado.json', estado); poe('dados/respostas.json', {});
  return { tn, tf, repo, props, estadoRepo: () => JSON.parse(repo.files['dados/estado.json'].buf.toString('utf8')) };
}
// o GitHub de mentira: conteúdo do repositório (GET: JSON com base64 ou bruto, conforme o Accept; PUT com o sha atual,
// senão 409), como a API de conteúdo; nunca olha nem registra o cabeçalho Authorization
function ghResponde(repo, metodo, caminho, accept, corpo) {
  const m = caminho.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
  if (!m) return { status: 404, json: { message: 'Not Found' } };
  const path = decodeURIComponent(m[1]), f = repo.files[path];
  repo.log.push(metodo + ' ' + path);
  if (metodo === 'GET') {
    if (!f) return { status: 404, json: { message: 'Not Found' } };
    if (/raw/.test(accept || '')) return { status: 200, buf: f.buf, tipo: 'application/octet-stream' };
    return { status: 200, json: { sha: f.sha, encoding: 'base64', content: f.buf.toString('base64') } };
  }
  if (metodo === 'PUT') {
    const b = JSON.parse(corpo || '{}');
    if (f && b.sha !== f.sha) return { status: 409, json: { message: 'sha desatualizado' } };
    repo.files[path] = { buf: Buffer.from(b.content || '', 'base64'), sha: 'sha' + (++repo.n) };
    repo.commits.push(b.message);
    return { status: 200, json: { content: { sha: repo.files[path].sha } } };
  }
  return { status: 405, json: {} };
}
async function servirRepo(d, repo) {
  d.cdp.subs.push(async m => {
    if (m.sessionId !== d.sessionId || m.method !== 'Fetch.requestPaused') return;
    const q = m.params.request;
    if (q.method === 'OPTIONS') { d.S('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 204, responseHeaders: GH_CORS, body: '' }).catch(() => { }); return; }
    let corpo = q.postData;
    if (corpo == null && q.postDataEntries) corpo = q.postDataEntries.map(e => Buffer.from(e.bytes || '', 'base64').toString('utf8')).join('');
    if (corpo == null && q.hasPostData) { try { corpo = (await d.S('Network.getRequestPostData', { requestId: m.params.networkId })).postData; } catch { } }
    const r = ghResponde(repo, q.method, new URL(q.url).pathname, q.headers.Accept || q.headers.accept || '', corpo);
    const buf = r.buf || Buffer.from(JSON.stringify(r.json));
    const hs = GH_CORS.filter(h => h.name !== 'Content-Type').concat([{ name: 'Content-Type', value: r.tipo || 'application/json' }]);
    d.S('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: r.status, responseHeaders: hs, body: buf.toString('base64') }).catch(() => { });
  });
  await d.S('Fetch.enable', { patterns: [{ urlPattern: '*://api.github.com/*', requestStage: 'Request' }] });
}
// segundo «aparelho»: outro contexto do navegador (IndexedDB, cache e localStorage próprios)
async function outroAparelho(b) {
  const { browserContextId } = await b.cdp.send('Target.createBrowserContext', {});
  const { targetId } = await b.cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await b.cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => b.cdp.send(m, p, sessionId), erros = [];
  b.cdp.subs.push(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push('console: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  });
  await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable'); await S('DOM.enable');
  const ev = async (expression) => { const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const waitFor = async (expression, ms = 20000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { try { v = await ev(expression); if (v) return v; } catch { } await sleep(200); } return v; };
  return { cdp: b.cdp, S, ev, waitFor, sessionId, targetId, browserContextId, erros, abas: [] };
}
const TOKEN_P = 'token-de-mentira-e2e', REPO_P = 'teste-e2e/mesa-dados';
// «Carregar tese» pelo repositório (⚙): token, repositório e o campo Tiragem (em branco: a atual)
async function carregarTese(d, tiragem) {
  await semAviso(d);
  if (!(await d.ev(visivel('cfgDrawer')))) { await clicar(d, `document.getElementById('btnCfg')`); await d.waitFor(visivel('cfgDrawer'), 3000); }
  await d.ev(`document.getElementById('cfgToken').value = ${JSON.stringify(TOKEN_P)}; document.getElementById('cfgRepo').value = ${JSON.stringify(REPO_P)}; document.getElementById('cfgTiragem').value = ${JSON.stringify(tiragem || '')}; window.__antes = 1; true`);
  await clicar(d, `document.getElementById('btnBaixar')`);
}
const aberta = (t, extra = 'true') => `${diag} && (${diag}).pronta && (${diag}).tese && (${diag}).tiragem === '${t}' && (${diag}).paginaDesenhada > 0 && (${extra})`;
async function trocarTese(d, t, extra) { await carregarTese(d, t); await d.waitFor('!window.__antes', 15000); await d.waitFor(aberta(t, extra), 30000); await d.waitFor(`!(${visivel('cfgDrawer')})`, 5000); }
// o cartão de uma proposta: classe, selos, o riscado e o sublinhado, o texto final, o bloco LaTeX, as notas e os botões
const CARTAO = id => `(() => { const c = document.getElementById('prop-${id}'); if (!c) return null; const r = c.getBoundingClientRect(), tx = c.querySelector('.tex');
  return { classe: c.className, selos: [...c.querySelectorAll('.chip')].map(x => x.textContent), titulo: (c.querySelector('.titulo') || {}).textContent || null,
    sai: [...c.querySelectorAll('del')].map(x => x.textContent), entra: [...c.querySelectorAll('ins')].map(x => x.textContent), diff: (c.querySelector('.diff') || {}).textContent || '',
    final: c.querySelector('.final') ? c.querySelector('.final').textContent : null, tex: tx ? { tag: tx.tagName, aberto: tx.tagName === 'DIV' || tx.open, pres: [...tx.querySelectorAll('pre')].map(p => p.textContent), visivel: tx.querySelector('pre').getBoundingClientRect().height > 0 } : null,
    notas: [...c.querySelectorAll('.nota')].map(x => x.textContent), pressionado: [...c.querySelectorAll('[data-decisao]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.decisao),
    botoes: [...c.querySelectorAll('[data-decisao]')].map(b => { const q = b.getBoundingClientRect(); return { d: b.dataset.decisao, rotulo: b.textContent, h: Math.round(q.height), dentro: q.left >= r.left - 1 && q.right <= r.right + 1 }; }) }; })()`;
const IDB_PROP = id => `new Promise(res => { const rq = indexedDB.open('mesa'); rq.onsuccess = () => { const db = rq.result, g = db.transaction('propostas').objectStore('propostas').get('${id}'); g.onsuccess = () => { res(g.result || null); db.close(); }; g.onerror = () => { res(null); db.close(); }; }; rq.onerror = () => res(null); })`;
const IDB_TODOS = coll => `new Promise(res => { const rq = indexedDB.open('mesa'); rq.onsuccess = () => { const db = rq.result, g = db.transaction('${coll}').objectStore('${coll}').getAll(); g.onsuccess = () => { res(g.result || []); db.close(); }; g.onerror = () => { res([]); db.close(); }; }; rq.onerror = () => res([]); })`;
const TOPO_P = `(() => { const b = document.getElementById('btnProp'), h = document.getElementById('propHint'); return { visivel: !b.hidden && getComputedStyle(b).display !== 'none', faltam: document.getElementById('propCount').textContent, dica: h.hidden ? null : h.textContent }; })()`;
const LISTA_TXT = `document.getElementById('segs').textContent`;
async function decidir(d, id, decisao) { await semAviso(d); await clicar(d, `document.querySelector('#prop-${id} [data-decisao=${decisao}]')`); return d.waitFor(`(${IDB_PROP(id)}).then(p => p && p.estado === '${decisao}' && p.sync === 'pendente')`, 5000); }
// espera uma sincronização nova (o horário da última muda), não a anterior
async function sincronizar(d) { const em0 = (await d.ev(diag)).sync.em; await semAviso(d); await clicar(d, `document.getElementById('btnSync')`); return d.waitFor(`(${diag}).sync.estado === 'ok' && (${diag}).sync.em !== ${JSON.stringify(em0)} && (${diag}).porEnviar === 0`, 15000); }
// prova em imagem: a mesma cena a 390 px (telefone, com a lista maior: o PDF em 30 % da altura) e a 1024 px (tablet)
const TELAS_P = [[390, 844, 2, true], [1024, 768, 1, false]];
async function fotoP(d, nome, alvo, medir) {
  const medidas = {};
  for (const [w, h, dpr, mobile] of TELAS_P) {
    await d.S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await sleep(500);
    if (alvo) await d.ev(`(() => { const e = ${alvo}; if (!e) return false; const lw = document.getElementById('listwrap'); lw.scrollTop += e.getBoundingClientRect().top - lw.getBoundingClientRect().top - 8; return true; })()`);
    await sleep(300);
    if (medir) medidas[w] = await d.ev(medir);
    const png = await d.S('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(FOTOS_P, `${nome}-${w}.png`), Buffer.from(png.data, 'base64'));
  }
  await d.S('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  return medidas;
}
const LARGURA_OK = `document.documentElement.scrollWidth <= innerWidth + 1`;
async function fasePropostas() {
  rmSync(PERFIL_P, { recursive: true, force: true }); rmSync(DOWN_P, { recursive: true, force: true }); rmSync(FOTOS_P, { recursive: true, force: true });
  mkdirSync(DOWN_P, { recursive: true }); mkdirSync(FOTOS_P, { recursive: true });
  const F = dadosFicticios(), { tn, tf, repo } = F, [xA, xB, xC, xD] = F.props.map(p => p.id);
  const b = await launch(['--host-resolver-rules=MAP translate.google.com ~NOTFOUND, MAP api.github.com ~NOTFOUND'], PERFIL_P);
  const errosP = () => b.erros.concat(B ? B.erros : []);
  let B = null;
  try {
    await servirRepo(b, repo);
    await b.cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWN_P, eventsEnabled: true });
    await b.S('Page.addScriptToEvaluateOnNewDocument', { source: TOASTS + ` try { if (localStorage.getItem('mesa.pdfh') === null) localStorage.setItem('mesa.pdfh', '30'); } catch (e) { }` });
    await b.S('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
    await b.S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] }); // provas no tema claro (uma também no escuro)
    await b.S('Page.navigate', { url: BASE });
    await b.waitFor(`${diag} && (${diag}).pronta`);
    // ----- aparelho A: «Carregar tese» com o campo Tiragem em branco: a atual (a da outra linha) -----
    await carregarTese(b, '');
    const abriu = await b.waitFor(aberta(tf, `(${diag}).sync.estado === 'ok' && (${diag}).propostas.total === 4`), 30000);
    await b.waitFor(`!(${visivel('cfgDrawer')})`, 5000); // a Configuração fecha sozinha logo depois da carga
    const dA = await b.ev(diag);
    check('fase P: «Carregar tese» baixa a tiragem atual e o índice; a sincronização traz comentários das duas linhas e as quatro propostas', !!abriu && dA.linha === 'fallback' && dA.comentarios === 2 && dA.comentariosLinha === 1 && dA.propostas.total === 4,
      { tiragem: dA.tiragem, linha: dA.linha, comentarios: dA.comentarios, daLinha: dA.comentariosLinha, propostas: dA.propostas, caminhos: [...new Set(repo.log)].slice(0, 12) });
    check('fase P: rótulo de versão em ⚙ diz a versão da Mesa e a versão aberta', await b.ev(`(() => { document.getElementById('btnCfg').click(); const t = document.getElementById('cfgVersao').textContent; document.getElementById('btnCfgClose').click(); return t; })()`) === `Versão da Mesa: 2026-10-15 · propostas de modificação. Versão aberta: Fallback, tiragem ${tf}.`,
      await b.ev(`document.getElementById('cfgVersao').textContent`));
    // ----- isolamento entre as linhas, aberta a da outra linha -----
    await b.waitFor(`(${diag}).pagina === 1`, 5000);
    const iso = await b.ev(`(() => ({ lista: ${LISTA_TXT}, marcas: [...document.querySelectorAll('.sheet.cur .hl.has')].length, grifos: document.querySelectorAll('.sheet.cur .gf').length, cm: document.getElementById('cmCount').textContent,
      rev: (document.getElementById('btnPages').click(), [...document.querySelectorAll('#pgrid .pg.rev')].map(x => x.textContent)), fim: document.getElementById('btnPagesClose').click() }))()`);
    const loteF = await b.ev(COPIAR_LOTE);
    await b.ev(`document.getElementById('btnDrawer').click(); true`);
    const gavF = await b.ev(`[...document.querySelectorAll('#drawerList .cm .body')].map(x => x.textContent)`);
    await b.ev(`document.getElementById('btnDrawerClose').click(); true`);
    check('fase P: aberta a outra linha, nada do núcleo aparece (lista, ponto, grifo, contador, mapa de páginas, gaveta e Copiar lote)',
      /da outra linha na p\. 1/.test(iso.lista) && !/do nucleo na p\. 1/.test(iso.lista) && iso.marcas === 1 && iso.grifos === 0 && iso.cm === '1' && iso.rev.length === 0
      && gavF.length === 1 && /outra linha/.test(gavF[0]) && /Comentários: 1\. Grifos sem comentário: 0\./.test(loteF) && !/nucleo/.test(loteF), { marcas: iso.marcas, grifos: iso.grifos, cm: iso.cm, rev: iso.rev, gaveta: gavF, lote: loteF.split('\n').slice(0, 2) });
    await fotoP(b, 'linha-outra-p1', `document.getElementById('seg-p1-2')`);
    // ----- o cartão em cada estado -----
    const t0 = await b.ev(TOPO_P), c0 = await b.ev(CARTAO(xA));
    check('fase P: cartão «Proposta de modificação» abaixo do trecho: selos (Proposta, A, toca a reivindicação), riscado e sublinhado do diff, motivo, origem e três botões de 44 px',
      !!c0 && c0.titulo === 'Proposta de modificação' && c0.selos.join('|') === 'Proposta|A|toca a reivindicação' && c0.sai.join() === 'estima ' && c0.entra.join() === 'identifica '
      && c0.diff === 'O modelo estima identifica os coeficientes do voo com a perda fisica e os dados gravados.' && c0.notas.some(n => /^Motivo: Coeficientes/.test(n)) && c0.notas.some(n => /^Origem: R1, c-teste · Prova: regua-de-teste\.md$/.test(n))
      && c0.botoes.map(x => x.rotulo).join() === 'Aceitar,Modificar,Rejeitar' && c0.botoes.every(x => x.h >= 44 && x.dentro) && c0.pressionado.length === 0 && c0.tex && c0.tex.tag === 'DETAILS' && !c0.tex.aberto, c0);
    check('fase P: topo com «Próxima proposta» (4 sem decisão) e «Propostas 4 (0 decididas)»', t0.visivel && t0.faltam === '4' && t0.dica === 'Propostas 4 (0 decididas)', t0);
    const m0 = await fotoP(b, 'cartao-proposta', `document.getElementById('prop-${xA}')`, `({ largura: ${LARGURA_OK}, cartao: ${CARTAO(xA)} })`);
    await b.S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await fotoP(b, 'cartao-proposta-escuro', `document.getElementById('prop-${xA}')`);
    await b.S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    check('fase P: a 390 px, o cartão cabe na largura, sem rolagem lateral, e os botões têm 44 px', m0[390].largura && m0[390].cartao.botoes.every(x => x.h >= 44 && x.dentro) && m0[1024].largura, { b390: m0[390].cartao.botoes, b1024: m0[1024].cartao.botoes });
    // Aceitar
    const okA = await decidir(b, xA, 'aceita'), pA = await b.ev(IDB_PROP(xA)), cA = await b.ev(CARTAO(xA)), tA = await b.ev(TOPO_P), sA = await b.ev(`document.getElementById('syncCount').textContent`);
    check('fase P: Aceitar grava aceita, texto final = proposta, decidido_em e sync pendente; o selo vira «Aceita» e o botão fica marcado; Sincronizar conta a decisão',
      !!okA && !!cA && pA.texto_final === pA.proposta && !!pA.decidido_em && pA.atualizado_em === pA.decidido_em && cA.selos[0] === 'Aceita' && /\baceita\b/.test(cA.classe) && cA.pressionado.join() === 'aceita' && tA.faltam === '3' && tA.dica === 'Propostas 4 (1 decidida)' && sA === '1',
      { estado: pA.estado, sync: pA.sync, selos: cA && cA.selos, topo: tA, sincronizar: sA });
    await fotoP(b, 'cartao-aceita', `document.getElementById('prop-${xA}')`);
    // Modificar: a caixa vem com o texto final (ou a proposta), fonte de 16 px ou mais; Salvar grava o texto dele
    await semAviso(b); await clicar(b, `document.querySelector('#prop-${xA} [data-decisao=modificada]')`);
    const comp = await b.waitFor(`(() => { const c = document.getElementById('composer'), t = document.getElementById('compText'); return !c.hidden && { titulo: document.getElementById('compTitle').textContent, valor: t.value, fonte: parseFloat(getComputedStyle(t).fontSize), tipo: !document.getElementById('compType').hidden, salvar: document.getElementById('btnCompSave').textContent, onde: document.getElementById('compWhere').textContent }; })()`, 3000);
    const salvarVisivel = {};
    for (const [w, h, dpr, mobile] of TELAS_P) {
      await b.S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile }); await sleep(400);
      salvarVisivel[w] = await b.ev(`(() => { const s = document.getElementById('btnCompSave').getBoundingClientRect(), c = document.getElementById('composer').getBoundingClientRect(); return s.height > 0 && s.top >= c.top && s.bottom <= Math.min(c.bottom, innerHeight) + 1; })()`);
    }
    await b.S('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false }); await sleep(300);
    check('fase P: Modificar abre a caixa com o texto (já aceita: o texto final), fonte de 16 px ou mais, sem o seletor de tipo, com «Salvar modificação» à vista a 390 px e a 1024 px', salvarVisivel[390] && salvarVisivel[1024] && !!comp && comp.valor === F.props[0].proposta && comp.fonte >= 16 && !comp.tipo && comp.salvar === 'Salvar modificação' && /^p\. 1 · p1-3$/.test(comp.onde), { ...comp, salvarVisivel });
    const NOVO = 'O modelo identifica, com a perda fisica, os coeficientes do voo.';
    await b.ev(`(() => { const t = document.getElementById('compText'); t.value = ${JSON.stringify(NOVO)}; t.dispatchEvent(new Event('input')); return true; })()`);
    await fotoP(b, 'compositor-modificar', null);
    await clicar(b, `document.getElementById('btnCompSave')`);
    const okM = await b.waitFor(`(${IDB_PROP(xA)}).then(p => p && p.estado === 'modificada')`, 5000), pM = await b.ev(IDB_PROP(xA)), cM = await b.ev(CARTAO(xA));
    check('fase P: Salvar modificação grava modificada com o texto dele; o cartão mostra «Modificada» e «Seu texto»; a caixa fecha', !!okM && !!cM && pM.texto_final === NOVO && cM.selos[0] === 'Modificada' && cM.final === 'Seu texto\n' + NOVO && cM.pressionado.join() === 'modificada' && await b.ev(`document.getElementById('composer').hidden`),
      { estado: pM.estado, final: cM && cM.final, pagina: (await b.ev(diag)).pagina });
    await fotoP(b, 'cartao-modificada', `document.getElementById('prop-${xA}')`);
    // Rejeitar e mudar a decisão
    const okR = await decidir(b, xA, 'rejeitada'), pR = await b.ev(IDB_PROP(xA)), cR = await b.ev(CARTAO(xA));
    check('fase P: Rejeitar grava rejeitada e limpa o texto final; selo «Rejeitada»', !!okR && !!cR && pR.texto_final === '' && cR.selos[0] === 'Rejeitada' && cR.final === null && cR.pressionado.join() === 'rejeitada', { selos: cR && cR.selos });
    await fotoP(b, 'cartao-rejeitada', `document.getElementById('prop-${xA}')`);
    const okV = await decidir(b, xA, 'aceita'), pV = await b.ev(IDB_PROP(xA));
    check('fase P: a decisão muda depois (rejeitada → aceita), com decidido_em novo', !!okV && pV.texto_final === pV.proposta && pV.decidido_em > pR.decidido_em, { antes: pR.decidido_em, depois: pV.decidido_em });
    // tocar no cartão realça o trecho no PDF
    await b.ev(`document.getElementById('listwrap').scrollTop = 0; true`); await semAviso(b);
    await clicar(b, `document.querySelector('#prop-${xA} .diff')`);
    const real = await b.waitFor(`(() => { const s = document.getElementById('seg-p1-3'), h = document.querySelector('.sheet.cur .hl.active'); return !!(s && /active/.test(s.className) && h) && { ativa: (${diag}).propostas.ativa }; })()`, 3000);
    check('fase P: tocar no cartão realça o trecho no PDF, como tocar no trecho', !!real && real.ativa === xA, real);
    // «Próxima proposta»: a próxima sem decisão na ordem do documento, em ciclo
    const ordem = [];
    for (let i = 0; i < 4; i++) {
      await semAviso(b); await clicar(b, `document.getElementById('btnProp')`); await sleep(500);
      const dd = await b.ev(diag); ordem.push(dd.pagina + ':' + dd.propostas.ativa);
    }
    await sleep(700);
    const vis = await b.ev(`(() => { const c = document.querySelector('.prop.ativa'), lw = document.getElementById('listwrap').getBoundingClientRect(); if (!c) return null; const r = c.getBoundingClientRect(); return { id: c.id, visivel: r.bottom > lw.top && r.top < lw.bottom }; })()`);
    check('fase P: «Próxima proposta» vai à próxima sem decisão (p. 2, p. 2, p. 3) e volta ao começo; o cartão fica realçado e à vista na lista', ordem.join() === `2:${xB},2:${xC},3:${xD},2:${xB}` && !!vis && vis.id === 'prop-' + xB && vis.visivel, { ordem, vis });
    // já aplicada e equação com o trecho LaTeX
    const cB = await b.ev(CARTAO(xB)), cC = await b.ev(CARTAO(xC));
    check('fase P: cartão «já aplicada»: selo e nota «Já está no PDF; «Rejeitar» volta ao texto anterior (o riscado).»', !!cB && cB.selos.join('|') === 'Proposta|B|já aplicada' && cB.notas[0] === 'Já está no PDF; «Rejeitar» volta ao texto anterior (o riscado).' && cB.sai.join() === 'comprova ', cB);
    check('fase P: na equação, o trecho LaTeX (antes e depois) fica aberto e visível; selo «depende de Q2»', !!cC && cC.selos.join('|') === 'Proposta|A|depende de Q2' && cC.tex && cC.tex.tag === 'DIV' && cC.tex.visivel && cC.tex.pres.join(' / ') === 'x = y + z / x = y - z', cC && cC.tex);
    await fotoP(b, 'cartao-ja-aplicada', `document.getElementById('prop-${xB}')`);
    await fotoP(b, 'cartao-equacao-latex', `document.getElementById('prop-${xC}')`);
    await decidir(b, xB, 'rejeitada'); await decidir(b, xC, 'aceita');
    // ----- Sincronizar: as decisões sobem; o resto do estado.json (inclusive a chave desconhecida) fica -----
    const okS = await sincronizar(b), eS = F.estadoRepo(), est = Object.fromEntries((eS.propostas || []).map(p => [p.id, p.estado]));
    check('fase P: Sincronizar leva as decisões ao repositório (aceita, rejeitada, aceita e uma sem decisão), mantém os comentários das duas linhas, o grifo, a página revisada e a chave desconhecida',
      !!okS && est[xA] === 'aceita' && est[xB] === 'rejeitada' && est[xC] === 'aceita' && est[xD] === 'proposta' && eS.comentarios.length === 2 && eS.grifos.length === 1 && eS.revisadas.length === 1 && JSON.stringify(eS.extra_e2e) === '{"versao":"teste"}'
      && (eS.propostas || []).every(p => p.sync === 'enviado'), { estados: est, extra: eS.extra_e2e, commit: repo.commits.at(-1) });
    const loteD = await b.ev(COPIAR_LOTE);
    check('fase P: Copiar lote traz as propostas decididas (com o id) e conta as sem decisão', /PROPOSTAS DE MODIFICAÇÃO: 4, 3 decididas, 1 sem decisão\./.test(loteD) && loteD.includes(`, ${xB} [rejeitada, B]`) && loteD.includes(`${xA} [aceita, A]`), loteD.split('\n').filter(l => /PROPOSTAS|^- p\./.test(l)));
    // ----- aparelho B: recebe as decisões; decide; o A recebe -----
    B = await outroAparelho(b);
    await servirRepo(B, repo);
    await B.S('Page.addScriptToEvaluateOnNewDocument', { source: TOASTS });
    await B.S('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
    await B.S('Page.navigate', { url: BASE });
    await B.waitFor(`${diag} && (${diag}).pronta`);
    await carregarTese(B, '');
    const abriuB = await B.waitFor(aberta(tf, `(${diag}).sync.estado === 'ok' && (${diag}).propostas.decididas === 3`), 30000), pB = await B.ev(IDB_PROP(xA));
    await B.waitFor(`!(${visivel('cfgDrawer')})`, 5000); // a Configuração fecha sozinha: até lá ela cobre a lista
    check('fase P: o segundo aparelho recebe as decisões do primeiro (3 decididas, texto final igual)', !!abriuB && pB.estado === 'aceita' && pB.texto_final === F.props[0].proposta, { decididas: (await B.ev(diag)).propostas });
    await B.ev(`(() => { const i = document.getElementById('pageInput'); i.value = 3; i.dispatchEvent(new Event('change')); return true; })()`); await B.waitFor(`(${diag}).paginaDesenhada === 3`, 10000);
    await semAviso(B); const cliqueMB = await clicar(B, `document.querySelector('#prop-${xD} [data-decisao=modificada]')`); const abriuMB = await B.waitFor(`!document.getElementById('composer').hidden`, 3000);
    const TXT_B = 'Pagina tres da outra linha, em texto do segundo aparelho.';
    await B.ev(`document.getElementById('compText').value = ${JSON.stringify(TXT_B)}; true`); await clicar(B, `document.getElementById('btnCompSave')`);
    const okMB = await B.waitFor(`(${IDB_PROP(xD)}).then(p => p && p.estado === 'modificada')`, 5000);
    await B.ev(`(() => { const i = document.getElementById('pageInput'); i.value = 2; i.dispatchEvent(new Event('change')); return true; })()`); await B.waitFor(`(${diag}).paginaDesenhada === 2`, 10000);
    await decidir(B, xC, 'rejeitada');
    const okSB = await sincronizar(B), okSA = await sincronizar(b), pDA = await b.ev(IDB_PROP(xD)), pCA = await b.ev(IDB_PROP(xC));
    check('fase P: dois aparelhos: a modificação e a troca de decisão do segundo chegam ao primeiro (última escrita vence)', !!okMB && !!okSB && !!okSA && pDA.estado === 'modificada' && pDA.texto_final === TXT_B && pCA.estado === 'rejeitada', { xD: pDA.estado, xC: pCA.estado, cliqueMB, abriuMB: !!abriuMB, okMB: !!okMB, xDemB: (await B.ev(IDB_PROP(xD))) && (await B.ev(IDB_PROP(xD))).estado, diagB: (await B.ev(diag)).pagina });
    // ----- trocar de versão: a do núcleo; um comentário pendente (sem sincronizar) não aparece na outra linha -----
    await b.ev(`(() => { localStorage.setItem('mesa.autosync', 'false'); return true; })()`);
    await trocarTese(b, tn, `(${diag}).linha === 'nucleo'`);
    if ((await b.ev(diag)).pagina !== 1) { await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = 1; i.dispatchEvent(new Event('change')); return true; })()`); await b.waitFor(`(${diag}).paginaDesenhada === 1`, 10000); }
    const isoN = await b.ev(`(() => ({ lista: ${LISTA_TXT}, grifos: document.querySelectorAll('.sheet.cur .gf').length, cartoes: document.querySelectorAll('.prop').length, topo: ${TOPO_P}, d: ${diag},
      rev: (document.getElementById('btnPages').click(), [...document.querySelectorAll('#pgrid .pg.rev')].map(x => x.textContent)), fim: document.getElementById('btnPagesClose').click() }))()`);
    check('fase P: aberta a do núcleo, nada da outra linha aparece (comentário, propostas, «Próxima proposta»), e o grifo e a página revisada do núcleo voltam',
      /do nucleo na p\. 1/.test(isoN.lista) && !/da outra linha na p\. 1/.test(isoN.lista) && isoN.grifos === 1 && isoN.cartoes === 0 && !isoN.topo.visivel && isoN.rev.join() === '2' && isoN.d.linha === 'nucleo' && isoN.d.propostas.total === 0,
      { grifos: isoN.grifos, cartoes: isoN.cartoes, topo: isoN.topo, rev: isoN.rev, linha: isoN.d.linha });
    await fotoP(b, 'linha-nucleo-p1', `document.getElementById('seg-p1-2')`);
    const NOVO_C = 'Comentario pendente do nucleo, ainda sem sincronizar.';
    await semAviso(b); await clicar(b, `document.querySelector('#seg-p1-1 .acts .btn.primary')`); await b.waitFor(`!document.getElementById('composer').hidden`, 3000);
    await b.ev(`document.getElementById('compText').value = ${JSON.stringify(NOVO_C)}; true`); await clicar(b, `document.getElementById('btnCompSave')`);
    await b.waitFor(`document.getElementById('composer').hidden`, 3000);
    await semAviso(b); await clicar(b, `document.getElementById('btnReviewed')`); await b.waitFor(`(${diag}).revisadas === 2`, 3000);
    const cN = (await b.ev(IDB_TODOS('comentarios'))).find(c => c.texto === NOVO_C), rN = (await b.ev(IDB_TODOS('revisadas'))).find(r => r.pagina === 1);
    check('fase P: o comentário e a página revisada criados na do núcleo levam a tiragem e a linha dela e ficam pendentes (sincronização automática desligada)',
      !!cN && cN.linha === 'nucleo' && cN.tiragem === tn && cN.sync === 'pendente' && !!rN && rN.id === '1' && rN.linha === 'nucleo', { comentario: cN && { linha: cN.linha, sync: cN.sync }, revisada: rN && { id: rN.id, linha: rN.linha } });
    await trocarTese(b, tf, `(${diag}).linha === 'fallback'`);
    if ((await b.ev(diag)).pagina !== 1) { await b.ev(`(() => { const i = document.getElementById('pageInput'); i.value = 1; i.dispatchEvent(new Event('change')); return true; })()`); await b.waitFor(`(${diag}).paginaDesenhada === 1`, 10000); }
    const isoF2 = await b.ev(`(() => ({ lista: ${LISTA_TXT}, d: ${diag}, rev: (document.getElementById('btnPages').click(), [...document.querySelectorAll('#pgrid .pg.rev')].map(x => x.textContent)), fim: document.getElementById('btnPagesClose').click() }))()`);
    check('fase P: de volta à outra linha, o pendente do núcleo não aparece (lista e mapa), mas continua na fila de Sincronizar', !isoF2.lista.includes(NOVO_C) && isoF2.rev.length === 0 && isoF2.d.porEnviar === 2 && isoF2.d.comentariosLinha === 1,
      { porEnviar: isoF2.d.porEnviar, rev: isoF2.rev });
    await fotoP(b, 'linha-outra-de-volta-p1', `document.getElementById('seg-p1-2')`);
    await semAviso(b); await clicar(b, `document.getElementById('btnReviewed')`); await b.waitFor(`(${diag}).revisadas === 1`, 3000);
    const rF = (await b.ev(IDB_TODOS('revisadas'))).find(r => r.id === 'fallback:1');
    check('fase P: a página revisada na outra linha tem id próprio («fallback:1») e não mexe na do núcleo', !!rF && rF.linha === 'fallback' && (await b.ev(IDB_TODOS('revisadas'))).some(r => r.id === '1' && r.linha === 'nucleo'), rF);
    const okS2 = await sincronizar(b), e2 = F.estadoRepo();
    check('fase P: Sincronizar leva o pendente do núcleo e as revisadas das duas linhas', !!okS2 && e2.comentarios.some(c => c.texto === NOVO_C && c.linha === 'nucleo') && e2.revisadas.map(r => r.id).sort().join() === '1,2,fallback:1', e2.revisadas.map(r => r.id));
    // ----- exportar e importar estado.json com a coleção -----
    await irPara(b, 3); const okXD = await decidir(b, xD, 'aceita');
    const antes = readdirSync(DOWN_P).length;
    await b.ev(`(() => { navigator.share = undefined; navigator.canShare = undefined; document.getElementById('btnExport2').click(); return true; })()`);
    let arq = null; for (let i = 0; i < 40 && !arq; i++) { await sleep(250); const fs = readdirSync(DOWN_P).filter(f => /^estado-.*\.json$/.test(f)); if (fs.length > antes) arq = fs.at(-1); }
    const exp = arq ? JSON.parse(readFileSync(join(DOWN_P, arq), 'utf8')) : null;
    check('fase P: Exportar estado.json leva a coleção propostas com as decisões', !!okXD && !!exp && Array.isArray(exp.propostas) && exp.propostas.length === 4 && exp.propostas.find(p => p.id === xD).estado === 'aceita', exp && exp.propostas.map(p => p.id + ':' + p.estado + ':' + p.sync));
    if (arq) {
      const docB = await B.S('DOM.getDocument', {}), fiB = await B.S('DOM.querySelector', { nodeId: docB.root.nodeId, selector: '#fileInput' });
      await B.S('DOM.setFileInputFiles', { nodeId: fiB.nodeId, files: [join(DOWN_P, arq)] });
      const imp = await B.waitFor(`(${IDB_PROP(xD)}).then(p => p && p.estado === 'aceita' && p)`, 8000);
      check('fase P: Escolher arquivos… com o estado.json exportado traz a decisão para o outro aparelho, sem sincronizar', !!imp && imp.texto_final === F.props[3].proposta, imp && { estado: imp.estado });
    }
    // ----- cliente antigo (sync.js de b001cd8, sem a coleção) sincroniza depois da carga -----
    let antigo = null;
    try {
      const dirA = join(OUT, 'sync-antigo'); mkdirSync(dirA, { recursive: true });
      writeFileSync(join(dirA, 'sync_antigo.cjs'), execFileSync('git', ['-C', RAIZ_CASCA, 'show', 'b001cd8:sync.js']));
      antigo = createRequire(import.meta.url)(join(dirA, 'sync_antigo.cjs'));
    } catch (e) { naoSeAplica('fase P: cliente antigo apaga a coleção e o aparelho novo a devolve', 'sem o git ou sem o commit b001cd8: ' + e.message); }
    if (antigo) {
      const fetchNode = async (url, init) => { const r = ghResponde(repo, init.method, new URL(url).pathname, init.headers.Accept, init.body), buf = r.buf || Buffer.from(JSON.stringify(r.json));
        return { status: r.status, ok: r.status >= 200 && r.status < 300, headers: { get: () => null }, json: async () => JSON.parse(buf.toString('utf8')), text: async () => buf.toString('utf8'), arrayBuffer: async () => buf }; };
      const cVelho = { id: 'cvelho1', pagina: 2, trecho: 'p2-1', tipo: 'correcao', texto: 'Comentario de um aparelho com a versao antiga', criado_em: '2026-10-15T19:00:00.000Z', atualizado_em: '2026-10-15T19:00:00.000Z', estado: 'aberto', tiragem: tf, sync: 'pendente' };
      const velho = antigo.createSync({ fetch: fetchNode, getConfig: () => ({ token: 'token-de-mentira-antigo', repo: REPO_P }), getLocal: () => ({ comentarios: [cVelho], grifos: [], revisadas: [], progresso: null }),
        applyLocal: () => { }, markSent: () => { }, applyRespostas: () => { }, isOnline: () => true });
      const rv = await velho.syncNow('antigo'), eV = F.estadoRepo();
      check('fase P: o cliente antigo, ao sincronizar depois da carga, regrava o estado.json sem a coleção propostas (o risco conhecido)', rv.ok && !('propostas' in eV) && eV.comentarios.some(c => c.id === 'cvelho1'), { ok: rv.ok, chaves: Object.keys(eV) });
      const okS3 = await sincronizar(b), e3 = F.estadoRepo(), est3 = Object.fromEntries((e3.propostas || []).map(p => [p.id, p.estado]));
      check('fase P: o aparelho novo, na sincronização seguinte, devolve as quatro propostas com as decisões e mantém o comentário do antigo',
        !!okS3 && Object.keys(est3).length === 4 && est3[xA] === 'aceita' && est3[xB] === 'rejeitada' && est3[xC] === 'rejeitada' && est3[xD] === 'aceita' && e3.comentarios.some(c => c.id === 'cvelho1'),
        { estados: est3, extraPerdida: !('extra_e2e' in e3) });
    }
    await b.S('Emulation.clearDeviceMetricsOverride');
    const erros = errosP().filter(e => !/ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|fonts\.googleapis|Failed to load resource/.test(e));
    check('fase P: sem exceções de JavaScript nos dois aparelhos', erros.length === 0, erros.slice(0, 5));
    check('fase P: o GitHub de mentira não recebeu nada fora da API de conteúdo (nenhum cabeçalho registrado)', repo.log.every(l => /^(GET|PUT) (tiragens|dados)\//.test(l)), [...new Set(repo.log)].slice(0, 20));
  } finally {
    await b.close();
  }
}

// página de teste: a primeira depois da 10 com pelo menos dois trechos de texto
const FASES = String(args.fases || '12RSP').toUpperCase();
const trechos = args.trechos ? JSON.parse(readFileSync(args.trechos, 'utf8')) : { pages: [] };
const alvo = trechos.pages.find(p => p.page > 10 && p.segs.filter(s => s.kind === 'text').length >= 2);
const totalPaginas = trechos.pages.length;
// páginas dos recortes: as do argumento ou, sem ele, a primeira com duas equações, a da tabela mais larga e a primeira com falso positivo
const larguraTabela = p => Math.max(0, ...p.segs.filter(s => s.kind === 'table' && s.bbox).map(s => s.bbox[2] - s.bbox[0]));
const PAGS = !trechos.pages.length ? {} : {
  eq: +args['pag-equacoes'] || (trechos.pages.find(p => p.segs.filter(s => ehRecorte(s) && s.kind === 'equation').length >= 2) || {}).page,
  tab: +args['pag-tabela'] || trechos.pages.reduce((a, p) => (larguraTabela(p) > larguraTabela(a) ? p : a), trechos.pages[0]).page,
  num: +args['pag-numero'] || (trechos.pages.find(p => p.segs.some(ehNumero)) || {}).page,
  semRecorte: (trechos.pages.find(p => p.segs.some(s => s.kind === 'text') && !p.segs.some(ehRecorte)) || {}).page,
};

let srv = null;
const ERROS_FASES = [];
try {
  let b = null;
  if (FASES.includes('1')) {
  // ===== fase 1: com rede =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  b = await launch(['--host-resolver-rules=MAP translate.google.com ~NOTFOUND']);
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
  check('subtítulo com a tiragem', /^Tiragem [0-9a-f]{8}( de \d\d\/\d\d\/\d{4}(, [^,]+)*)?, \d+ páginas$/.test(await b.ev(`document.getElementById('subtitle').textContent`)), await b.ev(`document.getElementById('subtitle').textContent`));
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
  // ----- «Ditar», com rede -----
  await testeDitado(b, iTexto, OUT);
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
  for (const [larg, alt] of [[1280, 900], [740, 1000]]) await testeRolagem(b, alvo, larg, alt, OUT, true);
  check('chave «Rolagem contínua» desligada em ⚙ (uma página por vez)', await modo(b, false));
  for (const [larg, alt] of [[1280, 900], [740, 1000]]) await testeRolagem(b, alvo, larg, alt, OUT, false);
  check('chave «Rolagem contínua» ligada de novo em ⚙', await modo(b, true));
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
  const r = await b.ev(`JSON.stringify(document.querySelector('.sheet.cur').getBoundingClientRect())`).then(JSON.parse);
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
  check('sem rede: a dica do microfone do teclado continua embaixo da caixa', await b.ev(`(() => { const h = document.getElementById('dictHelp'); return getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().height > 0 && h.textContent === 'Dica: o microfone do teclado dita sem rede.'; })()`));
  await b.ev(`document.getElementById('compText').value = 'Comentário de teste sem rede'; document.getElementById('btnCompSave').click()`);
  check('comentário salvo', await b.waitFor(`(${diag}).comentarios === 1`, 5000));
  // como Alvaro, espera a gravação terminar e o compositor fechar antes do próximo (o fim da gravação fecha o compositor aberto)
  await b.waitFor(`!(${vis('composer')})`, 5000);
  check('botão Dúvida grava comentário do tipo dúvida', await clickSegBtn('Dúvida') && await b.ev(`document.getElementById('btnCompSave').textContent`) === 'Salvar dúvida');
  await b.ev(`document.getElementById('compText').value = 'Dúvida de teste'; document.getElementById('btnCompSave').click()`);
  check('dúvida salva', await b.waitFor(`(${diag}).comentarios === 2`, 5000));
  await b.waitFor(`!(${vis('composer')})`, 5000);
  await b.ev(`document.getElementById('btnReviewed').click()`);
  check('página marcada como revisada', await b.waitFor(`(${diag}).revisadas === 1`, 5000));
  await clickSegBtn('Grifado ✓', 1); await sleep(200); await clickSegBtn('retirar grifo?', 1);
  check('grifo do trecho retirado (vira tombstone)', await b.waitFor(`(${diag}).grifos === 1`, 5000));
  const d2 = await b.ev(diag);
  check('fila «por enviar» conta itens e remoções', d2.porEnviar === 5, d2.porEnviar);
  check('indicador «N por enviar»', /^5 por enviar/.test(await b.ev(`document.getElementById('syncHint').textContent`)), await b.ev(`document.getElementById('syncHint').textContent`));
  const lote = await b.ev(`(() => { let t = ''; const orig = navigator.clipboard && navigator.clipboard.writeText; return new Promise(res => { navigator.clipboard.writeText = x => { t = x; res(t); return Promise.resolve(); }; document.getElementById('btnCopy').click(); setTimeout(() => res(t), 1500); }); })()`);
  writeFileSync(join(OUT, 'lote.txt'), lote || '');
  check('Copiar lote gera o texto do lote', /^LOTE DE REVISÃO, tiragem [0-9a-f]{8}( \(\d\d\/\d\d\/\d{4}(, [^,)]+)*\))?, gerado em /.test(lote || '') && /Comentários: 2\. Grifos sem comentário: 1\./.test(lote), (lote || '').split('\n').slice(0, 2).join(' | '));
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
  // ----- filtro de comentários, em 1280 px e 740 px -----
  const P = alvo, Q = trechos.pages.find(p => p.page > alvo.page + 1 && p.segs.length);
  const tir = (await b.ev(diag)).tiragem, agora = '2026-10-12T12:00:00.000Z';
  const resp = (n, pag, trecho) => ['comentarios', { id: 'e2e-r' + n, pagina: pag, trecho, grifo: null, tipo_trecho: 'text', y: null, texto_trecho: null, criado_em: '2026-10-01T10:0' + n + ':00.000Z', estado: 'aberto', tiragem: tir, tipo: 'correcao', texto: 'Comentário respondido de teste ' + n, atualizado_em: '2026-10-01T10:0' + n + ':00.000Z', sync: 'enviado', resposta: 'Aplicado na tiragem de teste: resposta de teste ' + n + '.', respondido_em: agora }];
  await b.ev(INJETA([resp(1, P.page, P.segs[0].id), resp(2, P.page, P.segs[1].id), resp(3, P.page, P.segs[1].id), resp(4, P.page, 'e2e-trecho-ausente'), resp(5, Q.page, Q.segs[0].id),
    ['revisadas', { id: String(Q.page), pagina: Q.page, em: agora, tiragem: tir, atualizado_em: agora, sync: 'enviado' }]]));
  await b.ev('window.__antes = 1');
  await b.S('Page.reload', { ignoreCache: false });
  await b.waitFor('!window.__antes', 10000);
  check('filtro: 5 respondidos de teste gravados no aparelho (p. ' + P.page + ': 1 no trecho dos sem resposta, 2 noutro trecho, 1 num trecho ausente; p. ' + Q.page + ', revisada: 1)', await b.waitFor(`${diag} && (${diag}).pronta && (${diag}).comentarios === 7 && (${diag}).paginaDesenhada === ${P.page}`, 30000), await b.ev(diag + '.comentarios'));
  for (const [larg, alt] of [[1280, 900], [740, 1000]]) await testeFiltro(b, P, Q, larg, alt, OUT);
  await testeFiltroSalvar(b, P, OUT);
  await b.S('Emulation.clearDeviceMetricsOverride');
  const erros2 = b.erros.slice();
  await b.close();
  ERROS_FASES.push(...erros1, ...erros2);
  }

  if (FASES.includes('R')) {
  // ===== fase R: rolagem contínua do PDF, com rede, perfil próprio, CPU 4 vezes mais lenta =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  b = await launch(['--host-resolver-rules=MAP translate.google.com ~NOTFOUND'], PERFIL_R);
  await b.S('Page.navigate', { url: BASE });
  await b.waitFor(`${diag} && window.mesa.diagnostico().pronta`);
  const doc = await b.S('DOM.getDocument', {});
  const fi = await b.S('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#fileInput' });
  await b.S('DOM.setFileInputFiles', { nodeId: fi.nodeId, files: [resolve(args.pdf), resolve(args.trechos), ...(args.manifest ? [resolve(args.manifest)] : [])] });
  check('fase R: tese carregada num perfil novo, rolagem contínua ligada por padrão', await b.waitFor(`(${diag}).tese && (${diag}).paginaDesenhada > 0 && (${diag}).rolagem === 'continua' && localStorage.getItem('mesa.rolagem') === null`, 30000));
  await b.waitFor(`!(${visivel('cfgDrawer')})`, 5000);
  await b.S('Emulation.setCPUThrottlingRate', { rate: 4 });
  let rodada = 0;
  for (const [larg, alt, dpr] of [[1280, 900, 1], [1280, 800, 2], [740, 1000, 1], [740, 1000, 2]]) for (const cont of [true, false]) await testeFolhas(b, larg, alt, dpr, cont, rodada++, OUT);
  await b.S('Emulation.setCPUThrottlingRate', { rate: 1 });
  await b.S('Emulation.clearDeviceMetricsOverride');
  const errosR = b.erros.slice();
  await b.close();
  if (srv) { await new Promise(r => srv.close(r)); srv = null; }
  ERROS_FASES.push(...errosR);
  }
  if (FASES.includes('S')) {
  // ===== fase S: chave «Sincronização automática», com rede, perfil próprio, GitHub de mentira pelo protocolo =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  b = await launch(['--host-resolver-rules=MAP translate.google.com ~NOTFOUND, MAP api.github.com ~NOTFOUND'], PERFIL_S);
  const gh = await githubFalso(b);
  await b.S('Page.addScriptToEvaluateOnNewDocument', { source: TOASTS });
  await b.S('Page.navigate', { url: BASE });
  await b.waitFor(`${diag} && window.mesa.diagnostico().pronta`);
  const docS = await b.S('DOM.getDocument', {});
  const fiS = await b.S('DOM.querySelector', { nodeId: docS.root.nodeId, selector: '#fileInput' });
  await b.S('DOM.setFileInputFiles', { nodeId: fiS.nodeId, files: [resolve(args.pdf), resolve(args.trechos), ...(args.manifest ? [resolve(args.manifest)] : [])] });
  check('fase S: tese carregada num perfil novo, chave «Sincronização automática» ligada por padrão, sem token e sem requisição ao GitHub', await b.waitFor(`(${diag}).tese && (${diag}).paginaDesenhada > 0 && (${diag}).autosync === true && !(${diag}).temToken && localStorage.getItem('mesa.autosync') === null`, 30000) && nenhuma(ghNovos(gh, { p: 0, i: 0 })));
  await b.waitFor(`!(${visivel('cfgDrawer')})`, 5000);
  // token e repositório de mentira por ⚙, como Alvaro cola o token; ligada (padrão), o «Salvar» tenta sincronizar
  const mS = ghMarca(gh);
  await semAviso(b); await clicar(b, `document.getElementById('btnCfg')`); await b.waitFor(visivel('cfgDrawer'), 3000);
  await b.ev(`document.getElementById('cfgToken').value = 'token-de-mentira-e2e'; document.getElementById('cfgRepo').value = 'teste-e2e/mesa-dados'; true`);
  await clicar(b, `document.getElementById('btnCfgSave')`);
  const salvouS = await b.waitFor(`(${diag}).temToken && window.__toasts.includes('Salvo')`, 5000);
  const tentouS = await esperarTentativa(gh, mS);
  await fecharCfg(b);
  check('fase S: ligada (padrão), o «Salvar» de ⚙ com o token tenta sincronizar (GET do estado.json, respondido com 401 pelo GitHub de mentira)', !!salvouS && tentouS && caminhos(ghNovos(gh, mS)).join() === 'GET ' + GH_ESTADO, caminhos(ghNovos(gh, mS)));
  await b.waitFor(`(${diag}).sync.estado === 'erro'`, 10000);
  for (const [larg, alt, pag] of [[1280, 900, Math.min(3, totalPaginas)], [740, 1000, Math.min(4, totalPaginas)]]) await testeAutosync(b, gh, larg, alt, pag, OUT);
  await b.S('Emulation.clearDeviceMetricsOverride');
  check('fase S: o GitHub de mentira respondeu tudo o que chegou (cada tentativa vista também pela interceptação)', gh.interceptados.length > 0 && gh.interceptados.filter(x => x.metodo !== 'OPTIONS').length === gh.pedidos.filter(x => x.metodo !== 'OPTIONS').length, { pedidos: gh.pedidos.length, interceptados: gh.interceptados.length });
  const errosS = b.erros.slice();
  await b.close();
  if (srv) { await new Promise(r => srv.close(r)); srv = null; }
  ERROS_FASES.push(...errosS);
  }
  if (FASES.includes('P')) {
  // ===== fase P: linhas de versão e «Proposta de modificação», perfil próprio, tudo fictício =====
  if (args.serve) srv = await serve(args.serve, +new URL(BASE).port);
  await fasePropostas(); // as exceções dos dois aparelhos são conferidas dentro da fase
  if (srv) { await new Promise(r => srv.close(r)); srv = null; }
  }
  const erros = ERROS_FASES.filter(e => !/ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|fonts\.googleapis|Failed to load resource/.test(e));
  check('sem exceções de JavaScript', erros.length === 0, erros.slice(0, 5));
} catch (e) {
  check('execução do teste', false, e.stack || String(e));
} finally {
  // o navegador que uma exceção deixou aberto: fechado aqui, com a árvore inteira (senão segurava a porta e o perfil)
  for (const fechar of [...ABERTOS]) { try { await fechar(); } catch (e) { nav('ao fechar depois de uma exceção: ' + e.message); } }
  if (srv) srv.close();
}
writeFileSync(join(OUT, 'resultado.json'), JSON.stringify({ base: BASE, navegador: EDGE, quando: new Date().toISOString(), falhas, naoSeAplicam, processos: PROCESSOS, resultados }, null, 2));
const naSe = naoSeAplicam ? `; ${naoSeAplicam} não se aplica(m) a esta tiragem` : '';
console.log(falhas ? `\n${falhas} verificação(ões) falharam${naSe}` : `\nfim-a-fim aprovado (${resultados.length - naoSeAplicam} verificações${naSe})`);
process.exit(falhas ? 1 : 0);
