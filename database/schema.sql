-- =====================================================================
-- Sistema web de registro de personas, asistencia y notificaciones
-- Base de datos: iglesia_db   |   Motor: PostgreSQL
--
-- CÓMO USARLO (opción fácil, con pgAdmin):
--   1. Crea una base de datos llamada iglesia_db (clic derecho en
--      "Databases" > Create > Database).
--   2. Clic derecho sobre iglesia_db > Query Tool.
--   3. Abre este archivo (icono de carpeta), pulsa F5 y listo.
--
-- CÓMO USARLO (con CMD): ver el README del proyecto.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Usuarios del sistema (un administrador al inicio)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recuperación de contraseña (fase 2). Se guarda el hash del token.
CREATE TABLE recuperaciones_password (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL,
  expira_en   TIMESTAMP NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. Catálogos
-- ---------------------------------------------------------------------
CREATE TABLE cargos (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE ministerios (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL UNIQUE,
  descripcion  VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- 3. Personas, hijos y pertenencia a ministerios
-- La edad y la categoría (Nuevo/Miembro) NO se guardan: se calculan.
-- actualizado_en se actualiza desde la API (SET actualizado_en = NOW()).
-- ---------------------------------------------------------------------
CREATE TABLE personas (
  id                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombres                VARCHAR(100) NOT NULL,
  apellidos              VARCHAR(100) NOT NULL,
  cedula                 VARCHAR(10) UNIQUE,
  fecha_nacimiento       DATE NOT NULL,
  sexo                   CHAR(1) NOT NULL CHECK (sexo IN ('M','F')),
  telefono               VARCHAR(15) NOT NULL,
  correo                 VARCHAR(150),
  estado_relacion        VARCHAR(15) NOT NULL DEFAULT 'soltero'
                         CHECK (estado_relacion IN ('soltero','noviazgo','casado','union_libre','divorciado','viudo')),
  fecha_matrimonio       DATE,
  fecha_ingreso          DATE NOT NULL,
  cargo_id               INT NOT NULL REFERENCES cargos(id),
  canal_preferido        VARCHAR(10) NOT NULL DEFAULT 'whatsapp'
                         CHECK (canal_preferido IN ('correo','whatsapp','sms','llamada')),
  consentimiento         BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_consentimiento   TIMESTAMP,
  activo                 BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_personas_apellidos ON personas (apellidos, nombres);
CREATE INDEX idx_personas_canal     ON personas (canal_preferido);
CREATE INDEX idx_personas_activo    ON personas (activo);

CREATE TABLE hijos (
  id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  persona_id        INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  nombre            VARCHAR(100) NOT NULL,
  fecha_nacimiento  DATE NOT NULL
);

CREATE TABLE persona_ministerio (
  persona_id     INT NOT NULL REFERENCES personas(id)    ON DELETE CASCADE,
  ministerio_id  INT NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, ministerio_id)
);

-- ---------------------------------------------------------------------
-- 4. Servicios (plantillas semanales), eventos (fechas concretas)
--    y aniversarios
-- ---------------------------------------------------------------------
-- dia_semana: 1=lunes ... 7=domingo (NULL si no es semanal, ej. viernes de familia)
CREATE TABLE servicios (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  tipo         VARCHAR(10) NOT NULL DEFAULT 'regular' CHECK (tipo IN ('regular','especial')),
  dia_semana   SMALLINT CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  descripcion  VARCHAR(255),
  activo       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Un evento es una fecha concreta (el culto del martes 18 de noviembre, etc.).
-- Un cambio temporal de horario (toque de queda) se registra editando
-- hora_inicio/hora_fin del evento y escribiendo la observación.
CREATE TABLE eventos (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  servicio_id  INT REFERENCES servicios(id) ON DELETE SET NULL,
  nombre       VARCHAR(120) NOT NULL,
  fecha        DATE NOT NULL,
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  lugar        VARCHAR(150),
  observacion  VARCHAR(255),
  estado       VARCHAR(10) NOT NULL DEFAULT 'programado'
               CHECK (estado IN ('programado','cancelado','realizado')),
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_eventos_fecha ON eventos (fecha);

CREATE TABLE aniversarios (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  mes          SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  dias         VARCHAR(100) NOT NULL,            -- texto libre: 'sábado y domingo'
  descripcion  VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- 5. Asistencia (una persona solo puede asistir una vez a un evento)
-- ---------------------------------------------------------------------
CREATE TABLE asistencias (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  evento_id       INT NOT NULL REFERENCES eventos(id)  ON DELETE CASCADE,
  persona_id      INT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  registrado_por  INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_asistencia UNIQUE (evento_id, persona_id)
);

-- ---------------------------------------------------------------------
-- 6. Notificaciones
-- filtros_json guarda los filtros usados, para el historial.
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo           VARCHAR(150) NOT NULL,
  mensaje          TEXT NOT NULL,
  evento_id        INT REFERENCES eventos(id)  ON DELETE SET NULL,
  filtros_json     TEXT,
  programada_para  TIMESTAMP,
  estado           VARCHAR(10) NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('borrador','programada','enviada')),
  creado_por       INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificacion_destinatarios (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notificacion_id  INT NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  persona_id       INT NOT NULL REFERENCES personas(id)       ON DELETE CASCADE,
  canal            VARCHAR(10) NOT NULL CHECK (canal IN ('correo','whatsapp','sms','llamada')),
  estado           VARCHAR(10) NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','enviado','contactado','error')),
  enviado_en       TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 7. Configuración (clave/valor)
-- ---------------------------------------------------------------------
CREATE TABLE configuracion (
  clave  VARCHAR(60) PRIMARY KEY,
  valor  VARCHAR(255) NOT NULL
);

-- =====================================================================
-- DATOS INICIALES
-- =====================================================================
INSERT INTO cargos (nombre) VALUES ('Miembro'), ('Líder'), ('Pastor');

INSERT INTO ministerios (nombre) VALUES
  ('Alabanza'), ('Jóvenes'), ('Niños'), ('Damas'), ('Caballeros');

-- Servicios semanales (dia_semana: 2=martes, 3=miércoles, 4=jueves, 6=sábado, 7=domingo)
INSERT INTO servicios (nombre, tipo, dia_semana, hora_inicio, hora_fin) VALUES
  ('Oración',               'regular', 2, '19:00', '21:00'),
  ('Oración (intercesión)', 'regular', 3, '08:00', '12:00'),
  ('Enseñanza',             'regular', 4, '19:00', '21:00'),
  ('Servicio de jóvenes',   'regular', 6, '18:00', '19:30'),
  ('Culto general',         'regular', 7, '09:00', '13:00');

-- Culto de familia: un viernes al mes. CONFIRMAR HORARIO con la iglesia.
INSERT INTO servicios (nombre, tipo, dia_semana, hora_inicio, hora_fin, descripcion) VALUES
  ('Culto especial de familia', 'especial', 5, '19:00', '21:00', 'Un viernes al mes. Horario por confirmar.');

INSERT INTO aniversarios (nombre, mes, dias) VALUES
  ('Aniversario de la iglesia', 11, 'sábado y domingo'),
  ('Aniversario de jóvenes',     9, 'sábado');

INSERT INTO configuracion (clave, valor) VALUES
  ('meses_categoria_nuevo', '3'),
  ('nombre_iglesia', 'Nombre de la iglesia'),
  ('hora_maxima_toque_queda', '20:00');

-- El usuario administrador NO se crea aquí (no se guardan contraseñas en
-- archivos). Se crea con el script src/scripts/crear_admin.js.
