const express = require('express');
const { eliminarHijo } = require('../controllers/hijos.controller');

const router = express.Router();
router.delete('/:id', eliminarHijo);

module.exports = router;
