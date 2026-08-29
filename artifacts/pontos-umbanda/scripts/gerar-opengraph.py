"""
O cartão que aparece quando alguém cola o link do app no WhatsApp.

## Por que não é uma captura de tela

Havia um `public/opengraph.jpg` desde julho, e ele NÃO era declarado em lugar
nenhum — o `index.html` não tinha uma linha de OpenGraph. Quando fui usá-lo,
era uma captura antiga dizendo **"10 orixás · 3 pontos · 0 favoritos"**, com
quase todo orixá em "0 subcategorias · 0 pontos". O acervo tem 520 pontos. O
cartão anunciaria um app vazio.

Captura envelhece de dois jeitos — o número muda e a interface muda —, e este
cartão envelhece pior que o resto: **o WhatsApp e o Facebook cacheiam a imagem
por muito tempo**, então corrigir depois não alcança quem já recebeu o link.

## Por que não tem número nenhum

Pela mesma razão que o `CLAUDE.md` abre com um aviso sobre números: eles
envelhecem em silêncio. "520 pontos" num arquivo cacheado fora do nosso alcance
é a pior versão desse problema. O cartão diz o que o app É.

## A fonte, que foi o trabalho de verdade

O container não tem NENHUMA fonte TrueType, e a padrão do Pillow não desenha
acento: "orixá" e "ação" saem com quadrado no lugar da letra. Numa peça em
português sobre Umbanda, isso é inaceitável — e trocar as palavras para caber
na ferramenta seria mudar o produto para agradar o build.

A saída é a fonte do PRÓPRIO app: `@fontsource-variable/inter` traz `.woff2`,
que o Pillow não lê, e o `fontTools` converte para TTF em memória. Bônus: o
cartão fica com a mesma letra da interface.

**Se a fonte não carregar, este script FALHA** em vez de cair para a padrão.
Um cartão com quadrado no meio de "orixá" é pior que nenhum cartão, e cai no
cache de quem recebeu.

## Como rodar

    docker compose -f .devcontainer/docker-compose.yml exec -T app bash -c \
      'cd /workspace/Umbanda-Ponto-Organizer/artifacts/pontos-umbanda && \
       uv run --with pillow --with fonttools --with brotli \
         python scripts/gerar-opengraph.py'
"""

import io
from pathlib import Path

from arte import FUNDO, ROXO, desenhar_arte
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "public" / "opengraph.png"

#: 1200x630 é a proporção do card grande (1,91:1) no Facebook, no WhatsApp e no
#: Twitter. Abaixo de 600x315 os dois primeiros degradam para a miniatura
#: quadrada, que some no meio da conversa.
LARGURA, ALTURA = 1200, 630

TITULO = "Pontos de Umbanda"
LINHAS = [
    "O acervo organizado por orixá, na ordem da gira.",
    "Funciona sem sinal — o acervo fica no aparelho.",
]

FONTE_WOFF2 = (
    RAIZ / "node_modules" / "@fontsource-variable" / "inter" / "files"
    / "inter-latin-wght-normal.woff2"
)


def _fonte(tamanho: int, peso: int) -> ImageFont.FreeTypeFont:
    """A Inter do app, convertida de woff2 para TTF em memória."""
    from fontTools.ttLib import TTFont  # só este script precisa

    if not FONTE_WOFF2.is_file():
        raise SystemExit(
            f"não achei {FONTE_WOFF2}. Rode `pnpm install` antes: sem a fonte "
            "do app, o cartão sairia com quadrado no lugar dos acentos."
        )
    tt = TTFont(FONTE_WOFF2)
    tt.flavor = None  # tira a compressão woff2; o que sobra é TTF
    buffer = io.BytesIO()
    tt.save(buffer)
    buffer.seek(0)
    fonte = ImageFont.truetype(buffer, tamanho)
    # Variável: o eixo `wght` é o que dá o negrito do título sem outro arquivo.
    fonte.set_variation_by_axes([peso])
    return fonte


#: Onde o bloco de texto começa e onde ele TEM de acabar.
#:
#: A primeira versão cravava `x = 600` e tamanhos fixos, e o resultado
#: transbordava: "Pontos de Umbanda" saía cortado na borda direita, e as duas
#: linhas passavam de 1200px. Num cartão que ninguém abre depois de gerado, um
#: transbordo vira o que todo mundo vê e ninguém revisa. Agora o tamanho da
#: letra é MEDIDO até caber.
TEXTO_X = 560
MARGEM_DIREITA = 64


def _cabendo(texto: str, teto: int, peso: int, largura: int) -> ImageFont.FreeTypeFont:
    """A maior letra em que `texto` ainda cabe em `largura`."""
    regua = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    tamanho = teto
    while tamanho > 8:
        fonte = _fonte(tamanho, peso)
        if regua.textlength(texto, font=fonte) <= largura:
            return fonte
        tamanho -= 2
    raise SystemExit(f"não consegui caber {texto!r} em {largura}px")


def gerar() -> Image.Image:
    img = Image.new("RGBA", (LARGURA, ALTURA), (*FUNDO[:3], 255))

    # Um halo do roxo do tema atrás da marca, para o cartão não ser um retângulo
    # chapado. Em camada e composto, pelo mesmo motivo do ícone: o `ImageDraw`
    # substitui o pixel em vez de compor.
    cx, cy = 290, ALTURA // 2
    halo = Image.new("RGBA", (LARGURA, ALTURA), (0, 0, 0, 0))
    dh = ImageDraw.Draw(halo)
    for i in range(14):
        raio = 250 - i * 17
        dh.ellipse([cx - raio, cy - raio, cx + raio, cy + raio], fill=(*ROXO[:3], 5))
    img = Image.alpha_composite(img, halo)

    marca = desenhar_arte(280)
    img.alpha_composite(marca, (cx - 140, cy - 140))

    d = ImageDraw.Draw(img)
    disponivel = LARGURA - TEXTO_X - MARGEM_DIREITA

    titulo = _cabendo(TITULO, 62, 700, disponivel)
    corpo = _fonte(
        min(
            _cabendo(linha, 30, 400, disponivel).size for linha in LINHAS
        ),
        400,
    )

    altura_bloco = titulo.size + 28 + len(LINHAS) * (corpo.size + 16)
    y = cy - altura_bloco // 2

    d.text((TEXTO_X, y), TITULO, font=titulo, fill=(255, 255, 255))
    y += titulo.size + 28
    for linha in LINHAS:
        d.text((TEXTO_X, y), linha, font=corpo, fill=(196, 190, 214))
        y += corpo.size + 16

    return img.convert("RGB")


def main() -> None:
    img = gerar()
    img.save(DESTINO, format="PNG", optimize=True)
    print(f"  {DESTINO.relative_to(RAIZ)}  {img.size}  {DESTINO.stat().st_size} bytes")


if __name__ == "__main__":
    main()
