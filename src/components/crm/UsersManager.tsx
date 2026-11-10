"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  UserPlus, 
  Users, 
  Shield, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  KeyRound, 
  UserCheck, 
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { SystemUser, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";

interface UsersManagerProps {
  users: SystemUser[];
  currentAdmin: SystemUser;
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
}

const roleDescriptions: Record<UserRole, { label: string; badge: string; permissions: string }> = {
  ADMIN: {
    label: "Administrador Geral",
    badge: "bg-[#9C5B6F] text-white",
    permissions: "Acesso total: Dashboard, Produtos, Estoque, Pedidos, Marketplaces, Financeiro e Gestão de Usuários.",
  },
  GERENTE: {
    label: "Gerente Comercial",
    badge: "bg-purple-100 text-purple-800",
    permissions: "Acesso gerencial: Dashboard, Produtos, Estoque, Pedidos, Marketplaces e Planilhas.",
  },
  ESTOQUE: {
    label: "Operador de Estoque",
    badge: "bg-amber-100 text-amber-800",
    permissions: "Foco operacional: Produtos, Controle Central de Estoque (Kardex) e Importação de Planilhas.",
  },
  VENDAS: {
    label: "Consultora de Vendas",
    badge: "bg-blue-100 text-blue-800",
    permissions: "Foco comercial: Dashboard, Consulta de Produtos e Central de Pedidos & Vendas.",
  },
  FINANCEIRO: {
    label: "Gestor Financeiro",
    badge: "bg-emerald-100 text-emerald-800",
    permissions: "Foco contábil: Dashboard, Pedidos Faturados e Módulo Financeiro / DRE.",
  },
};

export function UsersManager({
  users,
  currentAdmin,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: UsersManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("VENDAS");
  const [formIsActive, setFormIsActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormEmail("");
    setFormRole("VENDAS");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: SystemUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(u.password || "");
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = formUsername.trim().toLowerCase();

    if (!formName.trim() || !cleanUsername || !formPassword.trim()) {
      alert("Preencha o Nome, Usuário e Senha.");
      return;
    }

    // Check duplicate username
    const duplicate = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      alert(`O usuário "${cleanUsername}" já está cadastrado no sistema.`);
      return;
    }

    const payload: SystemUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: formName.trim(),
      username: cleanUsername,
      password: formPassword,
      email: formEmail.trim() || `${cleanUsername}@biamake.com.br`,
      role: editingUser?.isMaster ? "ADMIN" : formRole,
      isActive: editingUser?.isMaster ? true : formIsActive,
      isMaster: editingUser?.isMaster || false,
      avatar: "/logo.jpg",
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    if (editingUser) {
      onUpdateUser(payload);
    } else {
      onAddUser(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#39313A]">
            Gestão de Usuários, Funcionários & Perfis (RBAC)
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Crie usuários de acesso ao CRM e defina o perfil de permissão de cada funcionário. O sistema ajustará os módulos automaticamente no login.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-[#9C5B6F] hover:bg-[#7A3F51] text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Novo Usuário / Funcionário</span>
        </button>
      </div>

      {/* Role Permissions Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(roleDescriptions) as UserRole[]).map((r) => (
          <div
            key={r}
            className="bg-white p-3.5 rounded-2xl border border-[#E9D9CD] shadow-sm space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleDescriptions[r].badge}`}>
                {r}
              </span>
              <Shield className="w-3.5 h-3.5 text-[#C69A76]" />
            </div>
            <div className="text-xs font-bold text-[#39313A]">{roleDescriptions[r].label}</div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {roleDescriptions[r].permissions}
            </p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[#39313A]/70 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Nome do Funcionário</th>
                <th className="py-3.5 px-4">Usuário de Login</th>
                <th className="py-3.5 px-4">Perfil Vinculado</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Criado em</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/50">
              {users.map((u) => {
                const roleInfo = roleDescriptions[u.role];
                return (
                  <tr key={u.id} className="hover:bg-[#FAF7F8]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#C69A76] shrink-0">
                          <Image src={u.avatar || "/logo.jpg"} alt={u.name} fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#39313A] flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.isMaster && (
                              <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold uppercase">
                                Admin Master
                              </span>
                            )}
                            {currentAdmin.id === u.id && (
                              <span className="text-[10px] text-[#9C5B6F] font-bold">(Você)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#7A3F51] bg-[#FAF0F4] px-2.5 py-1 rounded-lg border border-[#E9D9CD]">
                        {u.username}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${roleInfo.badge}`}>
                        {roleInfo.label} ({u.role})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {u.createdAt ? formatDate(u.createdAt) : "-"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-[#9C5B6F] hover:bg-[#F5DDE5] rounded-lg transition-colors"
                          title="Editar Perfil e Credenciais"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!u.isMaster && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o usuário "${u.username}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl border border-[#E9D9CD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#9C5B6F]" />
                <h3 className="font-display text-lg font-bold text-[#39313A]">
                  {editingUser ? "Editar Usuário e Perfil" : "Novo Usuário do CRM"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Paula Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Usuário de Acesso (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser?.isMaster)}
                    placeholder="Ex: ana.vendas"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono font-bold disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Senha de Acesso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Defina a senha"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  placeholder="Ex: ana@biamake.com.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Perfil de Acesso no CRM (Ajustado Automaticamente no Login)
                </label>
                <select
                  disabled={Boolean(editingUser?.isMaster)}
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-bold text-[#7A3F51] disabled:opacity-60"
                >
                  <option value="ADMIN">ADMIN — Administrador Geral (Acesso Total)</option>
                  <option value="GERENTE">GERENTE — Gerente Comercial</option>
                  <option value="ESTOQUE">ESTOQUE — Operador de Estoque & Expedição</option>
                  <option value="VENDAS">VENDAS — Consultora de Vendas</option>
                  <option value="FINANCEIRO">FINANCEIRO — Gestor Financeiro & DRE</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  {roleDescriptions[formRole].permissions}
                </p>
              </div>

              {!editingUser?.isMaster && (
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-[#9C5B6F]"
                    />
                    <span className="font-bold text-[#39313A]">
                      Usuário Ativo (Permitir login no sistema)
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E9D9CD] text-gray-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? "Salvar Usuário" : "Criar Usuário"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
