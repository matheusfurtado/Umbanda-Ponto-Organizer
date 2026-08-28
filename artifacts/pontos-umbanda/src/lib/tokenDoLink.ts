/**
 * O token do link, que vem no **fragmento** e não na query string.
 *
 * `#token=` não é enviado ao servidor: fica fora do log de acesso, fora do
 * histórico compartilhado e fora do `Referer` de qualquer recurso que a página
 * carregue depois. Na query string, o token de redefinir senha É a senha,
 * escrita em texto puro num arquivo que ninguém trata como segredo.
 *
 * Ler `location.search` aqui como reserva desfaria o conserto no front: o
 * formato antigo voltaria a funcionar, e voltar a funcionar é voltar a ser
 * usado. Nada foi publicado ainda; não existe link antigo em caixa nenhuma.
 */
export function tokenDoLink(): string | null {
  return new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
}
