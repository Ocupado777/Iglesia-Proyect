const express = require('express');
const {
  asignarPersona,
  crearMinisterio,
  listarMinisterios,
  obtenerMinisterio
} = require('../controllers/ministerios.controller');

const router = express.Router();
router.get('/', listarMinisterios);
router.post('/', crearMinisterio);
router.post('/:id/personas', asignarPersona);
router.get('/:id', obtenerMinisterio);

module.exports = router;
