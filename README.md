# Tlanner — Client

> 🌐 **Live app:** [tlanner.com.br](https://tlanner.com.br) · Deployed on **Vercel**

Frontend da aplicação **Tlanner**, um task planner focado em produtividade com workspaces, gerenciamento de tarefas, rastreamento de hábitos e timer Pomodoro.

---

## ✨ Funcionalidades

### 🗂️ Dashboard — Workspaces
Gerencie múltiplos workspaces (projetos ou áreas de foco). Crie, edite e exclua workspaces diretamente pelo dashboard com atualização em tempo real via WebSocket.

### ✅ Workspace Tasks — Kanban Board
Dentro de cada workspace, visualize e organize tarefas em três colunas:
- **Pending** → **In Progress** → **Done**

Cada tarefa possui **prioridade** (Low / Normal / High / Urgent) e suporte a **drag-and-drop** entre colunas. Tarefas são ordenadas automaticamente por prioridade.

### 🍅 Pomodoro Timer
Timer Pomodoro integrado diretamente nas tarefas. Inicie uma sessão de foco vinculada a qualquer tarefa para manter a concentração e medir o tempo produtivo.

### 📅 Habit Tracker
Crie e acompanhe hábitos com frequência **diária ou semanal**. Visualize o histórico de conclusões por data e marque hábitos como concluídos no dia atual.

### 🔔 Realtime Toasts
Notificações em tempo real via WebSocket que informam ações de outros usuários (criação, edição e exclusão de tarefas, workspaces e hábitos) sem necessidade de recarregar a página.

### 🔐 Autenticação
- Login e cadastro com **e-mail e senha**
- Login com **GitHub OAuth** (callback automático via `/auth/callback`)
- Rotas protegidas com token JWT armazenado em `localStorage`

---

## 🛠️ Stack

| Tecnologia | Versão |
|---|---|
| React | 19 |
| TypeScript | ~5.9 |
| Vite | 7 |
| React Router | 7 |
| Lucide React + React Icons | — |
| Vercel Analytics + Speed Insights | — |

---

## 🚀 Deploy

O projeto é deployed automaticamente na **Vercel** a cada push na branch `master`.

👉 [tlanner.com.br](https://tlanner.com.br)

---

## 🧑‍💻 Rodando localmente

```bash
pnpm install
pnpm dev
```
