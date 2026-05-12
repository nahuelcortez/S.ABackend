// src/config/setupDatabase.js
// Cria todas as tabelas necessárias no PostgreSQL
// Execute com: node src/config/setupDatabase.js

const pool = require('./database');

async function setupDatabase() {
  console.log('\n🚀 Iniciando configuração do banco de dados...\n');

  try {
    // ─── TABELA: usuarios ───────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id          SERIAL PRIMARY KEY,
        nome        VARCHAR(100) NOT NULL,
        sobrenome   VARCHAR(100),
        empresa     VARCHAR(150),
        email       VARCHAR(255) NOT NULL UNIQUE,
        senha_hash  VARCHAR(255) NOT NULL,
        criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "usuarios" criada (ou já existia).');

    // ─── TABELA: transacoes ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id            SERIAL PRIMARY KEY,
        usuario_id    INTEGER NOT NULL REFERENCES usuarios(id),
        descricao     VARCHAR(255) NOT NULL,
        valor         NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
        tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
        categoria     VARCHAR(100),
        data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
        criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        -- SOFT DELETE: registros nunca são apagados fisicamente (H1 / Regra de Ouro)
        deletado      BOOLEAN DEFAULT FALSE,
        deletado_em   TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ Tabela "transacoes" criada (ou já existia).');

    // ─── ÍNDICES para performance ───────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transacoes_usuario
        ON transacoes(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_transacoes_deletado
        ON transacoes(deletado);
      CREATE INDEX IF NOT EXISTS idx_usuarios_email
        ON usuarios(email);
    `);
    console.log('✅ Índices criados.');

    console.log('\n🎉 Banco de dados configurado com sucesso!\n');
  } catch (err) {
    console.error('\n❌ Erro ao configurar banco:', err.message, '\n');
  } finally {
    await pool.end();
  }
}

setupDatabase();
