"use client";

import React, { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro global capturado:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-[#FAF0F4] via-[#FAF7F8] to-[#EDE5F3] text-[#39313A] font-sans antialiased flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-xl bg-white/95 rounded-3xl border border-[#E9D9CD] shadow-2xl p-8 text-center space-y-6">
          <div className="relative w-28 h-28 rounded-full overflow-hidden mx-auto ring-4 ring-[#C69A76]/50 shadow-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Logo Oficial Bia Makes"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-xs font-bold text-[#9C5B6F] uppercase tracking-wider">
              Atualização Técnica em Andamento
            </span>
            <h1 className="text-3xl font-black text-[#39313A]">Voltamos Já!</h1>
            <p className="text-sm text-[#39313A]/75 max-w-md mx-auto">
              Estamos realizando atualizações técnicas no site da Bia Makes para trazer o melhor em maquiagens e alta performance. Já estamos voltando!
            </p>
          </div>

          <div className="w-full h-4 bg-[#FAF0F4] rounded-full p-0.5 border border-[#E9D9CD] overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#9C5B6F] via-[#C69A76] to-[#D4AF37] animate-pulse" />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] text-white font-bold text-sm shadow-lg cursor-pointer hover:opacity-95"
            >
              Verificar se o site já voltou
            </button>
            <a
              href="/"
              className="px-6 py-3 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] font-bold text-sm hover:bg-[#FAF0F4]"
            >
              Recarregar Início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
