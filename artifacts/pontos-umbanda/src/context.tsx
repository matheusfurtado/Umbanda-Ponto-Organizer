import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { curtirPonto, descurtirPonto } from "@/api/curtida";
import type { AppData, EstadoAcervo, FonteAcervo, Orixa, Subcategoria, Ponto } from "./types";
import { carregarDados, gerarId } from "./storage";
import { useAuth } from "./auth/AuthContext";
import {
  carregar,
  EstadoEnvio,
  ligarRetomadaAutomatica,
  observarEnvio,
  persistir,
  sincronizarAgora,
} from "./dados/repositorio";

interface AppContextType {
  dados: AppData;

  /** Em que pé está a carga inicial. */
  estado: EstadoAcervo;
  /** De onde veio o acervo em memória: servidor, cache do aparelho, ou nunca sincronizou. */
  fonte: FonteAcervo;
  /** Por que caiu para o cache, quando caiu. */
  motivoFalha?: string;
  /** Se há mudança local ainda não enviada, e se um envio está em curso. */
  envio: EstadoEnvio;
  /** Tenta enviar o pendente agora, sem esperar o debounce. */
  sincronizarAgora: () => void;
  /** Recarrega do servidor. Descarta nada local — o cache já foi persistido. */
  recarregar: () => void;

  orixaSelecionado: Orixa | null;
  subcategoriaSelecionada: Subcategoria | null;
  selecionarOrixa: (orixa: Orixa | null) => void;
  selecionarSubcategoria: (sub: Subcategoria | null) => void;
  substituirDados: (dados: AppData) => void;

  adicionarOrixa: (nome: string, cor: string, emoji: string) => void;
  editarOrixa: (id: string, nome: string, cor: string, emoji: string) => void;
  excluirOrixa: (id: string) => void;

  adicionarSubcategoria: (orixaId: string, nome: string) => void;
  editarSubcategoria: (id: string, nome: string) => void;
  excluirSubcategoria: (id: string) => void;

