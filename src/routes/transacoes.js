// src/routes/transacoes.js
const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/transacoesController');

// Todas as rotas de transações exigem login (token JWT)
router.use(auth);

router.get('/',     controller.listar);

router.get('/:id',  controller.buscarPorId);

router.post('/',    controller.criar);

router.put('/:id',  controller.editar);

router.delete('/:id', controller.deletar);

module.exports = router;
