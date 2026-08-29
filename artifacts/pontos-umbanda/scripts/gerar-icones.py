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

## O desenho mora em `arte.py`

Este arquivo só escolhe tamanhos e escreve arquivo. A arte e a paleta saíram
para `arte.py` quando o `gerar-opengraph.py` passou a precisar das duas — e a
explicação do modo maskable foi junto, para ficar do lado do código que a
cumpre.

## Como rodar

    docker compose -f .devcontainer/docker-compose.yml exec -T app bash -c \
      'cd /workspace/Umbanda-Ponto-Organizer/artifacts/pontos-umbanda && \
       uv run --with pillow python scripts/gerar-icones.py'
"""

from pathlib import Path

from arte import desenhar

DESTINO = Path(__file__).resolve().parent.parent / "public" / "icons"

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
