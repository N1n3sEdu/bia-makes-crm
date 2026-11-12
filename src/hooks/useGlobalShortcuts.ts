"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBiaMakes } from "@/context/BiaMakesContext";

const ALT_MODULE_MAP: Record<
  string,
  { tab: string; label: string; route: string }
> = {
  "1": { tab: "dashboard", label: "Dashboard & Indicadores", route: "/admin" },
  "2": { tab: "products", label: "Produtos, Frete & Redes", route: "/admin" },
  "3": { tab: "stock", label: "Estoque Central (Kardex)", route: "/admin" },
  "4": { tab: "orders", label: "Pedidos & Vendas", route: "/admin" },
  "5": { tab: "traffic", label: "Tráfego & Origens", route: "/admin" },
  "6": { tab: "financial", label: "Financeiro (DRE)", route: "/admin" },
  "7": { tab: "import", label: "Importar Planilhas", route: "/admin" },
  "8": { tab: "users", label: "Usuários & Perfis", route: "/admin" },
  "9": { tab: "storefront", label: "Loja Virtual B2C", route: "/" },
};

export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isSpotlightOpen,
    setIsSpotlightOpen,
    setCrmActiveTab,
  } = useBiaMakes();

  useEffect(() => {
    // Garante que o motor de atalhos globais funcione exclusivamente dentro do ambiente /admin
    if (!pathname.startsWith("/admin")) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toUpperCase() || "";
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      // 1. Ctrl+K / Cmd+K: Abre ou fecha o PowerToys Spotlight de qualquer lugar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
        return;
      }

      // Se o Spotlight estiver aberto, os atalhos internos (Alt+1..9/A..Z, Setas, Enter, ESC) são tratados pelo próprio CommandDialog
      if (isSpotlightOpen) {
        return;
      }

      // 2. Alt+S: Submete/salva imediatamente o modal ou formulário aberto na tela (mesmo com foco em input)
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("shortcut-save-form"));
        return;
      }

      // Para os demais atalhos globais fora do Spotlight, ignora quando o foco está em inputs de digitação
      if (isEditable) {
        return;
      }

      // 3. Alt+N: Dispara a ação contextual "Novo Registro" da página/módulo atual
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("shortcut-new-item"));
        return;
      }

      // 4. Alt+1 a Alt+9: Navegação direta instantânea para os módulos principais
      if (e.altKey && !e.ctrlKey && !e.metaKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const mod = ALT_MODULE_MAP[e.key];
        if (!mod) return;

        if (mod.route === "/") {
          router.push("/");
        } else {
          setCrmActiveTab(mod.tab);
          if (pathname !== "/admin") {
            router.push("/admin");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpotlightOpen, pathname, router, setCrmActiveTab, setIsSpotlightOpen]);
}
