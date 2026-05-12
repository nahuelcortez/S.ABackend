// src/server.js
// Ponto de entrada principal da API FinTech Flow

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes       = require('./routes/auth');
const transacoesRoutes = require('./routes/transacoes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globais ──────────────────────────────────────────────────────

// Permite requisições do frontend (ajuste a origin para produção)
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());        // Parse JSON no body
app.use(express.urlencoded({ extended: true }));

// ─── Rotas ────────────────────────────────────────────────────────────────────

// Rota de saúde — para testar se a API está online
app.get('/', (req, res) => {
  res.json({
    status:  'online',
    app:     'FinTech Flow API',
    versao:  '1.0.0',
    empresa: 'SafeCash',
  });
});

// Rotas de autenticação:  /auth/cadastro  /auth/login  /auth/me
app.use('/auth', authRoutes);

// Rotas de transações:    /transacoes  
app.use('/transacoes', transacoesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ─── Inicia o servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║  FinTech Flow API                      ║`);
  console.log(`║  Rodando em http://localhost:${PORT}       ║`);
  console.log('╚════════════════════════════════════════╝\n');
});
