'use client';

import { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Verifica se já houve escolha de consentimento
    const consent = localStorage.getItem('bm_cookie_consent');
    if (!consent) {
      // Exibe após 1 segundo na vitrine
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bm_cookie_consent', 'granted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('bm_cookie_consent', 'denied');
    localStorage.removeItem('bm_vid');
    localStorage.removeItem('bm_first_source');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies e privacidade"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#FAF7F8]/95 backdrop-blur-md border border-[#E9D9CD] shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#7A3F51]/10 flex items-center justify-center shrink-0 text-[#7A3F51]">
          <Cookie className="w-5 h-5" />
        </div>

        <div className="flex-1 text-xs text-[#39313A] leading-relaxed">
          <p className="font-semibold text-sm text-[#7A3F51] mb-1 flex items-center gap-1.5">
            Sua privacidade & experiência
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </p>
          <p>
            Utilizamos identificadores anônimos para entender como você chegou até nossa loja e aprimorar nosso catálogo. Sem guardar seus dados pessoais.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              Aceitar
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-600 border border-[#E9D9CD] text-xs font-medium rounded-lg transition-colors"
            >
              Apenas essenciais
            </button>
          </div>
        </div>

        <button
          onClick={handleDecline}
          aria-label="Fechar aviso"
          className="text-stone-400 hover:text-stone-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
