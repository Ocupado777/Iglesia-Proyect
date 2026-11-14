# Sistema de registro de personas, asistencia y notificaciones para una iglesia (API REST)

API REST del proyecto de titulación de **Desarrollo de Software**, Tecnológico Liceo Cristiano de Ecuador (Guayaquil).

**Autor:** [Completar con el nombre del estudiante] · **Correo:** [Completar con el correo institucional]

---

## 1. Descripción del proyecto

[Nombre de la iglesia] realiza servicios de oración, enseñanza, jóvenes y culto general durante la semana, un culto de familia mensual y dos aniversarios al año. Hoy el registro de personas y la asistencia se llevan de forma [manual / Excel / sin control formal], y los avisos de los eventos se dan a todos por igual.

Este proyecto es el **servicio backend (API REST)** de un sistema web que permite:

- **Registrar personas** con sus datos, hijos, estado de relación, cargo, ministerios y canal de contacto preferido (correo, WhatsApp, SMS o llamada), con consentimiento informado.
- **Programar servicios y eventos**, y consultar horarios y aniversarios.
- **Tomar asistencia** de cada evento.
- **Notificar por filtros** (edad, sexo, estado de relación, hijos, categoría, cargo, ministerio) y **por el canal preferido** de cada persona.
- **Consultar reportes** de asistencia.

La interfaz web (cliente) que consumirá esta API se desarrolla en etapas posteriores.

### Reglas clave

- La edad y la categoría (**Nuevo**: menos de 3 meses desde el ingreso; **Miembro**: 3 meses o más) se **calculan**, no se guardan.
- Sin consentimiento informado no se registra a una persona.
- Eliminar una persona es **lógico** (`activo = false`); las personas inactivas no reciben notificaciones.
- Una persona solo puede asistir una vez a un mismo evento.
- Cada persona recibe una notificación por **un solo canal**: el que prefiere.

## 2. Perfiles de usuario y responsabilidades

| Perfil | Accede al sistema | Responsabilidades |
|---|---|---|
| **Administrador** (pastor o secretaría) | Sí (único perfil en esta versión) | Iniciar sesión; registrar, editar y eliminar (lógico) personas y sus hijos; gestionar ministerios y asignar personas; crear servicios y eventos; consultar la cartelera de horarios y aniversarios; tomar asistencia; crear, previsualizar y enviar notificaciones; consultar reportes; configurar parámetros del sistema (por ejemplo, el umbral Nuevo/Miembro). |
| **Persona registrada** (miembro o persona nueva) | No | Entregar datos verdaderos, dar su consentimiento informado (y el de sus hijos menores), indicar su canal de notificación preferido y avisar cuando cambien sus datos de contacto. Es quien recibe las notificaciones. |
| **Líder de ministerio** *(fase 2)* | Sí (a futuro) | Consultar a las personas de su ministerio y enviar avisos a su grupo. |
| **Encargado de asistencia** *(fase 2)* | Sí (a futuro) | Registrar únicamente la asistencia de los servicios. |

## 3. Tecnologías

| Capa | Tecnología |
|---|---|
| Entorno de ejecución | Node.js |
| Framework web | Express |
| Base de datos | PostgreSQL, con el paquete `pg` |
| Autenticación | Tokens JWT (`jsonwebtoken`) y contraseñas con `bcryptjs` |
| Configuración | Variables de entorno con `dotenv` |
| Pruebas manuales | Thunder Client o Postman |
| Control de versiones | Git y GitHub |

## 4. Listado de endpoints

Todos los endpoints, excepto el inicio de sesión, requieren el encabezado:

```text
Authorization: Bearer <token>
```

### 4.1 Implementados en este avance (22 de 40, el 55%)

```text
POST   /api/auth/login
GET    /api/auth/perfil
GET    /api/cargos
GET    /api/personas
GET    /api/personas/{id}
POST   /api/personas
PUT    /api/personas/{id}
DELETE /api/personas/{id}
GET    /api/personas/{id}/hijos
POST   /api/personas/{id}/hijos
DELETE /api/hijos/{id}
GET    /api/ministerios
GET    /api/ministerios/{id}
POST   /api/ministerios
POST   /api/ministerios/{id}/personas
GET    /api/servicios
GET    /api/servicios/{id}
POST   /api/servicios
GET    /api/eventos
GET    /api/eventos/{id}
POST   /api/eventos
GET    /api/aniversarios
```

### 4.2 Planificados para los siguientes avances (18)

```text
PUT    /api/ministerios/{id}
DELETE /api/ministerios/{id}/personas/{persona_id}
PUT    /api/servicios/{id}
PUT    /api/eventos/{id}
POST   /api/eventos/generar
GET    /api/cartelera
GET    /api/eventos/{id}/asistencias
POST   /api/eventos/{id}/asistencias
DELETE /api/eventos/{id}/asistencias/{persona_id}
POST   /api/notificaciones/previsualizar
POST   /api/notificaciones
GET    /api/notificaciones
GET    /api/notificaciones/{id}
POST   /api/notificaciones/{id}/enviar
GET    /api/reportes/asistencia
GET    /api/configuracion
PUT    /api/configuracion/{clave}
GET    /api/panel/resumen
```

### 4.3 Descripción de los endpoints implementados

