const express = require('express');
const {
  actualizarPersona,
  crearPersona,
  eliminarPersona,
  listarPersonas,
  obtenerPersona
} = require('../controllers/personas.controller');
const { crearHijo, listarHijos } = require('../controllers/hijos.controller');

const router = express.Router();
router.get('/', listarPersonas);
router.post('/', crearPersona);
router.get('/:id/hijos', listarHijos);
router.post('/:id/hijos', crearHijo);
router.get('/:id', obtenerPersona);
router.put('/:id', actualizarPersona);
router.delete('/:id', eliminarPersona);

module.exports = router;
