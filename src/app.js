const express = require('express');
const cors = require('cors');
const autenticacion = require('./middlewares/autenticacion');
const { manejarErrores, rutaNoEncontrada } = require('./middlewares/errores');

const loginRoutes = require('./routes/login.routes');
const authRoutes = require('./routes/auth.routes');
const cargosRoutes = require('./routes/cargos.routes');
const personasRoutes = require('./routes/personas.routes');
const hijosRoutes = require('./routes/hijos.routes');
const ministeriosRoutes = require('./routes/ministerios.routes');
const aniversariosRoutes = require('./routes/aniversarios.routes');
const { routerEventos, routerServicios } = require('./routes/agenda.routes');

const app = express();
app.use(cors());

app.use('/api/auth/login', express.json({ limit: '1mb' }), loginRoutes);
app.use('/api', autenticacion);
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/cargos', cargosRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/hijos', hijosRoutes);
app.use('/api/ministerios', ministeriosRoutes);
app.use('/api/servicios', routerServicios);
app.use('/api/eventos', routerEventos);
app.use('/api/aniversarios', aniversariosRoutes);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

module.exports = app;
