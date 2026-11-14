const express = require('express');
const { obtenerAniversarios } = require('../controllers/catalogos.controller');

const router = express.Router();
router.get('/', obtenerAniversarios);

module.exports = router;
