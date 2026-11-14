const express = require('express');
const { iniciarSesion } = require('../controllers/auth.controller');

const router = express.Router();
router.post('/', iniciarSesion);

module.exports = router;
