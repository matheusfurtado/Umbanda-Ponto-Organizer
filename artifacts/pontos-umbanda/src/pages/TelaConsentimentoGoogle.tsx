/**
 * O consentimento de quem voltou do Google e ainda não tem conta (ADR 0010).
 *
 * ## Por que esta tela existe
 *
 * "Entrar com Google" costuma criar a conta num clique. Aqui a existência de
 * uma conta **revela convicção religiosa** — dado sensível pela LGPD (art. 5º,
 * II), e é por isso que o cadastro por e-mail já pede consentimento específico
 * e destacado.
 *
 * Criar a conta no retorno do provedor e perguntar depois seria colher o dado
 * antes de pedir permissão. O servidor não cria nada no retorno: guarda um
 * cadastro pendente de vida curta e manda a pessoa para cá com um token na URL.
 *
 * ## O texto é o MESMO do cadastro por e-mail
 *
 * De propósito. Duas portas para a mesma conta não podem descrever
 * diferentemente o que se está autorizando — a diferença faria uma delas
 * parecer o caminho fácil, e o consentimento não é um obstáculo a contornar.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";

import { useAuth } from "@/auth/AuthContext";

import { Button } from "@/components/ui/button";
import { consentirEntradaGoogle } from "@/api/conta";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";

export function TelaConsentimentoGoogle() {
  const busca = useSearch();
  const [, navegar] = useLocation();
  const { recarregar } = useAuth();
  const token = new URLSearchParams(busca).get("t") ?? "";

  const [consentiu, setConsentiu] = useState(false);
  const [querComunicacao, setQuerComunicacao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Sem token não há o que completar. Dizer isso é melhor que desenhar um
  // formulário que vai falhar no envio.
  if (!token) {
    return (
      <div className="mx-auto max-w-md p-4">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Este cadastro expirou
        </h1>
        <p className="text-sm text-muted-foreground">
          Comece de novo pela tela de entrar.
        </p>
      </div>
    );
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      await consentirEntradaGoogle({
        token,
        consinto_dado_religioso: consentiu,
        consinto_comunicacao: querComunicacao,
      });
      // RECARREGAR antes de navegar, e não é detalhe.
      //
      // O servidor já gravou o cookie de sessão — a conta existe e está
      // aberta. Mas o contexto de autenticação deste app não sabe: ele guarda
      // o usuário em estado, e só descobre quem entrou perguntando ao
      // `/auth/eu`.
      //
      // Sem isto, a pessoa termina o cadastro e cai numa tela que a trata como
      // visitante — com o convite para entrar aparecendo, depois de ela ter
      // acabado de entrar. Foi o que ele viu: *"assim que eu crio a conta já
      // devo estar logado, pq já selecionei a conta"*. Ele estava logado; o
      // app é que não tinha percebido.
      await recarregar();
      navegar("/");
    } catch (problema) {
      // A mensagem do SERVIDOR quando ele deu uma: ele sabe o que houve
      // ("este cadastro expirou"), e trocar isso por texto genérico faz a
      // pessoa recomeçar sem saber por quê.
      setErro(
        ehErroDeApi(problema)
          ? problema.detalhe
          : ehErroDeRede(problema)
            ? "Sem conexão. Tente de novo."
            : "Não consegui criar sua conta.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Falta uma coisa</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        O Google confirmou quem você é. Antes de criar sua conta, precisamos da
        sua autorização — e ela é obrigatória por lei, não é formalidade nossa.
      </p>

      <form onSubmit={enviar} className="space-y-3">
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <label className="flex cursor-pointer gap-2.5 text-xs leading-snug">
            <input
              type="checkbox"
              checked={consentiu}
              onChange={(e) => setConsentiu(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-foreground">
              Entendo que ter uma conta aqui registra que eu uso um app de Umbanda, e
              que isso é um dado sensível sobre minha religião. Autorizo guardar isso
              para <strong className="font-medium">sincronizar meus pontos</strong> e,
              quando eu escolher publicar alguma coisa — mandar um ponto, publicar
              uma playlist, abrir meu perfil —, para{" "}
              <strong className="font-medium">mostrar meu apelido junto</strong>.{" "}
              <strong className="font-medium">Obrigatório para criar conta.</strong>
            </span>
          </label>

          <label className="flex cursor-pointer gap-2.5 text-xs leading-snug">
            <input
              type="checkbox"
              checked={querComunicacao}
              onChange={(e) => setQuerComunicacao(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-muted-foreground">
              Quero receber avisos por e-mail sobre o acervo.{" "}
              <strong className="font-medium">Opcional.</strong>
            </span>
          </label>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button
          type="submit"
          disabled={!consentiu || carregando}
          className="min-h-11 w-full"
        >
          {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar minha conta
        </Button>
      </form>
    </div>
  );
}
