/**
 * Os Termos de Uso.
 *
 * ## Por que eles existem antes de haver cobrança de verdade
 *
 * O CDC (art. 46) diz que contrato cujos termos não foram previamente
 * apresentados **não obriga o consumidor**. Sem esta página, uma assinatura de
 * R$ 9,90/mês seria inexigível — e a pessoa que pagasse teria razão em pedir
 * tudo de volta.
 *
 * ## O que está aqui é o que o código faz
 *
 * O teste de 15 dias, a renovação, o cancelamento e o que se perde ao acabar o
 * plano foram lidos de `servicos/teste_gratis.py`, `servicos/entitlements.py` e
 * `routers/assinatura.py`. Prometer aqui o que o código não cumpre é o mesmo
 * defeito de uma métrica que mente, com consequência jurídica junto.
 */

import { Link } from "wouter";
import { FileText } from "lucide-react";
import { AvisoLegalPendente } from "@/componentes/AvisoLegalPendente";
import { ATUALIZADO_EM, CONTROLADOR } from "@/dominio/controlador";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-bold text-foreground">{titulo}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

export function TelaTermos() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <FileText className="h-6 w-6 text-primary" aria-hidden /> Termos de Uso
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Última revisão: {ATUALIZADO_EM}.
      </p>

      <AvisoLegalPendente />

      <Secao titulo="Quem oferece este serviço">
        <p>
          <strong>{CONTROLADOR.nome}</strong> ({CONTROLADOR.documento}). Contato:{" "}
          <strong>{CONTROLADOR.contato}</strong>.
        </p>
      </Secao>

      <Secao titulo="O que você contrata, e o que é grátis">
        <p>
          <strong>Cobra-se a ferramenta, não o conteúdo religioso.</strong> Ler a
          letra de qualquer ponto e buscar no acervo é grátis, sempre, com ou sem
          conta.
        </p>
        <p>O plano pago acrescenta:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>o acervo organizado por orixá e seção, na ordem da gira;</li>
          <li>reordenar os pontos do seu jeito;</li>
          <li>montar playlists de gira;</li>
          <li>sincronizar entre aparelhos;</li>
          <li>usar sem internet.</li>
        </ul>
      </Secao>

      <Secao titulo="Preço, teste e renovação">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Todo cadastro começa com 15 dias de teste</strong>, com os
            mesmos direitos do plano pago. Não pedimos cartão para isso.
          </li>
          {/* SEM PREÇO ESCRITO AQUI, e isso é o conserto.
              
              Dizia "R$ 9,90 por mês" e "renova a cada mês" — com o plano ANUAL
              ativo no banco. Quem assinasse o anual lia preço e periodicidade
              errados no exato lugar onde o CDC art. 46 exige a apresentação
              prévia, que é o motivo declarado desta página existir.
              
              Preço escrito à mão numa página estática é uma tabela que mente
              assim que alguém muda o valor no banco. Os planos vêm do servidor
              na tela de assinatura; aqui fica a REGRA, que é o que os Termos
              têm de dizer. */}
          <li>
            <strong>O preço e a periodicidade de cada plano</strong> aparecem na{" "}
            <Link href="/planos" className="text-primary underline">
              tela de assinatura
            </Link>
            , antes de você confirmar. A cobrança é feita pelo provedor de
            pagamento.
          </li>
          <li>
            <strong>A assinatura se renova sozinha</strong> ao fim de cada
            período — mensal ou anual, conforme o plano que você escolher — até
            você cancelar.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Cancelar, e o que acontece depois">
        <p>
          Você pode cancelar quando quiser, e continua com acesso até o fim do
          período já pago — não devolvemos proporcional de mês começado.
        </p>
        <p>
          <strong>Nada do que é seu é apagado ao acabar o plano.</strong> As
          letras continuam ali, os pontos que você escreveu continuam ali, os
          seus favoritos continuam ali — e os vídeos também, que desde 03/09/2026
          não dependem de plano. O que sai é a organização por orixá, os
          repertórios, a sincronização e o uso sem internet.
        </p>
      </Secao>

      <Secao titulo="Arrependimento em 7 dias">
        <p>
          Como a contratação é pela internet, o Código de Defesa do Consumidor
          (art. 49) lhe dá <strong>7 dias corridos, contados do pagamento, para
          desistir e receber tudo de volta</strong>, sem precisar justificar.
          Basta escrever para {CONTROLADOR.contato}.
        </p>
      </Secao>

      <Secao titulo="Sobre os pontos e os vídeos">
        <p>
          Os pontos de Umbanda são tradição oral e patrimônio da comunidade. Nós
          não reivindicamos autoria de nenhum deles, e a leitura das letras é
          grátis justamente por isso.
        </p>
        <p>
          Os vídeos são do YouTube: nós não os hospedamos, apenas guardamos o
          endereço de um vídeo que parece corresponder ao ponto — e dizemos
          quando essa correspondência é só provável. O que se paga é o trabalho
          de casar, organizar e dar ferramentas de gira, não o conteúdo de
          terceiros.
        </p>
        <p>
          Se você é autor ou intérprete e quer que algo saia daqui, escreva para{" "}
          {CONTROLADOR.contato}.
        </p>
      </Secao>

      <Secao titulo="O que você põe aqui">
        <p>
          Ao enviar um ponto para a comunidade, você declara que pode
          compartilhá-lo e autoriza que ele entre no acervo de todos, com o seu
          apelido creditado. Ao publicar uma playlist, ela fica visível para quem
          abrir a vitrine.
        </p>
        <p>
          Conteúdo ofensivo, imagem imprópria ou o que não for ponto de Umbanda
          pode ser denunciado por qualquer pessoa com conta, e uma pessoa de
          verdade analisa cada denúncia. Nada é removido automaticamente.
        </p>
      </Secao>

      <Secao titulo="Suspensão">
        <p>
          Podemos limitar ou encerrar o acesso de quem usar o serviço para
          perseguir alguém, tomar o perfil de outra pessoa ou tentar quebrar o
          aplicativo. Fora isso, a sua conta é sua.
        </p>
      </Secao>

      <Secao titulo="Mudanças nestes termos">
        <p>
          Se algo mudar aqui, avisamos no aplicativo antes de valer. Mudança que
          altere preço ou o que está incluso nunca vale para um período já pago.
        </p>
      </Secao>

      <p className="mt-10 text-sm text-muted-foreground">
        Veja também a{" "}
        <Link href="/privacidade" className="text-primary underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
