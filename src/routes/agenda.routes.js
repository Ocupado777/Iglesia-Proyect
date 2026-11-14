const express = require('express');
const {
  crearEvento,
  crearServicio,
  listarEventos,
  listarServicios,
  obtenerEvento,
  obtenerServicio
} = require('../controllers/agenda.controller');

const routerServicios = express.Router();
routerServicios.get('/', listarServicios);
routerServicios.post('/', crearServicio);
routerServicios.get('/:id', obtenerServicio);

const routerEventos = express.Router();
routerEventos.get('/', listarEventos);
routerEventos.post('/', crearEvento);
routerEventos.get('/:id', obtenerEvento);

module.exports = { routerEventos, routerServicios };
