import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AppData, Orixa, Subcategoria, Ponto } from "./types";
import { carregarDados, salvarDados, gerarId } from "./storage";

interface AppContextType {
  dados: AppData;
  orixaSelecionado: Orixa | null;
  subcategoriaSelecionada: Subcategoria | null;
  selecionarOrixa: (orixa: Orixa | null) => void;
  selecionarSubcategoria: (sub: Subcategoria | null) => void;

  adicionarOrixa: (nome: string, cor: string, emoji: string) => void;
  editarOrixa: (id: string, nome: string, cor: string, emoji: string) => void;
  excluirOrixa: (id: string) => void;

  adicionarSubcategoria: (orixaId: string, nome: string) => void;
  editarSubcategoria: (id: string, nome: string) => void;
  excluirSubcategoria: (id: string) => void;

  adicionarPonto: (subcategoriaId: string, titulo: string, letra: string) => void;
  editarPonto: (id: string, titulo: string, letra: string) => void;
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
  const [dados, setDados] = useState<AppData>(() => carregarDados());
  const [orixaSelecionado, setOrixaSelecionado] = useState<Orixa | null>(null);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<Subcategoria | null>(null);

  useEffect(() => {
    if (dados.ultimoOrixaId) {
      const orixa = dados.orixas.find((o) => o.id === dados.ultimoOrixaId);
      if (orixa) setOrixaSelecionado(orixa);
    }
  }, []);

  const atualizar = useCallback((novosDados: AppData) => {
    salvarDados(novosDados);
    setDados(novosDados);
  }, []);

  const selecionarOrixa = useCallback(
    (orixa: Orixa | null) => {
      setOrixaSelecionado(orixa);
      setSubcategoriaSelecionada(null);
      if (orixa) {
        atualizar({ ...dados, ultimoOrixaId: orixa.id });
      }
    },
    [dados, atualizar]
  );

  const selecionarSubcategoria = useCallback((sub: Subcategoria | null) => {
    setSubcategoriaSelecionada(sub);
  }, []);

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

  const adicionarPonto = useCallback(
    (subcategoriaId: string, titulo: string, letra: string) => {
      const ponto: Ponto = {
        id: gerarId(),
        subcategoriaId,
        titulo,
        letra,
        favorito: false,
        ordem: dados.pontos.filter((p) => p.subcategoriaId === subcategoriaId).length,
        criadoEm: Date.now(),
      };
      atualizar({ ...dados, pontos: [...dados.pontos, ponto] });
    },
    [dados, atualizar]
  );

  const editarPonto = useCallback(
    (id: string, titulo: string, letra: string) => {
      const pontos = dados.pontos.map((p) =>
        p.id === id ? { ...p, titulo, letra } : p
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
      const pontos = dados.pontos.map((p) =>
        p.id === id ? { ...p, favorito: !p.favorito } : p
      );
      atualizar({ ...dados, pontos });
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
        orixaSelecionado,
        subcategoriaSelecionada,
        selecionarOrixa,
        selecionarSubcategoria,
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
