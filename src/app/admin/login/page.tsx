"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  User, 
  KeyRound, 
  ArrowLeft, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { useBiaMakes } from "@/context/BiaMakesContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useBiaMakes();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = loginAdmin(username, password);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.message || "Usuário ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF0F4] via-[#FAF7F8] to-[#EDE5F3] flex flex-col justify-center items-center p-4">
      
      {/* Back to Storefront link */}
      <div className="w-full max-w-md mb-4">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A3F51] hover:text-[#9C5B6F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Loja Virtual</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9D9CD] shadow-2xl p-8 space-y-6">
        
        {/* Brand Logo & Title */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto ring-4 ring-[#C69A76]/40 shadow-lg">
            <Image
              src="/logo.jpg"
              alt="Logo Bia Make"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[10px] font-bold text-[#9C5B6F] uppercase tracking-wider mb-1">
              <Lock className="w-3 h-3 text-[#C69A76]" />
              <span>Acesso Restrito</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-[#39313A]">
              Bia Makes CRM & ERP
            </h1>
            <p className="text-xs text-[#39313A]/70 mt-0.5">
              Informe seu usuário e senha corporativos para continuar.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-bold text-[#39313A] mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C5B6F]" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold text-[#39313A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#39313A] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C5B6F]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold text-[#39313A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9C5B6F]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#9C5B6F]/25 transition-all flex items-center justify-center"
          >
            Acessar
          </button>

        </form>

      </div>
    </div>
  );
}
