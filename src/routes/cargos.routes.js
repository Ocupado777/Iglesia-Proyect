const express = require('express');
const { obtenerCargos } = require('../controllers/catalogos.controller');

const router = express.Router();
router.get('/', obtenerCargos);

module.exports = router;
