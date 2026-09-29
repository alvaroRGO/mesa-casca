"""Gera icon-192.png e icon-512.png da Mesa (folha com linhas e um grifo amarelo).
O desenho fica dentro da zona segura central (80 %), então serve também como ícone «maskable».
Uso: python tools/gerar_icones.py   (requer Pillow)"""
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
AZUL = (39, 87, 201, 255)      # --accent
PAPEL = (255, 255, 255, 255)
LINHA = (93, 102, 117, 255)    # --muted
GRIFO = (249, 226, 122, 255)   # --marker


def icone(n: int) -> Image.Image:
    esc = 4  # desenha grande e reduz, para bordas suaves
    N = n * esc
    im = Image.new('RGBA', (N, N), AZUL)
    d = ImageDraw.Draw(im)
    # folha: 44 % da largura, centrada, com um canto dobrado
    w, h = int(N * 0.44), int(N * 0.56)
    x0, y0 = (N - w) // 2, (N - h) // 2
    dobra = int(w * 0.24)
    d.polygon([(x0, y0), (x0 + w - dobra, y0), (x0 + w, y0 + dobra), (x0 + w, y0 + h), (x0, y0 + h)], fill=PAPEL)
    d.polygon([(x0 + w - dobra, y0), (x0 + w - dobra, y0 + dobra), (x0 + w, y0 + dobra)], fill=(210, 216, 228, 255))
    # linhas de texto
    mx = int(w * 0.14); lh = max(2, int(h * 0.045)); passo = int(h * 0.13)
    for i in range(6):
        y = y0 + int(h * 0.22) + i * passo
        fim = x0 + w - mx - (int(w * 0.25) if i == 5 else 0)
        if i == 2:  # linha grifada
            d.rounded_rectangle([x0 + mx - int(w * 0.04), y - int(lh * 1.6), x0 + w - mx + int(w * 0.04), y + int(lh * 1.6)], radius=int(lh * 0.8), fill=GRIFO)
        d.rounded_rectangle([x0 + mx, y - lh // 2, fim, y + lh // 2], radius=lh // 2, fill=LINHA)
    return im.resize((n, n), Image.LANCZOS)


if __name__ == '__main__':
    for n in (192, 512):
        p = RAIZ / f'icon-{n}.png'
        icone(n).save(p, optimize=True)
        print(p.name, p.stat().st_size, 'bytes')
