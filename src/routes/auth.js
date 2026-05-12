// src/routes/auth.js
const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/authController');

// POST /auth/cadastro  — Cria nova conta
router.post('/cadastro', controller.cadastro);

router.post('/login', controller.login);

router.get('/me', auth, controller.me);

module.exports = router;
