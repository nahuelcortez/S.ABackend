# FinTech Flow – Backend API

> Core Engine da plataforma de tesouraria **SafeCash** · Node.js + Express + PostgreSQL

---

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v18 ou superior
- [PostgreSQL](https://www.postgresql.org/) v14 ou superior

### 2. Instalar dependências
```bash
cd fintechflow-backend
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com seus dados do PostgreSQL
```

### 4. Criar o banco de dados no PostgreSQL
```sql
-- Execute no psql ou pgAdmin:
CREATE DATABASE fintechflow;
```

### 5. Criar as tabelas
```bash
npm run setup-db
```

### 6. Iniciar o servidor
```bash
npm run dev     # desenvolvimento (com auto-reload)
npm start       # produção
```

A API estará disponível em: **http://localhost:3000**

---

## 📋 Documentação das Rotas

### 🔐 Autenticação (`/auth`)

#### `POST /auth/cadastro` — Criar conta
**Body (JSON):**
```json
{
  "nome": "João",
  "sobrenome": "Silva",
  "empresa": "SafeCash Ltda.",
  "email": "joao@safecash.com",
  "senha": "minimo8caracteres"
}
```
**Resposta 201:**
```json
{
  "message": "Conta criada com sucesso!",
  "token": "eyJhbGciOiJIUzI1...",
  "usuario": { "id": 1, "nome": "João", "email": "joao@safecash.com", ... }
}
```

---

#### `POST /auth/login` — Fazer login
**Body (JSON):**
```json
{
  "email": "joao@safecash.com",
  "senha": "minimo8caracteres"
}
```
**Resposta 200:**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1...",
  "usuario": { "id": 1, "nome": "João", "email": "joao@safecash.com" }
}
```

---

#### `GET /auth/me` — Dados do usuário logado 🔒
**Header:** `Authorization: Bearer <token>`

**Resposta 200:**
```json
{
  "usuario": { "id": 1, "nome": "João", "email": "joao@safecash.com", ... }
}
```

---

### 💰 Transações (`/transacoes`) — todas protegidas 🔒

> Todas as rotas exigem o header: `Authorization: Bearer <token>`

---

#### `GET /transacoes` — Listar todas + saldo
**Resposta 200:**
```json
{
  "transacoes": [
    { "id": 1, "descricao": "Pagamento Aluguel", "valor": "2000.00", "tipo": "saida", ... }
  ],
  "resumo": {
    "total_entradas": 10000.00,
    "total_saidas": 2000.00,
    "saldo": 8000.00
  }
}
```

---

#### `GET /transacoes/:id` — Buscar uma transação
**Resposta 200:** `{ "transacao": { ... } }`

---

#### `POST /transacoes` — Criar transação
**Body (JSON):**
```json
{
  "descricao": "Antecipação de Recebível #4821",
  "valor": 5000.00,
  "tipo": "entrada",
  "categoria": "Recebíveis",
  "data_transacao": "2025-06-10"
}
```
**Resposta 201:** `{ "message": "Transação criada!", "transacao": { ... } }`

> ⚠️ `valor` deve ser positivo e maior que zero. Valores negativos são bloqueados.

---

#### `PUT /transacoes/:id` — Editar transação
**Body (JSON):** qualquer campo a ser alterado
```json
{
  "descricao": "Novo nome da transação",
  "valor": 6000.00
}
```
**Resposta 200:** `{ "message": "Transação atualizada!", "transacao": { ... } }`

---

#### `DELETE /transacoes/:id` — Arquivar transação (Soft Delete)
**Resposta 200:**
```json
{
  "message": "Transação arquivada com sucesso. O registro foi mantido para auditoria."
}
```

> ✅ **Regra de Ouro (H1):** Nenhum registro é apagado fisicamente do banco. O campo `deletado = TRUE` garante rastreabilidade total.

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `usuarios`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL PK | Identificador único |
| nome | VARCHAR(100) | Nome do usuário |
| email | VARCHAR(255) UNIQUE | E-mail (único) |
| senha_hash | VARCHAR(255) | Senha criptografada com bcrypt |
| criado_em | TIMESTAMP | Data de criação |

### Tabela `transacoes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL PK | Identificador único |
| usuario_id | FK → usuarios | Rastreabilidade de autoria |
| descricao | VARCHAR(255) | Descrição da transação |
| valor | NUMERIC(15,2) | Valor (sempre positivo) |
| tipo | `entrada` / `saida` | Tipo da transação |
| deletado | BOOLEAN | Soft Delete (nunca apaga) |
| criado_em | TIMESTAMP | Auditoria: quando foi criado |
| atualizado_em | TIMESTAMP | Auditoria: última alteração |

---

## 🏗️ Estrutura de Arquivos

```
fintechflow-backend/
├── src/
│   ├── config/
│   │   ├── database.js        # Conexão com PostgreSQL
│   │   └── setupDatabase.js   # Cria tabelas
│   ├── controllers/
│   │   ├── authController.js       # Cadastro e Login
│   │   └── transacoesController.js # CRUD de Transações
│   ├── middleware/
│   │   └── auth.js            # Verificação JWT
│   ├── routes/
│   │   ├── auth.js            # Rotas de autenticação
│   │   └── transacoes.js      # Rotas de transações
│   └── server.js              # Ponto de entrada
├── .env.example               # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Segurança Implementada

- **Senhas** criptografadas com `bcrypt` (salt rounds: 12)
- **Autenticação** via JWT (JSON Web Token) com expiração
- **Soft Delete** obrigatório — auditoria completa
- **Validação** de todos os campos de entrada
- **Valores negativos** bloqueados por constraint no banco e na API
- **Variáveis sensíveis** isoladas em `.env` (nunca no Git)

---

*Projeto acadêmico — Prof. Willer Barros · FinTech Flow / SafeCash*
