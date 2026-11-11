"use client";

import React, { useState, useEffect } from "react";
import { useBiaMakes } from "@/context/BiaMakesContext";
import { Bell, Info, X, Clock, FileText, CheckCircle, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SystemChangeLogItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  filesModified: string[];
  reversalGuide: string;
}

// Histórico de alterações estruturado para exibição do usuário eduardo.nunes
export const SYSTEM_CHANGE_LOGS: SystemChangeLogItem[] = [
  {
    id: "change-2026-11-11-2",
    timestamp: "2026-11-11T16:35:00-03:00",
    title: "Posicionamento do Alerta de Alteração na Barra Superior ao lado da Lupa",
    description: `1. Integração do alerta flutuante com a barra de navegação superior (ao lado da Lupa/Spotlight).
2. Ao clicar em 'Ciente / Fechar', o card flutuante do canto inferior some automaticamente e um botão dedicado de histórico de alterações com badge animado permanece ativo no topo ao lado da Lupa, permitindo ao usuário eduardo.nunes reabrir os detalhes a qualquer momento.`,
    filesModified: [
      "src/components/Navigation.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o botão ao lado da lupa e manter apenas o toast flutuante no canto:
1. Remover o botão de histórico ao lado da lupa em src/components/Navigation.tsx.
2. Limpar a chave de localStorage 'biamakes_ack_changes'.`
  },
  {
    id: "change-2026-11-11-1",
    timestamp: "2026-11-11T16:30:00-03:00",
    title: "Refatoração do ERP Financeiro, DRE e Rastreabilidade de Canais",
    description: `1. Refatoração do cálculo de 'financial' no BiaMakesContext para somar os pedidos ativos (PAGO, SEPARACAO, ENVIADO, CONCLUIDO), calculando CMV por SKU real dos produtos e deduzindo as comissões por canal usando a taxa real cadastrada (feePercentage) de cada canal em vez da taxa fixa de 14%.
2. Permissão de resultado líquido real no DRE sem clamping artificial em zero (exibindo lucro real ou prejuízo operacional real).
3. Conexão da simulação de sincronização no MarketplacesManager ao registro de rastreabilidade e histórico dos canais.
4. Criação do sistema de notificação exclusivo para o usuário eduardo.nunes com painel de visualização das alterações e histórico de reversão.`,
    filesModified: [
      "src/context/BiaMakesContext.tsx",
      "src/components/crm/FinancialManager.tsx",
      "src/components/crm/OrdersManager.tsx",
      "src/components/crm/MarketplacesManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter estas alterações para o estado anterior:
1. No BiaMakesContext.tsx, restaurar o useMemo de 'financial' que subtraía valores do objeto initialFinancial estático com clamp Math.max(0, ...).
2. Restaurar a taxa de comissão hardcoded em 0.14 (14%) em vez de consultar channel.feePercentage.
3. No MarketplacesManager.tsx, desacoplar os logs de sincronização do histórico do canal.
Consulte HISTORICO_ALTERACOES.txt para instruções detalhadas.`
  }
];

const ACKNOWLEDGED_STORAGE_KEY = "biamakes_ack_changes_v1";

export function ChangeNotificationModal() {
  const { adminUser, isAdminAuthenticated } = useBiaMakes();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<SystemChangeLogItem | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(true);

  // Apenas renderiza e notifica para o usuário eduardo.nunes
  const isTargetUser = isAdminAuthenticated && adminUser?.username === "eduardo.nunes";
  const latestChange = SYSTEM_CHANGE_LOGS[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ackId = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
      // Se já deu ciente para a alteração mais recente, não exibe o toast flutuante
      if (ackId === latestChange.id) {
        setIsAcknowledged(true);
      } else {
        setIsAcknowledged(false);
      }
    }
  }, [latestChange.id]);

  useEffect(() => {
    if (isTargetUser && SYSTEM_CHANGE_LOGS.length > 0) {
      setSelectedChange(SYSTEM_CHANGE_LOGS[0]);
    }

    // Listener para quando o usuário clicar no ícone ao lado da lupa na Navigation
    const handleOpenModal = (e: Event) => {
      const customEv = e as CustomEvent<string | undefined>;
      const targetId = customEv.detail;
      const found = targetId ? SYSTEM_CHANGE_LOGS.find(c => c.id === targetId) : SYSTEM_CHANGE_LOGS[0];
      setSelectedChange(found || SYSTEM_CHANGE_LOGS[0]);
      setIsOpen(true);
    };

    window.addEventListener("biamakes-open-change-log", handleOpenModal);
    return () => {
      window.removeEventListener("biamakes-open-change-log", handleOpenModal);
    };
  }, [isTargetUser]);

  const handleAcknowledge = () => {
    // Marca como ciente no localStorage para não reabrir o popup flutuante
    localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, latestChange.id);
    setIsAcknowledged(true);
    setIsOpen(false);
    // Notifica outros componentes como a barra superior
    window.dispatchEvent(new CustomEvent("biamakes-change-acknowledged", { detail: latestChange.id }));
  };

  if (!isTargetUser) {
    return null;
  }

  return (
    <>
      {/* Toast flutuante (Só aparece se o usuário AINDA NÃO tiver ficado ciente) */}
      {!isAcknowledged && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#7A3F51] text-white p-3.5 pr-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 max-w-md backdrop-blur-md">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-white shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#7A3F51]" />
            </div>
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Alteração do Sistema Notificada</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">eduardo.nunes</span>
              </div>
              <p className="text-white/80 line-clamp-1 text-[11px] mt-0.5">
                {latestChange.title}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <button
                onClick={() => {
                  setSelectedChange(latestChange);
                  setIsOpen(true);
                }}
                className="px-3 py-1.5 bg-white text-[#7A3F51] rounded-xl font-bold text-xs hover:bg-[#FAF0F4] transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Alteração</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAcknowledge}
                title="Ficar ciente e mover para barra superior"
                className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhado de auditoria e informações da alteração */}
      {isOpen && selectedChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 relative shadow-2xl border border-[#E9D9CD] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E9D9CD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center border border-[#E9D9CD]">
                  <FileText className="w-5 h-5 text-[#9C5B6F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Alteração Registrada
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ID: {selectedChange.id}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#39313A] mt-1">
                    {selectedChange.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Alterações caso haja mais de uma */}
            {SYSTEM_CHANGE_LOGS.length > 1 && (
              <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Histórico:</span>
                {SYSTEM_CHANGE_LOGS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedChange(item)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      selectedChange.id === item.id
                        ? "bg-[#7A3F51] text-white shadow-sm"
                        : "bg-[#FAF7F8] text-gray-600 border border-[#E9D9CD] hover:bg-white"
                    }`}
                  >
                    {item.id}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="space-y-4 pt-4 text-xs">
              
              {/* Data & Horário */}
              <div className="flex items-center gap-2 p-3 bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] text-gray-700">
                <Clock className="w-4 h-4 text-[#9C5B6F]" />
                <span><strong>Data e Horário:</strong> {formatDate(selectedChange.timestamp)} (Horário de Brasília)</span>
              </div>

              {/* Descrição detalhada */}
              <div>
                <h4 className="font-bold text-[#39313A] mb-1.5 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  O que foi alterado
                </h4>
                <div className="p-3.5 bg-white rounded-xl border border-[#E9D9CD] text-gray-700 whitespace-pre-line leading-relaxed font-sans">
                  {selectedChange.description}
                </div>
              </div>

              {/* Arquivos Modificados */}
              <div>
                <h4 className="font-bold text-[#39313A] mb-1.5 uppercase text-[11px] tracking-wider">
                  Arquivos Impactados
                </h4>
                <div className="p-3 bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] space-y-1 font-mono text-[11px] text-[#7A3F51]">
                  {selectedChange.filesModified.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B6F]" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como reverter */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Possibilidade de Reversão / Voltar Função
                </div>
                <div className="text-[11px] text-amber-800 whitespace-pre-line leading-relaxed">
                  {selectedChange.reversalGuide}
                </div>
                <div className="text-[10px] text-amber-700/80 pt-1 font-medium">
                  Arquivo de rastreio permanente gravado em: <strong className="font-mono">HISTORICO_ALTERACOES.txt</strong>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#E9D9CD]">
              <span className="text-[11px] text-gray-500">
                Acesso permanente fixado ao lado da lupa no cabeçalho
              </span>
              <button
                onClick={handleAcknowledge}
                className="px-5 py-2.5 rounded-full bg-[#7A3F51] hover:bg-[#5E303E] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ciente / Salvar e Fechar</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