| Endpoint | Descripción | Perfil |
|---|---|---|
| `POST /api/auth/login` | Inicia sesión con correo y contraseña y devuelve un token JWT. | Público |
| `GET /api/auth/perfil` | Devuelve los datos del usuario autenticado. | Administrador |
| `GET /api/cargos` | Lista los cargos (miembro, líder, pastor). | Administrador |
| `GET /api/personas` | Lista personas con búsqueda, filtros y paginación. | Administrador |
| `GET /api/personas/{id}` | Devuelve una persona con edad, categoría, hijos y ministerios. | Administrador |
| `POST /api/personas` | Registra una persona (con hijos y ministerios opcionales). | Administrador |
| `PUT /api/personas/{id}` | Actualiza los datos de una persona. | Administrador |
| `DELETE /api/personas/{id}` | Elimina lógicamente a una persona. | Administrador |
| `GET /api/personas/{id}/hijos` | Lista los hijos de una persona. | Administrador |
| `POST /api/personas/{id}/hijos` | Agrega un hijo a una persona. | Administrador |
| `DELETE /api/hijos/{id}` | Elimina un hijo. | Administrador |
| `GET /api/ministerios` | Lista los ministerios con su número de integrantes. | Administrador |
| `GET /api/ministerios/{id}` | Devuelve un ministerio con sus integrantes. | Administrador |
| `POST /api/ministerios` | Crea un ministerio. | Administrador |
| `POST /api/ministerios/{id}/personas` | Asigna una persona a un ministerio. | Administrador |
| `GET /api/servicios` | Lista los servicios semanales con día y horario. | Administrador |
| `GET /api/servicios/{id}` | Devuelve un servicio. | Administrador |
| `POST /api/servicios` | Crea un servicio. | Administrador |
| `GET /api/eventos` | Lista eventos, con filtro opcional por rango de fechas. | Administrador |
| `GET /api/eventos/{id}` | Devuelve un evento. | Administrador |
| `POST /api/eventos` | Crea un evento en una fecha concreta. | Administrador |
| `GET /api/aniversarios` | Lista los aniversarios (general y de jóvenes). | Administrador |

### 4.4 Filtros de `GET /api/personas`

Parámetros opcionales en la URL: `buscar`, `categoria` (`nuevo` o `miembro`), `sexo` (`M` o `F`), `edad_min`, `edad_max`, `estado_relacion`, `tiene_hijos` (`true` o `false`), `cargo_id`, `ministerio_id`, `canal_preferido`, `pagina` y `limite`.

Ejemplo: `GET /api/personas?sexo=F&edad_min=25&estado_relacion=casado`

### 4.5 Formato de las respuestas

```json
{ "datos": [ ], "total": 0, "pagina": 1, "limite": 20 }
```

```json
{ "error": "Mensaje de error", "detalles": ["el campo nombres es obligatorio"] }
```

Códigos HTTP usados: `200`, `201`, `400`, `401`, `404`, `409` y `500`.

## 5. Instalación y ejecución

**Requisitos:** Node.js (versión LTS), Git y PostgreSQL (con pgAdmin).

```bash
# 1. Clonar el repositorio
git clone https://github.com/[TU_USUARIO]/iglesia-api.git
cd iglesia-api

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos (pide la contraseña del usuario postgres)
psql -U postgres -c "CREATE DATABASE iglesia_db;"
psql -U postgres -d iglesia_db -f database/schema.sql
# Si 'psql' no se reconoce, usa pgAdmin: crea la base iglesia_db y ejecuta
# schema.sql en su Query Tool (clic derecho en la base > Query Tool).

# 4. Configurar las variables de entorno y reemplazar JWT_SECRET por una clave propia
copy .env.example .env

# 5. Crear el usuario administrador (se hace una sola vez)
node src/scripts/crear_admin.js

# 6. Iniciar el servidor
npm run dev
```

La API queda disponible en `http://localhost:3000/api`.

El proyecto implementa actualmente 22 de los 40 endpoints definidos (55%). Para iniciar sesión, usa
`POST /api/auth/login` con `{"correo":"...","password":"..."}`. Copia el token de la respuesta en
el encabezado `Authorization: Bearer <token>` para las demás peticiones. El script de administrador
solicita nombre, correo y contraseña de forma interactiva; nunca guardes contraseñas en archivos.

## 6. Estructura del proyecto

```text
iglesia-api/
├── src/
│   ├── server.js          # arranca el servidor
│   ├── app.js             # configura Express y las rutas
│   ├── config/            # conexión a la base de datos
│   ├── middlewares/       # autenticación y manejo de errores
│   ├── routes/            # definición de las URL
│   ├── controllers/       # lógica de cada endpoint
│   ├── utils/             # validaciones y utilidades
│   └── scripts/           # crear_admin.js
├── database/
│   └── schema.sql         # tablas y datos iniciales
├── test/                  # pruebas automáticas
├── docs/                  # documentación del proyecto
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 7. Base de datos

El archivo `database/schema.sql` crea, dentro de la base `iglesia_db`, las tablas: `usuarios`, `recuperaciones_password`, `cargos`, `ministerios`, `personas`, `hijos`, `persona_ministerio`, `servicios`, `eventos`, `aniversarios`, `asistencias`, `notificaciones`, `notificacion_destinatarios` y `configuracion`.

## 8. Estado del proyecto

- [x] Diseño de la base de datos
- [x] Documentación (descripción, perfiles y endpoints)
- [x] Endpoints implementados: 22 de 40 (55%)
- [ ] Endpoints de asistencia, notificaciones, reportes y panel
- [ ] Cliente web
- [ ] Pruebas con usuarios reales

## 9. Trabajo futuro

Alertas de inasistencia, talentos e instrumentos, envío automático de WhatsApp y SMS, roles adicionales (líder y encargado de asistencia), código QR y aplicación móvil.

## 10. Publicación en GitHub

Después de crear un repositorio vacío en GitHub, configura su dirección como remoto y publica la rama:

```bash
git init
git add .
git commit -m "Implementa el primer avance de la API"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/iglesia-api.git
git push -u origin main
```

No subas el archivo `.env`, contraseñas ni claves privadas.
