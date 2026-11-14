const express = require('express');
const { obtenerPerfil } = require('../controllers/auth.controller');

const router = express.Router();
router.get('/perfil', obtenerPerfil);

module.exports = router;
