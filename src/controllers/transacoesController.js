// src/controllers/transacoesController.js
// CRUD completo de transações financeiras

const pool = require('../config/database');

// ─── GET /transacoes ──────────────────────────────────────────────────────────
// Lista todas as transações NÃO deletadas do usuário logado

async function listar(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, descricao, valor, tipo, categoria, data_transacao, criado_em, atualizado_em
       FROM transacoes
       WHERE usuario_id = $1 AND deletado = FALSE
       ORDER BY data_transacao DESC, criado_em DESC`,
      [req.userId]
    );

    // Calcula saldo total (entradas - saídas)
    const saldoResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) AS total_entradas,
         COALESCE(SUM(CASE WHEN tipo = 'saida'   THEN valor ELSE 0 END), 0) AS total_saidas
       FROM transacoes
       WHERE usuario_id = $1 AND deletado = FALSE`,
      [req.userId]
    );

    const { total_entradas, total_saidas } = saldoResult.rows[0];
    const saldo = parseFloat(total_entradas) - parseFloat(total_saidas);

    return res.status(200).json({
      transacoes: result.rows,
      resumo: {
        total_entradas: parseFloat(total_entradas),
        total_saidas:   parseFloat(total_saidas),
        saldo,
      },
    });
  } catch (err) {
    console.error('[listar]', err.message);
    return res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
}

// ─── GET /transacoes/:id ──────────────────────────────────────────────────────
// Busca uma transação específica

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, descricao, valor, tipo, categoria, data_transacao, criado_em, atualizado_em
       FROM transacoes
       WHERE id = $1 AND usuario_id = $2 AND deletado = FALSE`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.status(200).json({ transacao: result.rows[0] });
  } catch (err) {
    console.error('[buscarPorId]', err.message);
    return res.status(500).json({ error: 'Erro ao buscar transação.' });
  }
}

// ─── POST /transacoes ─────────────────────────────────────────────────────────
// Cria uma nova transação

async function criar(req, res) {
  try {
    const { descricao, valor, tipo, categoria, data_transacao } = req.body;

    // Validações
    if (!descricao || descricao.trim().length < 3) {
      return res.status(400).json({ error: 'Descrição deve ter pelo menos 3 caracteres.' });
    }
    if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser um número positivo maior que zero.' });
    }
    if (!tipo || !['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida".' });
    }

    const result = await pool.query(
      `INSERT INTO transacoes (usuario_id, descricao, valor, tipo, categoria, data_transacao)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, descricao, valor, tipo, categoria, data_transacao, criado_em`,
      [
        req.userId,
        descricao.trim(),
        parseFloat(valor),
        tipo,
        categoria?.trim() || null,
        data_transacao || new Date().toISOString().split('T')[0],
      ]
    );

    return res.status(201).json({
      message: 'Transação criada com sucesso!',
      transacao: result.rows[0],
    });
  } catch (err) {
    console.error('[criar]', err.message);
    return res.status(500).json({ error: 'Erro ao criar transação.' });
  }
}

// ─── PUT /transacoes/:id ──────────────────────────────────────────────────────
// Edita uma transação existente

async function editar(req, res) {
  try {
    const { id } = req.params;
    const { descricao, valor, tipo, categoria, data_transacao } = req.body;

    // Verifica se a transação existe e pertence ao usuário
    const existe = await pool.query(
      'SELECT id FROM transacoes WHERE id = $1 AND usuario_id = $2 AND deletado = FALSE',
      [id, req.userId]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    // Validações
    if (descricao && descricao.trim().length < 3) {
      return res.status(400).json({ error: 'Descrição deve ter pelo menos 3 caracteres.' });
    }
    if (valor !== undefined && (isNaN(valor) || parseFloat(valor) <= 0)) {
      return res.status(400).json({ error: 'Valor deve ser um número positivo maior que zero.' });
    }
    if (tipo && !['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida".' });
    }

    const result = await pool.query(
      `UPDATE transacoes SET
         descricao      = COALESCE($1, descricao),
         valor          = COALESCE($2, valor),
         tipo           = COALESCE($3, tipo),
         categoria      = COALESCE($4, categoria),
         data_transacao = COALESCE($5, data_transacao),
         atualizado_em  = NOW()
       WHERE id = $6 AND usuario_id = $7
       RETURNING id, descricao, valor, tipo, categoria, data_transacao, atualizado_em`,
      [
        descricao?.trim() || null,
        valor ? parseFloat(valor) : null,
        tipo || null,
        categoria?.trim() || null,
        data_transacao    || null,
        id,
        req.userId,
      ]
    );

    return res.status(200).json({
      message: 'Transação atualizada com sucesso!',
      transacao: result.rows[0],
    });
  } catch (err) {
    console.error('[editar]', err.message);
    return res.status(500).json({ error: 'Erro ao editar transação.' });
  }
}

// ─── DELETE /transacoes/:id ───────────────────────────────────────────────────
// SOFT DELETE: marca como deletada, mas NÃO apaga do banco 

async function deletar(req, res) {
  try {
    const { id } = req.params;

    const existe = await pool.query(
      'SELECT id FROM transacoes WHERE id = $1 AND usuario_id = $2 AND deletado = FALSE',
      [id, req.userId]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    await pool.query(
      `UPDATE transacoes
       SET deletado = TRUE, deletado_em = NOW(), atualizado_em = NOW()
       WHERE id = $1 AND usuario_id = $2`,
      [id, req.userId]
    );

    return res.status(200).json({
      message: 'Transação arquivada com sucesso. O registro foi mantido para auditoria.',
    });
  } catch (err) {
    console.error('[deletar]', err.message);
    return res.status(500).json({ error: 'Erro ao arquivar transação.' });
  }
}

module.exports = { listar, buscarPorId, criar, editar, deletar };
