# Especificação Técnica: PowerToys Spotlight & Motor de Atalhos Globais (`cmdk` + `useGlobalShortcuts`)

Esta referência documenta a fusão obrigatória entre o **PowerToys Run / Spotlight (`Cmd+K` / `Ctrl+K`)** e o **Motor Global de Atalhos de Teclado (`useGlobalShortcuts`)**, preservando 100% da ergonomia já consagrada em produção e expandindo-a para o ecossistema Multi-Tenant, MSP, Escritórios e Helpdesk ITSM.

---

## 1. Atalhos Globais Fora do Spotlight (`useGlobalShortcuts`)
Mesmo com o Spotlight fechado, o sistema escuta globalmente (ignorando quando o foco está em `<input>`, `<textarea>` ou `<select>`, exceto para o `Alt+S` que salva o formulário ativo):
- **`Ctrl+K` ou `Cmd+K`:** Abre/fecha o PowerToys Spotlight global.
- **`Alt+1` a `Alt+9`:** Navegação direta instantânea para os módulos principais da barra lateral (ex: `Alt+1` Dashboard/Timeline, `Alt+2` Equipamentos, `Alt+3` Colaboradores, `Alt+4` Chamados Helpdesk, `Alt+5` Escritórios, `Alt+6` GED/Documentos, `Alt+7` Licenças M365, `Alt+8` Domínios).
- **`Alt+N`:** Dispara a ação contextual **"Novo Registro"** da página atual (`window.dispatchEvent(new CustomEvent('shortcut-new-item'))` — ex: Novo Equipamento em `/equipments`, Novo Chamado em `/helpdesk`, Novo Colaborador em `/employees`, Novo Escritório em `/offices`).
- **`Alt+S`:** Submete/salva imediatamente o modal ou formulário aberto na tela (`window.dispatchEvent(new CustomEvent('shortcut-save-form'))`).

---

## 2. Anatomia do PowerToys Spotlight (`<CommandDialog />`)
- **Priorização Contextual Inteligente:** O Spotlight detecta a rota atual (`pathname`) e posiciona as ações contextuais daquela tela no topo da lista antes das rotas gerais.
- **Esquerda (Atalho `<Kbd>` Dinâmico `1-9` e `A-Z`):** Os primeiros 35 itens visíveis recebem uma badge `<Kbd>` (`1`..`9`, depois `A`..`Z`). Pressionar `Alt + [Tecla]` com o Spotlight aberto executa aquele item instantaneamente sem precisar navegar com as setas!
- **Ícone:** Ícone `lucide-react` (`size-4`, `strokeWidth={1.75}`).
- **Título & Subtítulo Contextual:** Nome da ação, ativo (com Serial/Service Tag), colaborador (com Cargo/Escritório), chamado (com protocolo e SLA) ou Tenant.
- **Direita (Categoria):** Badge sutil em caixa alta (`text-[10px] font-medium tracking-wider uppercase text-muted-foreground`).
- **Rodapé Técnico:** Dicas visíveis: `↑↓ navegar`, `↵ selecionar`, `Alt+Tecla disparo rápido`, `!! recentes`, `@ tenant/escritório`, `# chamado` e `ESC fechar`.

---

## 3. Comandos Especiais & Prefixos ("Canivete Suíço")

### A. Histórico de Comandos Recentes (`!!`)
- Digitar exatamente `!!` exibe os últimos 15 comandos, páginas ou entidades acessadas pelo usuário (persistidos em `localStorage` por usuário/tenant), ordenados do mais recente para o mais antigo.

### B. Calculadora Científica Inline com Cópia Rápida (`tabular-nums`)
- Qualquer expressão matemática digitada no input (suportando `+`, `-`, `*`, `/`, `^` potência, `%` porcentagem, `sqrt(...)` ou `raiz(...)` e vírgula/ponto decimal) é avaliada em tempo real em memória.
- Exibe um card de destaque no topo com ícone `Calculator`, resultado formatado em `pt-BR` com `tabular-nums` e ação **"Pressione Enter para copiar para a área de transferência"** (disparando feedback via `sonner`).

### C. Consulta Instantânea WHOIS / Domínio (`whois <dominio.com.br>`)
- Digitar `whois exemplo.com.br` (ou um domínio válido) exibe a ação instantânea de inspeção RDAP/DNS/SSL daquele domínio, abrindo o diagnóstico completo.

### D. Prefixos Rápidos de Escopo e Governança (`@`, `#`, `>`)
- **`@` (Troca de Tenant Cliente ou Escritório):** Filtra instantaneamente Empresas/Tenants (essencial para o modo MSP/Holding) e Escritórios (`Offices`), alterando o contexto global sem tocar no mouse.
- **`#` (Busca Direta de Chamado Helpdesk ou Patrimônio):** Digitar `#1042` ou `#TAG-091` vai direto ao Chamado ITSM ou à Ficha do Equipamento.
- **`>` (Execução de Playbooks e Ações de TI):** Filtra apenas ações executáveis (ex: `> Novo Chamado`, `> Sincronizar Entra ID`, `> Emitir Termo GED`, `> Alternar Tema Escuro/Claro`, `> Abrir Modo Raio-X UX`).
