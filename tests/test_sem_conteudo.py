"""Falha se algum conteúdo da tese aparecer neste repositório público.

Regras:
1. nenhum PDF, nenhum trechos*.json, estado*.json ou respostas*.json (no disco e no índice do git);
2. só as extensões da casca são aceitas;
3. pdf.min.js e pdf.worker.min.js são os arquivos do pdf.js 3.11.174, conferidos por SHA-256;
4. nos demais arquivos de texto, nenhum marcador da tese (nome do projeto, aeronave, instituição,
   identificador da tiragem).
Uso: python tests/test_sem_conteudo.py   (código de saída 0 = aprovado)"""
import hashlib
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PROIBIDOS_NOME = [re.compile(p, re.I) for p in (r'\.pdf$', r'(^|/)trechos[^/]*\.json$', r'(^|/)estado[^/]*\.json$', r'(^|/)respostas[^/]*\.json$')]
EXT_OK = {'.html', '.js', '.mjs', '.py', '.md', '.png', '.webmanifest', '.gitignore', '.gitattributes', '.nojekyll', ''}
VENDOR = {
    'pdf.min.js': '5b5799e6f8c680663207ac5b42ee14eed2a406fa7af48f50c154f0c0b1566946',
    'pdf.worker.min.js': 'feabdf309770ed24bba31a5467836cdc8cf639c705af27d52b585b041bb8527b',
}
# marcadores montados por partes para este arquivo não acusar a si mesmo
MARCAS = [
    re.compile(r'\bP' + r'INN\b'), re.compile(r'\bS' + r'ADS\b'), re.compile(r'\bF-?' + r'16\b'),
    re.compile(r'8d4d' + r'1ea3', re.I), re.compile(r'Tecnol' + r'ógico de Aeron', re.I),
    re.compile(r'\bdisserta' + r'tion\b', re.I), re.compile(r'aerodyn' + r'amic', re.I), re.compile(r'side' + r'slip', re.I),
]


def arquivos():
    vistos = set()
    for p in RAIZ.rglob('*'):
        if p.is_file() and '.git' not in p.relative_to(RAIZ).parts and '__pycache__' not in p.parts:
            vistos.add(p.relative_to(RAIZ).as_posix())
    try:
        out = subprocess.run(['git', '-C', str(RAIZ), 'ls-files', '-z'], capture_output=True, check=True).stdout
        vistos.update(x for x in out.decode('utf-8').split('\0') if x)
    except Exception:
        pass
    return sorted(vistos)


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    falhas = []
    lista = arquivos()
    for rel in lista:
        if any(r.search(rel) for r in PROIBIDOS_NOME):
            falhas.append(f'arquivo proibido na casca: {rel}')
            continue
        p = RAIZ / rel
        ext = p.suffix.lower() if p.suffix else ('.' + p.name.lstrip('.') if p.name.startswith('.') else '')
        if ext not in EXT_OK:
            falhas.append(f'extensão fora da casca: {rel}')
        if not p.exists():
            continue
        if p.stat().st_size > 2_000_000:
            falhas.append(f'arquivo grande demais para a casca: {rel}')
        if rel in VENDOR:
            h = hashlib.sha256(p.read_bytes()).hexdigest()
            if h != VENDOR[rel]:
                falhas.append(f'{rel} não é o pdf.js 3.11.174 esperado (sha256 {h})')
            continue
        if ext == '.png':
            continue
        texto = p.read_text(encoding='utf-8', errors='replace')
        for m in MARCAS:
            achado = m.search(texto)
            if achado:
                falhas.append(f'marcador da tese em {rel}: «{achado.group(0)}»')
    if falhas:
        print('REPROVADO: conteúdo da tese na casca pública')
        for f in falhas:
            print(' -', f)
        return 1
    print(f'aprovado: {len(lista)} arquivos conferidos, nenhum conteúdo da tese na casca')
    return 0


if __name__ == '__main__':
    sys.exit(main())