  adicionarPonto: (subcategoriaId: string, titulo: string, letra: string, autor?: string) => void;
  editarPonto: (id: string, titulo: string, letra: string, autor?: string | null) => void;
  excluirPonto: (id: string) => void;
  toggleFavorito: (id: string) => void;
  reordenarPontos: (subcategoriaId: string, ids: string[]) => void;
  reordenarMultiplosPontos: (mapa: Record<string, string[]>) => void;
  reordenarSubcategorias: (orixaId: string, ids: string[]) => void;
  reordenarOrixas: (ids: string[]) => void;
  moverPontoCima: (ponto: Ponto) => void;
  moverPontoBaixo: (ponto: Ponto) => void;
  moverPontoParaSubcategoria: (pontoId: string, novaSubcategoriaId: string, posicao?: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { autenticado, isPending } = useAuth();
  // Começa do cache, SÍNCRONO. É o que faz o app abrir instantâneo e funcionar
  // sem rede: nenhum componente chega a ver estado vazio. O servidor atualiza
  // por cima logo em seguida.
  const [dados, setDados] = useState<AppData>(() => carregarDados());
  const [estado, setEstado] = useState<EstadoAcervo>("carregando");
  const [fonte, setFonte] = useState<FonteAcervo>("local");
  const [motivoFalha, setMotivoFalha] = useState<string | undefined>();
  const [envio, setEnvio] = useState<EstadoEnvio>({
    enviando: false,
    pendente: false,
    conflito: false,
    bloqueado: false,
  });
  const [orixaSelecionado, setOrixaSelecionado] = useState<Orixa | null>(null);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<Subcategoria | null>(null);

  const buscarDoServidor = useCallback(async () => {
    setEstado("carregando");
    const r = await carregar();
    // Uma carga mais nova já começou — esta responde tarde e não fala pela
    // tela. Ver `carregar`: o caso comum é a carga ANÔNIMA voltando depois de
    // a pessoa ter entrado, e ela traz o acervo achatado do portão.
    if (r.obsoleta) return;
    setDados(r.dados);
    setFonte(r.fonte);
    setMotivoFalha(r.motivo);
    // Cair para o cache NÃO é erro de tela: o acervo está inteiro na mão do
    // usuário e a gira continua. É aviso, não bloqueio. "erro" fica reservado
    // para quando não há nem cache — só na primeiríssima abertura sem rede.
    setEstado(r.fonte === "local" && r.motivo ? "erro" : "pronto");
  }, []);

  // Rebusca quando o login muda. O acervo que o servidor manda DEPENDE de quem
  // está perguntando: anônimo recebe a lista corrida, assinante recebe a
  // hierarquia e os vídeos. Buscar só na montagem deixava quem acabou de entrar
  // vendo a versão de anônimo — "0 orixás" logo depois de logar.
  useEffect(() => {
    if (isPending) return; // ainda não se sabe se há sessão
    void buscarDoServidor();
  }, [buscarDoServidor, isPending, autenticado]);

  useEffect(() => ligarRetomadaAutomatica(), []);

  useEffect(() => observarEnvio(setEnvio), []);

  useEffect(() => {
    if (dados.ultimoOrixaId) {
      const orixa = dados.orixas.find((o) => o.id === dados.ultimoOrixaId);
      if (orixa) setOrixaSelecionado(orixa);
    }
    // Roda uma vez: restaurar a seleção a cada sincronização faria a tela
    // pular sob o dedo de quem está lendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grava no cache na hora (UI instantânea, funciona offline) e empurra para o
  // servidor depois. A assinatura não mudou, então os 23 métodos abaixo e as
  // telas que os usam seguem exatamente como estavam.
  const atualizar = useCallback((novosDados: AppData) => {
    persistir(novosDados);
    setDados(novosDados);
  }, []);

  /**
   * Seleciona sem SINCRONIZAR.
   *
   * Ele gravava `ultimoOrixaId` pelo mesmo `atualizar` que persiste o acervo —
   * e `persistir` manda o `AppData` inteiro ao servidor. O efeito era o que o
   * ADR 0009 mede como o defeito de fundo do acervo pessoal: **bastava abrir um
   * orixá para copiar 519 pontos**, sem a pessoa ter pedido nada.
   *
   * Qual orixá estava aberto é estado de TELA. Desde que o orixá ganhou URL
   * (`/orixa/:id`), o endereço já guarda isso — e endereço não sincroniza
   * acervo nenhum.
   */
  const selecionarOrixa = useCallback((orixa: Orixa | null) => {
    setOrixaSelecionado(orixa);
    setSubcategoriaSelecionada(null);
  }, []);

  const selecionarSubcategoria = useCallback((sub: Subcategoria | null) => {
    setSubcategoriaSelecionada(sub);
  }, []);

  // Substitui TODO o estado local (usado ao baixar os dados da conta neste aparelho).
  const substituirDados = useCallback(
    (novos: AppData) => {
      atualizar(novos);
      setOrixaSelecionado(null);
      setSubcategoriaSelecionada(null);
    },
    [atualizar],
  );

  const adicionarOrixa = useCallback(
    (nome: string, cor: string, emoji: string) => {
      const nova: Orixa = {
        id: gerarId(),
        nome,
        cor,
        emoji,
        ordem: dados.orixas.length,
        criadoEm: Date.now(),
      };
      atualizar({ ...dados, orixas: [...dados.orixas, nova] });
    },
    [dados, atualizar]
  );

  const editarOrixa = useCallback(
    (id: string, nome: string, cor: string, emoji: string) => {
      const orixas = dados.orixas.map((o) =>
        o.id === id ? { ...o, nome, cor, emoji } : o
      );
      atualizar({ ...dados, orixas });
      if (orixaSelecionado?.id === id) {
        setOrixaSelecionado((prev) => prev ? { ...prev, nome, cor, emoji } : null);
      }
    },
    [dados, atualizar, orixaSelecionado]
  );

  const excluirOrixa = useCallback(
    (id: string) => {
      const subsDoOrixa = dados.subcategorias.filter((s) => s.orixaId === id).map((s) => s.id);
      atualizar({
        ...dados,
        orixas: dados.orixas.filter((o) => o.id !== id),
        subcategorias: dados.subcategorias.filter((s) => s.orixaId !== id),
        pontos: dados.pontos.filter((p) => !subsDoOrixa.includes(p.subcategoriaId)),
      });
      if (orixaSelecionado?.id === id) setOrixaSelecionado(null);
    },
    [dados, atualizar, orixaSelecionado]
  );

  const adicionarSubcategoria = useCallback(
    (orixaId: string, nome: string) => {
      const sub: Subcategoria = {
        id: gerarId(),
        orixaId,
        nome,
        ordem: dados.subcategorias.filter((s) => s.orixaId === orixaId).length,
        criadoEm: Date.now(),
      };
      atualizar({ ...dados, subcategorias: [...dados.subcategorias, sub] });
    },
    [dados, atualizar]
  );

  const editarSubcategoria = useCallback(
    (id: string, nome: string) => {
      const subcategorias = dados.subcategorias.map((s) =>
        s.id === id ? { ...s, nome } : s
      );
      atualizar({ ...dados, subcategorias });
      if (subcategoriaSelecionada?.id === id) {
        setSubcategoriaSelecionada((prev) => prev ? { ...prev, nome } : null);
      }
    },
    [dados, atualizar, subcategoriaSelecionada]
  );

  const excluirSubcategoria = useCallback(
    (id: string) => {
      atualizar({
        ...dados,
        subcategorias: dados.subcategorias.filter((s) => s.id !== id),
        pontos: dados.pontos.filter((p) => p.subcategoriaId !== id),
      });
      if (subcategoriaSelecionada?.id === id) setSubcategoriaSelecionada(null);
    },
    [dados, atualizar, subcategoriaSelecionada]
  );

  /**
   * `autor` estava fora daqui, e por isso o crédito se perdia ao CRIAR.
   *
   * O `ModalPonto` sempre teve o campo "Autor (se você souber)" e sempre
   * chamou `onSalvar(titulo, letra, autor)`. Editar preservava (`editarPonto`,
   * logo abaixo); criar descartava — o handler de `TelaSubcategorias` recebia
   * só dois parâmetros e esta assinatura nem tinha o terceiro. O TypeScript
   * não pega: callback com menos parâmetros é legal.
   *
   * Cópia divergente clássica, e o que divergia era autoria de obra
   * religiosa: a pessoa digitava o nome de quem fez o ponto, o ponto nascia
   * sem ele, e nada avisava. O `|| null` é o mesmo do `editarPonto` — duas
   * representações de "não sei" divergem no primeiro `===`.
   */
  const adicionarPonto = useCallback(
    (subcategoriaId: string, titulo: string, letra: string, autor?: string) => {
      const ponto: Ponto = {
        id: gerarId(),
        subcategoriaId,
        titulo,
        letra,
        autor: autor?.trim() || null,
        favorito: false,
        ordem: dados.pontos.filter((p) => p.subcategoriaId === subcategoriaId).length,
        criadoEm: Date.now(),
      };
      atualizar({ ...dados, pontos: [...dados.pontos, ponto] });
    },
    [dados, atualizar]
  );

  const editarPonto = useCallback(
    (id: string, titulo: string, letra: string, autor?: string | null) => {
      const pontos = dados.pontos.map((p) =>
        // `autor` vazio vira `null` e não `""`: no banco a coluna é nula, e
        // duas representações de "não sei" divergem no primeiro `===`.
        p.id === id ? { ...p, titulo, letra, autor: autor?.trim() || null } : p
      );
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  const excluirPonto = useCallback(
    (id: string) => {
      atualizar({ ...dados, pontos: dados.pontos.filter((p) => p.id !== id) });
    },
    [dados, atualizar]
  );

  const toggleFavorito = useCallback(
    (id: string) => {
      // Aceita o id da linha OU o do ponto canônico de onde ela veio.
      //
      // "Novos do mês" e as giras públicas falam em ids CANÔNICOS, porque vêm
      // de rotas que não sabem de quem está pedindo. Quem organizou o acervo
      // tem uma cópia com ids próprios — e a estrela clicada de lá não achava
      // nada para marcar. Resolver aqui conserta todas as telas de uma vez, em
      // vez de cada uma lembrar de traduzir o id.
      const alvo = dados.pontos.find((p) => p.id === id || p.origemId === id);
      if (!alvo) return;
      const marcado = !alvo.favorito;
      const pontos = dados.pontos.map((p) =>
        p.id === alvo.id ? { ...p, favorito: marcado } : p
      );
      atualizar({ ...dados, pontos });

      // E AVISA O SERVIDOR NA HORA, por rota própria.
      //
      // Antes a curtida só chegava lá pelo `PUT /acervo` — o retrato inteiro —,
      // e isso tinha dois preços: quem não paga recebe 402 no PUT e nunca
      // conseguia curtir, e quem paga só curtia depois de o app copiar o acervo
      // inteiro por ela (ADR 0009).
      //
      // O erro é engolido de propósito: a marca já está na tela e no
      // `localStorage`, o `PUT /acervo` ainda reconcilia quando houver, e
      // transformar uma estrela em mensagem de erro no meio da gira é pior que
      // a curtida chegar um minuto depois.
      void (marcado ? curtirPonto(alvo.id) : descurtirPonto(alvo.id)).catch(
        () => undefined,
      );
    },
    [dados, atualizar]
  );

  const reordenarPontos = useCallback(
    (subcategoriaId: string, ids: string[]) => {
      const pontos = dados.pontos.map((p) => {
        const idx = ids.indexOf(p.id);
        return p.subcategoriaId === subcategoriaId && idx !== -1
          ? { ...p, ordem: idx }
          : p;
      });
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  const reordenarMultiplosPontos = useCallback(
    (mapa: Record<string, string[]>) => {
      const pontos = dados.pontos.map((p) => {
        const ids = mapa[p.subcategoriaId];
        if (!ids) return p;
        const idx = ids.indexOf(p.id);
        return idx !== -1 ? { ...p, ordem: idx } : p;
      });
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  const reordenarSubcategorias = useCallback(
    (orixaId: string, ids: string[]) => {
      const subcategorias = dados.subcategorias.map((s) => {
        const idx = ids.indexOf(s.id);
        return s.orixaId === orixaId && idx !== -1
          ? { ...s, ordem: idx }
          : s;
      });
      atualizar({ ...dados, subcategorias });
    },
    [dados, atualizar]
  );

  const reordenarOrixas = useCallback(
    (ids: string[]) => {
      const orixas = dados.orixas.map((o) => {
        const idx = ids.indexOf(o.id);
        return idx !== -1 ? { ...o, ordem: idx } : o;
      });
      atualizar({ ...dados, orixas });
    },
    [dados, atualizar]
  );

  const moverPontoCima = useCallback(
    (ponto: Ponto) => {
      const pontosDaSub = dados.pontos
        .filter((p) => p.subcategoriaId === ponto.subcategoriaId)
        .sort((a, b) => a.ordem - b.ordem);
      const idx = pontosDaSub.findIndex((p) => p.id === ponto.id);
      if (idx <= 0) return;
      const anterior = pontosDaSub[idx - 1];
      const pontos = dados.pontos.map((p) => {
        if (p.id === ponto.id) return { ...p, ordem: anterior.ordem };
        if (p.id === anterior.id) return { ...p, ordem: ponto.ordem };
        return p;
      });
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  const moverPontoBaixo = useCallback(
    (ponto: Ponto) => {
      const pontosDaSub = dados.pontos
        .filter((p) => p.subcategoriaId === ponto.subcategoriaId)
        .sort((a, b) => a.ordem - b.ordem);
      const idx = pontosDaSub.findIndex((p) => p.id === ponto.id);
      if (idx < 0 || idx >= pontosDaSub.length - 1) return;
      const proximo = pontosDaSub[idx + 1];
      const pontos = dados.pontos.map((p) => {
        if (p.id === ponto.id) return { ...p, ordem: proximo.ordem };
        if (p.id === proximo.id) return { ...p, ordem: ponto.ordem };
        return p;
      });
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  const moverPontoParaSubcategoria = useCallback(
    (pontoId: string, novaSubcategoriaId: string, posicao?: number) => {
      const novaOrdem = posicao ?? dados.pontos.filter((p) => p.subcategoriaId === novaSubcategoriaId).length;
      const pontos = dados.pontos.map((p) =>
        p.id === pontoId ? { ...p, subcategoriaId: novaSubcategoriaId, ordem: novaOrdem } : p
      );
      atualizar({ ...dados, pontos });
    },
    [dados, atualizar]
  );

  return (
    <AppContext.Provider
      value={{
        dados,
        estado,
        fonte,
        motivoFalha,
        envio,
        sincronizarAgora,
        recarregar: () => void buscarDoServidor(),
        orixaSelecionado,
        subcategoriaSelecionada,
        selecionarOrixa,
        selecionarSubcategoria,
        substituirDados,
        adicionarOrixa,
        editarOrixa,
        excluirOrixa,
        adicionarSubcategoria,
        editarSubcategoria,
        excluirSubcategoria,
        adicionarPonto,
        editarPonto,
        excluirPonto,
        toggleFavorito,
        reordenarPontos,
        reordenarMultiplosPontos,
        reordenarSubcategorias,
        reordenarOrixas,
        moverPontoCima,
        moverPontoBaixo,
        moverPontoParaSubcategoria,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
