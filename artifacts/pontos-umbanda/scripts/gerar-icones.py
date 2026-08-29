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

## E o `maskable`, que é outro desenho da mesma arte

O manifest declarava `purpose: "maskable"` apontando para o `icon-512.png`
comum. Isso está errado de dois jeitos, e os dois só aparecem no Android:

1. **Os cantos são transparentes.** O `rounded_rectangle` abaixo desenha uma
   moldura de raio 36/192. A máscara do launcher — squircle, círculo, gota,
   depende do fabricante — chega mais perto do canto do que esse
   arredondamento, e o vazio aparece: o ícone ganha ombros escuros e uma
   silhueta de dois arredondamentos sobrepostos.
2. **O anel e o disco são translúcidos.** O `ImageDraw` SUBSTITUI o pixel em
   vez de compor, então eles saem com alfa 128 e 51 de verdade, não como roxo
   composto sobre o campo. Sobre um papel de parede claro, o anel troca de cor.

O modo maskable resolve os dois: sangra o campo até a borda (sem cantos) e
compõe as formas translúcidas SOBRE o campo opaco, achatando o alfa. A arte
não precisa encolher — o anel externo fica a 165px do centro num ícone de 512,
e a zona segura do contrato maskable tem raio 204,8px (2/5 do lado).

**`purpose: "any maskable"` no mesmo arquivo é armadilha**, e por isso são dois
arquivos: um maskable é desenhado com borda sacrificial, e exibido SEM máscara
(aba do navegador, lista de apps no desktop) essa borda vira ar morto.

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


def desenhar(lado: int, *, maskable: bool = False) -> Image.Image:
    # 4x e reduz no fim: é o antisserrilhado do pobre, e é o que faz o ícone
    # não parecer recortado a tesoura em tela de celular.
    escala = 4
    px = lado * escala
    campo = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(campo)

    if maskable:
        # SANGRA até a borda. Quem recorta é a máscara do launcher, e ela
        # chega mais perto do canto do que qualquer arredondamento nosso.
        d.rectangle([0, 0, px - 1, px - 1], fill=FUNDO)
    else:
        d.rounded_rectangle([0, 0, px - 1, px - 1], radius=int(px * CANTO), fill=FUNDO)

    # As formas translúcidas vão numa CAMADA, não direto no campo.
    #
    # `ImageDraw` substitui o pixel: desenhar o anel com alfa 128 direto no
    # campo deixava o ícone com um anel de fato translúcido, que muda de cor
    # conforme o fundo de quem instalou. Compor a camada achata isso para o
    # roxo sobre `#1a0f2e` que o desenho sempre quis dizer.
    formas = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    dd = ImageDraw.Draw(formas)

    centro = px / 2
    anel = px * (60 / 192)
    disco = px * (40 / 192)
    # `opacity` do SVG vira alfa na cor: 0.5 no anel, 0.2 no disco.
    dd.ellipse(
        [centro - anel, centro - anel, centro + anel, centro + anel],
        outline=(*ROXO[:3], 128), width=max(1, int(px * 4 / 192)),
    )
    dd.ellipse(
        [centro - disco, centro - disco, centro + disco, centro + disco],
        fill=(*ROXO[:3], 51),
    )
    dd.polygon(_estrela(centro, px * (34 / 192)), fill=ESTRELA)

    img = Image.alpha_composite(campo, formas)
    img = img.resize((lado, lado), Image.LANCZOS)
    # Maskable sem canal alfa, de propósito: transparência num maskable é
    # convite a o launcher achar buraco onde não deve haver.
    return img.convert("RGB") if maskable else img


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    saidas = [(f"icon-{lado}.png", lado, False) for lado in (192, 512)]
    # O 512 maskable basta: o Android pega o maior e reescala. O 192 sai junto
    # porque custa uma linha e poupa uma reamostragem no aparelho.
    saidas += [(f"icon-{lado}-maskable.png", lado, True) for lado in (192, 512)]
    for nome, lado, maskable in saidas:
        caminho = DESTINO / nome
        desenhar(lado, maskable=maskable).save(caminho, format="PNG", optimize=True)
        print(f"  {caminho.relative_to(DESTINO.parents[2])}  {caminho.stat().st_size} bytes")


if __name__ == "__main__":
    main()
