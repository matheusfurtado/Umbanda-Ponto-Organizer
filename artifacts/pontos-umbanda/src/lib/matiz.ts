/**
 * Uma cor estável a partir de um nome.
 *
 * Nem playlist nem artista têm cor no banco, e pedir para a pessoa escolher uma
 * seria atrito no pior lugar: ela quer montar a playlist ou achar o ponto, não
 * decorar. Então a cor sai do NOME.
 *
 * **Estável importa.** Cor sorteada a cada render faria a lista piscar e
 * destruiria a memória visual que a capa existe para criar — é por ela que se
 * reconhece a playlist de sexta sem ler o nome.
 *
 * Mora aqui, e não dentro do `CapaGira`, porque a vitrine de artistas passou a
 * usar a mesma regra. Regra que vale em mais de um lugar, reimplementada em
 * cada um, diverge — e o que divergiria aqui é a identidade visual de duas
 * listas que aparecem na mesma tela.
 */
export function matiz(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 360;
  return h;
}
