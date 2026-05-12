// src/controllers/authController.js
// Lógica de cadastro e login de usuários

const pool   = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');


function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── POST /auth/cadastro ───────────────────────────────────────────────────────

async function cadastro(req, res) {
  try {
    const { nome, sobrenome, empresa, email, senha } = req.body;

    // 1. Validações de entrada
    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (!senha || senha.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres.' });
    }

    // 2. Verifica se o e-mail já está cadastrado
    const emailExistente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (emailExistente.rows.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // 3. Hash da senha (nunca salvar senha em texto puro!)
    const senhaHash = await bcrypt.hash(senha, 12);

    // 4. Insere no banco
    const result = await pool.query(
      `INSERT INTO usuarios (nome, sobrenome, empresa, email, senha_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, sobrenome, empresa, email, criado_em`,
      [
        nome.trim(),
        sobrenome?.trim() || null,
        empresa?.trim()   || null,
        email.toLowerCase().trim(),
        senhaHash,
      ]
    );

    const novoUsuario = result.rows[0];

    // 5. Gera token JWT
    const token = generateToken(novoUsuario.id);

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      usuario: {
        id:        novoUsuario.id,
        nome:      novoUsuario.nome,
        sobrenome: novoUsuario.sobrenome,
        empresa:   novoUsuario.empresa,
        email:     novoUsuario.email,
        criado_em: novoUsuario.criado_em,
      },
    });
  } catch (err) {
    console.error('[cadastro]', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

// ─── POST /auth/login ──────────────────────────────────────────────────────────

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    // 1. Validações básicas
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (!senha) {
      return res.status(400).json({ error: 'Informe a senha.' });
    }

    // 2. Busca usuário no banco
    const result = await pool.query(
      'SELECT id, nome, sobrenome, empresa, email, senha_hash FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      // Mensagem genérica por segurança (não revelar se e-mail existe)
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const usuario = result.rows[0];

    // 3. Compara a senha com o hash salvo
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // 4. Gera token JWT
    const token = generateToken(usuario.id);

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id:        usuario.id,
        nome:      usuario.nome,
        sobrenome: usuario.sobrenome,
        empresa:   usuario.empresa,
        email:     usuario.email,
      },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

// ─── GET /auth/me (dados do usuário logado) ────────────────────────────────────

async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, sobrenome, empresa, email, criado_em FROM usuarios WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.status(200).json({ usuario: result.rows[0] });
  } catch (err) {
    console.error('[me]', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { cadastro, login, me };
