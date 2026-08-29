"""
Gera os PNG do manifest a partir do desenho que já existe em SVG.

## Por que este script existe

`vite.config.ts` declara `icons/icon-192.png` e `icons/icon-512.png`, e o
`index.html` aponta o `apple-touch-icon` para o primeiro. **Nenhum dos dois
existia** — a pasta tinha só um `icon-192.svg`. O Chrome exige um 192 e um 512
em PNG para considerar o app instalável, então o PWA simplesmente não
instalava, e no iPhone o ícone da tela de início ficava em branco.

## Por que redesenhar em vez de converter o SVG

Converter exigiria um renderizador de SVG (cairosvg, rsvg) que não está no
container, e o desenho é geométrico o bastante para caber em vinte linhas de
Pillow — que já está aqui por causa da foto de perfil.

O que muda em relação ao SVG: a estrela deixa de ser o emoji 🌟 e passa a ser
desenhada. Emoji depende de uma fonte com aqueles glifos, que o container não
tem, e o resultado seria um quadrado vazio no meio do ícone.

Fora isso é o MESMO desenho: fundo `#1a0f2e`, cantos arredondados, o anel e o
disco em `#7c3aed`. As cores vêm do manifest e do `favicon.svg`; não inventei
identidade nova.

## Como rodar

    docker compose -f .devcontainer/docker-compose.yml exec -T app bash -c \
      'cd /workspace/Umbanda-Ponto-Organizer/artifacts/pontos-umbanda && \
       uv run --with pillow python scripts/gerar-icones.py'
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

DESTINO = Path(__file__).resolve().parent.parent / "public" / "icons"

FUNDO = (26, 15, 46, 255)      # #1a0f2e — o mesmo do favicon.svg
ROXO = (124, 58, 237, 255)     # #7c3aed — o theme_color do manifest
ESTRELA = (250, 204, 21, 255)  # o amarelo que o emoji 🌟 tem, desenhado

#: Quanto do lado vira raio do canto. 36/192 é o `rx` do SVG.
CANTO = 36 / 192


def _estrela(centro: float, raio: float, pontas: int = 5) -> list[tuple[float, float]]:
    """Os vértices de uma estrela, alternando raio externo e interno."""
    interno = raio * 0.42
    passos = []
    for i in range(pontas * 2):
        r = raio if i % 2 == 0 else interno
        # -90° para a ponta ficar para cima.
        angulo = math.radians(i * 180 / pontas - 90)
        passos.append((centro + r * math.cos(angulo), centro + r * math.sin(angulo)))
    return passos


def desenhar(lado: int) -> Image.Image:
    # 4x e reduz no fim: é o antisserrilhado do pobre, e é o que faz o ícone
    # não parecer recortado a tesoura em tela de celular.
    escala = 4
    px = lado * escala
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([0, 0, px - 1, px - 1], radius=int(px * CANTO), fill=FUNDO)

    centro = px / 2
    anel = px * (60 / 192)
    disco = px * (40 / 192)
    # `opacity` do SVG vira alfa na cor: 0.5 no anel, 0.2 no disco.
    d.ellipse(
        [centro - anel, centro - anel, centro + anel, centro + anel],
        outline=(*ROXO[:3], 128), width=max(1, int(px * 4 / 192)),
    )
    d.ellipse(
        [centro - disco, centro - disco, centro + disco, centro + disco],
        fill=(*ROXO[:3], 51),
    )
    d.polygon(_estrela(centro, px * (34 / 192)), fill=ESTRELA)

    return img.resize((lado, lado), Image.LANCZOS)


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    for lado in (192, 512):
        caminho = DESTINO / f"icon-{lado}.png"
        desenhar(lado).save(caminho, format="PNG", optimize=True)
        print(f"  {caminho.relative_to(DESTINO.parents[2])}  {caminho.stat().st_size} bytes")


if __name__ == "__main__":
    main()
