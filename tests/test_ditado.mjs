// Teste do botão «Ditar» (sem rede e sem navegador): node --test tests/test_ditado.mjs
// Roda o código real do index.html (bloco «ditado») num DOM mínimo, com um SpeechRecognition de mentira que reproduz o
// Chrome do Android: eventos com resultIndex, parciais repetidas e em várias entradas, finais duplicadas (no mesmo
// índice, num índice novo e depois do reinício), fim de sessão a cada frase e erros. Frases sintéticas: nada da tese.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function bloco(marca) {
  const i = js.indexOf('  // ---------- ' + marca + ' ----------');
  assert.ok(i >= 0, 'bloco ausente no index.html: ' + marca);
  return js.slice(i, js.indexOf('  // ---------- ', i + 10));
}
const FONTE = bloco('ditado (botão «Ditar»)');

class El {
  constructor(id) { this.id = id; this.hidden = false; this.className = ''; this.textContent = ''; this.value = ''; this.attrs = {}; this.on = {}; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  click() { (this.on.click || []).forEach(f => f({ type: 'click' })); }
}
// SpeechRecognition de mentira, no jeito do Chrome do Android
function criarSR(reg) {
  return class SRFalso {
    constructor() { reg.inst.push(this); this.ativo = false; this.stops = 0; this.aborts = 0; }
    start() {
      if (reg.falhaStart) throw new Error('sem permissão');
      if (this.ativo) throw new Error('InvalidStateError: já iniciado');
      this.ativo = true; reg.starts++;
      reg.config.push({ continuous: this.continuous, interimResults: this.interimResults, lang: this.lang, maxAlternatives: this.maxAlternatives });
    }
    stop() { this.stops++; }
    abort() { this.aborts++; }
    resultado(resultIndex, lista) { this.onresult({ resultIndex, results: lista.map(([t, fin]) => Object.assign([{ transcript: t, confidence: 0.9 }], { isFinal: !!fin })) }); }
    erro(e) { this.onerror({ error: e }); }
    fim() { this.ativo = false; this.onend(); }
  };
}
function ambiente({ online = true, sr = true } = {}) {
  const ids = {};
  const $ = id => (ids[id] ||= new El(id));
  $('composer').hidden = false; $('btnDictate').className = 'btn'; $('dictLabel').textContent = 'Ditar'; $('dictPrev').hidden = true;
  const reg = { inst: [], starts: 0, config: [], falhaStart: false };
  const window = {}; if (sr) window.webkitSpeechRecognition = criarSR(reg);
  const document = { visibilityState: 'visible', on: {}, addEventListener(t, f) { (this.on[t] ||= []).push(f); } };
  const ctx = { $, S: { dictBlocked: false }, navigator: { onLine: online }, window, document, reg, toasts: [], gravados: [] };
  ctx.toast = m => ctx.toasts.push(m);
  ctx.lsSet = (k, v) => ctx.gravados.push(['lsSet', k, v]);
  ctx.localStorage = { setItem: (k, v) => ctx.gravados.push(['setItem', k, v]), removeItem: k => ctx.gravados.push(['removeItem', k]) };
  vm.createContext(ctx);
  vm.runInContext(FONTE, ctx);
  ctx.rec = () => reg.inst.at(-1);
  ctx.caixa = () => $('compText').value;
  ctx.previa = () => ($('dictPrev').hidden ? null : $('dictPrev').textContent);
  ctx.botao = () => ({ rotulo: $('dictLabel').textContent, classe: $('btnDictate').className, aria: $('btnDictate').getAttribute('aria-pressed'), oculto: $('btnDictate').hidden });
  return ctx;
}
const vezes = (t, f) => t.split(f).length - 1;

test('«Ditar»: uma frase por sessão, pt-BR, com parciais; o botão vira «Parar» com o ponto vermelho e volta', () => {
  const ctx = ambiente();
  ctx.$('btnDictate').click();
  assert.equal(ctx.reg.starts, 1);
  assert.deepEqual(ctx.reg.config[0], { continuous: false, interimResults: true, lang: 'pt-BR', maxAlternatives: 1 });
  assert.deepEqual(ctx.botao(), { rotulo: 'Parar', classe: 'btn gravando', aria: 'true', oculto: false });
  ctx.$('btnDictate').click();
  assert.equal(ctx.rec().stops, 1, '«Parar» chama stop(), que ainda entrega a frase em curso');
  assert.deepEqual(ctx.botao(), { rotulo: 'Ditar', classe: 'btn', aria: 'false', oculto: false });
});

test('Chrome do Android: parciais repetidas e finais duplicadas, com fim de sessão a cada frase; cada frase entra uma vez só', () => {
  const ctx = ambiente();
  ctx.$('btnDictate').click();
  const r = ctx.rec();
  // sessão 1: parciais crescentes, em várias entradas; a final chega num índice novo e depois repetida
  r.resultado(0, [['primeira', 0]]);
  assert.equal(ctx.caixa(), '', 'a parcial nunca vai para a caixa');
  assert.equal(ctx.previa(), 'primeira');
  r.resultado(0, [['primeira', 0], ['primeira frase', 0]]);
  assert.equal(ctx.caixa(), '');
  assert.equal(ctx.previa(), 'primeira frase', 'parcial crescente em duas entradas aparece uma vez');
  r.resultado(1, [['primeira', 0], ['primeira frase do ditado', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado');
  assert.equal(ctx.previa(), null, 'lê só a partir de resultIndex: a parcial velha da entrada 0 não volta para a prévia');
  r.resultado(1, [['primeira', 0], ['primeira frase do ditado', 1]]);
  r.resultado(2, [['primeira', 0], ['primeira frase do ditado', 1], ['primeira frase do ditado', 1]]);
  r.resultado(0, [['primeira frase do ditado', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado', 'final repetida no mesmo índice, num índice novo e no índice 0');
  r.fim();
  assert.equal(ctx.reg.starts, 2, 'o Chrome encerrou a sessão sozinho: recomeça');
  assert.equal(ctx.botao().rotulo, 'Parar');
  // sessão 2: a final cresce no mesmo índice (substitui) e depois volta mais curta (descarta)
  r.resultado(0, [['segunda', 0]]);
  assert.equal(ctx.previa(), 'segunda');
  r.resultado(0, [['segunda frase', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado segunda frase');
  r.resultado(0, [['segunda frase mais longa', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado segunda frase mais longa', 'a mesma frase, mais comprida, substitui');
  r.resultado(0, [['segunda frase', 1]]);
  r.resultado(0, [['Segunda  frase mais longa ', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado segunda frase mais longa');
  r.fim();
  assert.equal(ctx.reg.starts, 3);
  // sessão 3: a última final volta depois do reinício; «Parar» ainda entrega a frase em curso
  r.resultado(0, [['segunda frase mais longa', 1]]);
  assert.equal(ctx.caixa(), 'primeira frase do ditado segunda frase mais longa', 'igual à última acrescentada: descartada');
  ctx.$('btnDictate').click();
  assert.equal(r.stops, 1);
  assert.equal(ctx.botao().rotulo, 'Ditar');
  r.resultado(0, [['e fim', 0]]);
  assert.equal(ctx.previa(), null, 'depois de «Parar», nenhuma prévia');
  r.resultado(0, [['e fim', 1]]);
  r.fim();
  assert.equal(ctx.reg.starts, 3, 'depois de «Parar», não recomeça');
  const c = ctx.caixa();
  assert.equal(c, 'primeira frase do ditado segunda frase mais longa e fim');
  for (const f of ['primeira frase do ditado', 'segunda frase', 'e fim']) assert.equal(vezes(c, f), 1, f);
  assert.deepEqual(ctx.toasts, []);
});

test('o texto que o usuário escreve durante o ditado fica; a frase final entra no fim, com espaço só se precisar', () => {
  const ctx = ambiente();
  ctx.$('compText').value = 'Nota:';
  ctx.$('btnDictate').click();
  const r = ctx.rec();
  r.resultado(0, [['abc', 1]]);
  assert.equal(ctx.caixa(), 'Nota: abc');
  r.fim();
  ctx.$('compText').value += ' xyz ';
  r.resultado(0, [['def', 1]]);
  assert.equal(ctx.caixa(), 'Nota: abc xyz def');
  r.resultado(0, [['def ghi', 1]]);
  assert.equal(ctx.caixa(), 'Nota: abc xyz def ghi');
  ctx.$('compText').value += ' (!)';
  r.resultado(0, [['def ghi jkl', 1]]);
  assert.ok(ctx.caixa().startsWith('Nota: abc xyz def ghi (!)'), 'nunca apaga o que o usuário escreveu: ' + ctx.caixa());
  assert.ok(ctx.caixa().endsWith('def ghi jkl'));
  const d = ambiente();
  d.$('btnDictate').click();
  d.rec().resultado(0, [['   ', 1]]);
  assert.equal(d.caixa(), '', 'final vazia não entra');
  d.rec().resultado(0, [['olá', 0], [' mundo', 0]]);
  assert.equal(d.previa(), 'olá mundo', 'parcial em pedaços (Chrome do computador) aparece inteira');
  d.rec().resultado(0, [['terceira frase longa', 1]]);
  d.rec().resultado(0, [['terceira frase', 1]]);
  assert.equal(d.caixa(), 'terceira frase longa', 'pedaço da frase que a sessão já acrescentou: descartado');
});

test('«no-speech» recomeça em silêncio; cinco sessões seguidas sem fala param o ditado', () => {
  const ctx = ambiente();
  ctx.$('btnDictate').click();
  const r = ctx.rec();
  for (let k = 1; k <= 4; k++) { r.erro('no-speech'); r.fim(); assert.equal(ctx.reg.starts, k + 1); assert.equal(ctx.botao().rotulo, 'Parar'); }
  assert.deepEqual(ctx.toasts, [], 'sem aviso');
  r.erro('no-speech'); r.fim();
  assert.equal(ctx.reg.starts, 5, 'não recomeça mais');
  assert.equal(ctx.botao().rotulo, 'Ditar');
  assert.deepEqual(ctx.toasts, ['Ditado parado: nenhuma fala ouvida']);
  // uma sessão com fala zera a contagem
  const f = ambiente();
  f.$('btnDictate').click();
  const q = f.rec();
  for (let k = 0; k < 4; k++) { q.erro('no-speech'); q.fim(); }
  q.resultado(0, [['alguma coisa', 1]]); q.fim();
  for (let k = 0; k < 4; k++) { q.erro('no-speech'); q.fim(); }
  assert.equal(f.botao().rotulo, 'Parar');
  assert.equal(f.reg.starts, 10);
});

test('permissão negada, serviço bloqueado ou sem rede: para, esconde o botão nesta sessão e avisa «Use o microfone do teclado»', () => {
  for (const e of ['not-allowed', 'service-not-allowed', 'network', 'language-not-supported']) {
    const ctx = ambiente();
    ctx.$('btnDictate').click();
    ctx.rec().erro(e); ctx.rec().fim();
    assert.equal(ctx.reg.starts, 1, e + ': não recomeça');
    assert.equal(ctx.botao().oculto, true, e);
    assert.equal(ctx.botao().rotulo, 'Ditar');
    assert.equal(ctx.S.dictBlocked, true);
    assert.deepEqual(ctx.toasts, ['Use o microfone do teclado'], e);
    ctx.startDictation();
    assert.equal(ctx.reg.inst.length, 1, e + ': bloqueado até o app reabrir');
    assert.deepEqual(ctx.gravados, [['removeItem', 'mesa.srBlocked']], e + ': nada é gravado (vale só nesta sessão), e o bloqueio antigo sai');
    assert.equal(ctx.dictShow(), false);
  }
  const o = ambiente();
  o.$('btnDictate').click();
  o.rec().erro('audio-capture'); o.rec().fim();
  assert.equal(o.reg.starts, 1);
  assert.equal(o.botao().rotulo, 'Ditar');
  assert.equal(o.botao().oculto, false, 'outro erro não esconde o botão');
  assert.deepEqual(o.toasts, ['Ditado interrompido (audio-capture); use o microfone do teclado']);
  const t = ambiente(); t.reg.falhaStart = true;
  t.$('btnDictate').click();
  assert.equal(t.botao().oculto, true, 'start() que falha também bloqueia');
  assert.equal(t.botao().rotulo, 'Ditar');
  assert.deepEqual(t.toasts, ['Use o microfone do teclado']);
});

test('fechar o compositor, perder a rede ou sair do app descarta o que estava sendo ouvido; sem SpeechRecognition, nada', () => {
  const ctx = ambiente();
  ctx.$('btnDictate').click();
  const r = ctx.rec();
  r.resultado(0, [['meio', 0]]);
  ctx.stopDictation(true);
  assert.equal(r.aborts, 1);
  assert.equal(ctx.previa(), null);
  r.resultado(0, [['meio da frase', 1]]); r.fim();
  assert.equal(ctx.caixa(), '', 'abortado: a frase em curso não entra');
  assert.equal(ctx.reg.starts, 1);
  // compositor fechado quando a sessão termina: não recomeça
  ctx.$('btnDictate').click();
  ctx.$('composer').hidden = true;
  ctx.rec().fim();
  assert.equal(ctx.reg.starts, 2);
  assert.equal(ctx.botao().rotulo, 'Ditar');
  // sem rede: o botão some e o ditado em curso é abortado
  ctx.$('composer').hidden = false;
  ctx.$('btnDictate').click();
  ctx.navigator.onLine = false; ctx.updateDictate();
  assert.equal(ctx.botao().oculto, true);
  assert.equal(ctx.rec().aborts, 1);
  assert.equal(ctx.botao().rotulo, 'Ditar');
  // app em segundo plano
  const v = ambiente();
  v.$('btnDictate').click();
  v.document.visibilityState = 'hidden'; v.document.on.visibilitychange.forEach(f => f());
  assert.equal(v.rec().aborts, 1);
  assert.equal(v.botao().rotulo, 'Ditar');
  const n = ambiente({ sr: false });
  assert.equal(n.dictShow(), false);
  n.$('btnDictate').click();
  assert.equal(n.botao().rotulo, 'Ditar');
  assert.equal(ambiente({ online: false }).dictShow(), false);
});

test('HTML: botão ao lado da caixa, linha da parcial e dica fixa embaixo; ponto vermelho; nada de continuous = true nem bloqueio gravado', () => {
  assert.match(html, /<div class="dictrow"><textarea id="compText"[^>]*><\/textarea><button class="btn" id="btnDictate" type="button" aria-pressed="false" hidden><span class="dot" aria-hidden="true"><\/span><span id="dictLabel">Ditar<\/span><\/button><\/div>\s*<div class="dictprev" id="dictPrev" aria-live="polite" hidden><\/div>\s*<div class="dicthelp" id="dictHelp">Dica: o microfone do teclado dita sem rede\.<\/div>/);
  assert.match(html, /\.btn\.gravando \.dot \{ display: inline-block; \}/);
  assert.match(html, /\.btn \.dot \{[^}]*background: #E0322B;/);
  assert.match(html, /\.dicthelp \{[^}]*font-size: 12px;/);
  assert.match(html, /\.dictprev \{[^}]*color: var\(--muted\);/);
  assert.doesNotMatch(js, /.continuouss*=s*true/);
  assert.doesNotMatch(js, /lsSet\('mesa\.srBlocked'|lsGetEarly/);
  assert.doesNotMatch(html, /id="dictState"/);
});
