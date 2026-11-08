# Elegant Music Studio — plataforma de cursos

Plataforma web para vender y cursar cursos online de producción musical, mezcla y mastering. Fue desarrollada como Práctica Profesionalizante (PPS) de la Tecnicatura en Programación (UTN-FRT), con un cliente real: Elegant Music Studio.

Un alumno puede explorar el catálogo, comprar cursos, verlos en un portal de aprendizaje con seguimiento de progreso, rendir cuestionarios y obtener un certificado en PDF. El equipo del estudio administra cursos, contenidos, alumnos, instructores, ventas y la landing desde un panel propio.

## Funcionalidades

**Para el alumno**
- Catálogo de cursos, detalle de curso, carrito y favoritos (el carrito funciona también como invitado).
- Registro con verificación por email, inicio de sesión y recuperación de contraseña.
- Portal «Mis cursos» y portal de aprendizaje con videos, texto enriquecido, archivos descargables y cuestionarios, en modo claro y oscuro.
- Progreso por clase y certificado en PDF al completar el curso.
- Perfil con foto.

**Para el equipo (panel de administración)**
- Dashboard con métricas, ventas por curso y por período.
- Editor de cursos: módulos y clases con arrastrar y soltar, hasta 3 bloques por clase (texto o cuestionario), preguntas con explicaciones y estado de publicación (activo, oculto, borrador).
- Gestión de alumnos e instructores, con reportes exportables a Excel.
- Editor de la landing: imágenes, etiquetas, producciones, productor y equipo (con subida de fotos).

**Roles**
- `admin`: acceso completo.
- `profesor`: instructor con acceso a los cursos que se le asignan o que crea, sin acceso al dashboard general.
- `alumno`: acceso al catálogo y a sus cursos.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, dnd-kit |
| Backend | Node.js, Express 5, JWT, bcrypt, Multer |
| Base de datos | PostgreSQL con Prisma 7 (adaptador `pg`) |
| Archivos | Supabase Storage (fotos de perfil, certificados y archivos de clases) |
| Emails | Nodemailer con Gmail |
| Documentos | PDFKit (certificados) y ExcelJS (reportes) |

## Estructura

```
plataforma-cursos/
├── backend/
│   ├── prisma/            # schema.prisma y migraciones
│   ├── src/
│   │   ├── config/        # prisma, supabase, email
│   │   ├── controllers/   # lógica de cada recurso
│   │   ├── middlewares/   # autenticación y subida de archivos
│   │   ├── routes/        # rutas de la API
│   │   └── utils/         # permisos por curso
│   ├── server.js          # punto de entrada
│   └── prisma7.config.ts  # configuración de Prisma (URL de la base)
└── frontend/
    └── src/
        ├── components/    # Navbar, Footer, Skeleton, catálogo…
        ├── context/       # sesión del usuario
        ├── pages/         # pantallas del alumno
        │   └── admin/     # panel de administración
        ├── services/      # llamadas a la API
        └── styles/        # estilos por sección (ui-variables.css = sistema de diseño)
```

## Puesta en marcha

### Requisitos
- Node.js 20 o superior
- Una base PostgreSQL (local, Supabase o Neon)
- Un proyecto de Supabase con los buckets de Storage usados por la app
- Una cuenta de Gmail con contraseña de aplicación, para los emails

### 1. Backend

```bash
cd backend
npm install
```

Creá un archivo `backend/.env`:

```env
DATABASE_URL=postgresql://usuario:clave@host:5432/base
JWT_SECRET=una_clave_larga_y_secreta
PORT=3001

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key

EMAIL_USER=tu_cuenta@gmail.com
EMAIL_APP_PASSWORD=contraseña_de_aplicación
EMAIL_FROM_NAME=Elegant Music Studio
```

Aplicá las migraciones y generá el cliente de Prisma:

```bash
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

Iniciá el servidor:

```bash
npm run dev     # con recarga automática
npm start       # modo normal
```

La API queda en `http://localhost:3001/api`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`. La URL de la API está definida en `frontend/src/services/api.js`; hay que cambiarla al desplegar.

## API

Todas las rutas cuelgan de `/api`. Las rutas protegidas esperan el encabezado `Authorization: Bearer <token>`.

| Prefijo | Recurso |
| --- | --- |
| `/auth` | registro, login, verificación de email y recuperación de contraseña |
| `/cursos` | catálogo y administración de cursos |
| `/modulos`, `/contenidos`, `/bloques`, `/preguntas` | estructura y contenido de los cursos |
| `/inscripciones`, `/carrito`, `/favoritos` | compra y listas del alumno |
| `/progreso`, `/certificados` | avance y certificados |
| `/usuarios` | perfil, alumnos e instructores |
| `/reportes` | métricas y reportes del panel |
| `/landing` | contenido editable de la landing |

## Modelo de datos

Base relacional normalizada (3FN) con las entidades `Usuario`, `Curso`, `CursoColaborador`, `Modulo`, `Contenido` (clase), `Bloque`, `ArchivoContenido`, `Pregunta`, `RespuestaPregunta`, `Inscripcion`, `Pago`, `Progreso`, `Certificado`, `CarritoItem`, `Favorito` y `ConfiguracionLanding`. El esquema completo está en `backend/prisma/schema.prisma`.

## Estado del proyecto

Pendiente: integración real de pagos con Mercado Pago, inicio de sesión con Google, comentarios en las clases y monitoreo de almacenamiento en el panel.

## Autoría

Desarrollado por Mica Sbrocco como proyecto final de la Tecnicatura en Programación, UTN-FRT.
