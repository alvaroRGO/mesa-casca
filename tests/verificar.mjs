// Roda todas as verificações da casca sem rede: node tests/verificar.mjs
// 1) node --check de todos os scripts (inclusive o <script> embutido no index.html)
// 2) versão do sync.js igual no index.html e no sw.js
// 3) testes unitários da fusão, do sync e do ícone «Traduzir» (node --test)
// 4) teste de ausência de conteúdo da tese (Python)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const py = process.env.PYTHON || 'python';
let falhas = 0;
const passo = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHA', nome); console.log(String(e.stdout || '') + String(e.stderr || '') || e.message); } };

const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const tmp = mkdtempSync(join(tmpdir(), 'mesa-'));
inline.forEach((code, i) => writeFileSync(join(tmp, `inline-${i}.js`), code));
const scripts = ['sync.js', 'sw.js', ...readdirSync(join(raiz, 'tests')).filter(f => f.endsWith('.mjs')).map(f => 'tests/' + f)];
for (const s of scripts) passo('node --check ' + s, () => execFileSync(process.execPath, ['--check', join(raiz, s)], { stdio: 'pipe' }));
inline.forEach((_, i) => passo(`node --check index.html <script> ${i + 1}`, () => execFileSync(process.execPath, ['--check', join(tmp, `inline-${i}.js`)], { stdio: 'pipe' })));
passo('versão do sync.js igual no index.html e no sw.js', () => {
  const a = html.match(/sync\.js\?v=(\d+)/); const b = readFileSync(join(raiz, 'sw.js'), 'utf8').match(/sync\.js\?v=(\d+)/);
  if (!a || !b || a[1] !== b[1]) throw new Error(`index ${a && a[1]} x sw ${b && b[1]}`);
});
passo('manifest.webmanifest é JSON válido com ícones 192 e 512', () => {
  const m = JSON.parse(readFileSync(join(raiz, 'manifest.webmanifest'), 'utf8'));
  const tam = m.icons.map(i => i.sizes);
  if (m.display !== 'standalone' || !tam.includes('192x192') || !tam.includes('512x512')) throw new Error(JSON.stringify(m));
});
passo('testes da fusão, do sync e do ícone Traduzir (node --test)', () => execFileSync(process.execPath, ['--test', join(raiz, 'tests', 'test_fusao.mjs'), join(raiz, 'tests', 'test_sync.mjs'), join(raiz, 'tests', 'test_traduzir.mjs')], { stdio: 'pipe' }));
passo('sem conteúdo da tese (tests/test_sem_conteudo.py)', () => execFileSync(py, [join(raiz, 'tests', 'test_sem_conteudo.py')], { stdio: 'pipe' }));
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : '\ntodas as verificações passaram');
process.exit(falhas ? 1 : 0);
