/**
 * A Política de Privacidade.
 *
 * ## O texto descreve o código, e não o contrário
 *
 * Cada afirmação aqui foi escrita lendo o que a aplicação faz de verdade: as
 * colunas de `models/conta.py`, o que `clique_no_ponto` guarda (e o que ele
 * recusa guardar), quem são os terceiros em `pagamentos/` e `email/`. Política
 * que promete mais do que o código cumpre é mentira com carimbo.
 *
 * ## O que este app é, pela LGPD
 *
 * Ter uma conta aqui revela convicção religiosa — **dado sensível pelo art. 5º,
 * II**, e o tratamento depende de consentimento específico e destacado (art.
 * 11, I). É por isso que o cadastro tem uma caixa separada só para isso, e não
 * um "aceito os termos" genérico.
 */

import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
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

export function TelaPrivacidade() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Política de
        Privacidade
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Última revisão: {ATUALIZADO_EM}.
      </p>

      <AvisoLegalPendente />

      <Secao titulo="O que este aplicativo é, e por que isso importa aqui">
        <p>
          Este é um acervo de pontos de Umbanda. <strong>Ter uma conta aqui diz
          que você usa um aplicativo de Umbanda</strong>, e isso é informação
          sobre a sua religião — o que a Lei Geral de Proteção de Dados chama de
          dado pessoal sensível (art. 5º, II).
        </p>
        <p>
          Por isso o tratamento desses dados depende do seu consentimento
          específico e destacado (art. 11, I), que é pedido no cadastro numa
          caixa separada, e não escondido num “aceito os termos”.
        </p>
      </Secao>

      <Secao titulo="Quem trata os seus dados">
        <p>
          Controlador: <strong>{CONTROLADOR.nome}</strong> ({CONTROLADOR.documento}).
          Para exercer qualquer direito desta política, escreva para{" "}
          <strong>{CONTROLADOR.contato}</strong>.
        </p>
      </Secao>

      <Secao titulo="O que guardamos, e para quê">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>E-mail e senha.</strong> Para você entrar. A senha nunca é
            guardada: fica só o resultado de uma função de hash, do qual não se
            volta para a senha.
          </li>
          <li>
            <strong>Apelido.</strong> É o nome que aparece quando você contribui
            com um ponto ou publica uma gira. <strong>O e-mail nunca aparece
            para ninguém</strong> — a lista de novidades abre sem login, e juntar
            e-mail com religião numa página pública seria expor você.
          </li>
          <li>
            <strong>Foto de perfil</strong>, se você puser uma. Ela é
            reprocessada no envio e todos os metadados do arquivo original —
            inclusive a localização que a câmera grava — são descartados antes de
            guardar.
          </li>
          <li>
            <strong>A data em que você consentiu</strong>, para podermos provar
            quando e a quê.
          </li>
          <li>
            <strong>Suas sessões abertas</strong> — o navegador, e quando foi a
            última atividade — para você poder ver e encerrar sessões de outros
            aparelhos.
          </li>
          <li>
            <strong>O seu acervo</strong>: os pontos que você organizou, seus
            favoritos e suas giras. É o que o aplicativo existe para guardar.
          </li>
          <li>
            <strong>O que você mandou para a comunidade</strong>: pontos
            enviados, sugestões de autoria e denúncias, com a data.
          </li>
          <li>
            <strong>Sua assinatura</strong>, quando houver: o plano, as datas e o
            identificador da cobrança no provedor de pagamento.
          </li>
        </ul>
      </Secao>

      <Secao titulo="O que NÃO guardamos, e isso foi escolha">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Não guardamos quem clicou em qual ponto.</strong> Contamos
            quantas vezes cada ponto levou alguém ao YouTube, por dia, sem
            identificador de pessoa e sem hora. Um registro de qual entidade cada
            pessoa canta seria o mapa da prática religiosa dela.
          </li>
          <li>
            <strong>Não há rastreador de terceiro.</strong> Nenhum Google
            Analytics, nenhum pixel, nenhuma fonte carregada de fora — até a
            tipografia é servida por este aplicativo, para que nenhum outro
            servidor saiba que você abriu um app de Umbanda.
          </li>
          <li>
            <strong>Sua lista de quem você segue é só sua.</strong> Ela não
            aparece no seu perfil nem no de ninguém, e o servidor devolve
            contagem — nunca nomes — para terceiros.
          </li>
          <li>
            <strong>Seus favoritos nascem privados.</strong> Só ficam visíveis se
            você ligar isso nas configurações.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Com quem compartilhamos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Provedor de pagamento</strong>, se você assinar: ele recebe o
            necessário para cobrar. Os dados do seu cartão são digitados no site
            dele e <strong>nunca passam por aqui</strong>.
          </li>
          <li>
            <strong>Provedor de e-mail</strong>, para as mensagens de confirmação
            e de recuperação de senha. O remetente e o assunto não dizem que o
            aplicativo é de Umbanda — quem vê a caixa de entrada de outra pessoa
            não descobre a religião dela por causa da gente.
          </li>
        </ul>
        <p>
          Fora isso, <strong>não vendemos, alugamos nem cedemos os seus dados a
          ninguém</strong>.
        </p>
      </Secao>

      <Secao titulo="Sobre os vídeos do YouTube">
        <p>
          Os pontos do acervo trazem o link do vídeo no YouTube. Nós não
          hospedamos vídeo nenhum e não incorporamos o player: ao clicar em
          “Ouvir”, você sai daqui e vai para o YouTube, onde valem os termos e a
          política de privacidade deles. Enquanto você não clicar, o YouTube não
          sabe da sua existência por nossa causa.
        </p>
      </Secao>

      <Secao titulo="Os seus direitos, e onde exercê-los">
        <p>
          A LGPD (art. 18) lhe dá o direito de saber o que temos, corrigir,
          levar embora e apagar. Dois deles estão prontos, dentro do aplicativo,
          sem precisar pedir a ninguém:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Baixar tudo o que temos sobre você</strong>, em{" "}
            <Link href="/conta" className="text-primary underline">
              Minha conta
            </Link>
            .
          </li>
          <li>
            <strong>Apagar a conta</strong>, na mesma página. Some tudo: o seu
            acervo, suas giras, seus favoritos e suas sessões.
          </li>
        </ul>
        <p>
          Para os demais — correção, informação sobre compartilhamento, oposição
          — escreva para <strong>{CONTROLADOR.contato}</strong>.
        </p>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <p>
          Enquanto a sua conta existir. Depois de apagada, os registros que a lei
          nos obriga a manter (como os de cobrança) ficam por{" "}
          <strong>{CONTROLADOR.retencao}</strong> e são eliminados em seguida.
        </p>
        <p>
          As sessões vencidas são apagadas automaticamente, e os contadores de
          uso não têm como ser ligados a você, então não há o que apagar neles.
        </p>
      </Secao>

      <Secao titulo="Revogar o consentimento">
        <p>
          Você pode retirar o consentimento a qualquer momento apagando a conta.
          Como o próprio fato de existir uma conta aqui é o dado sensível, não há
          como manter a conta e retirar o consentimento ao mesmo tempo.
        </p>
      </Secao>

      <p className="mt-10 text-sm text-muted-foreground">
        Veja também os{" "}
        <Link href="/termos" className="text-primary underline">
          Termos de Uso
        </Link>
        .
      </p>
    </div>
  );
}
