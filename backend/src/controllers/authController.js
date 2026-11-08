const bcrypt = require('bcrypt');
const { registrarActividad } = require('../utils/actividad');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { OAuth2Client } = require('google-auth-library');
const { enviarEmail, plantillaEmail } = require('../config/email');
const { iniciarSesion, renovarSesion, cerrarSesion, cerrarSesionesDeUsuario } = require('../utils/sesion');
const { errorPassword } = require('../utils/password');
const { modoProximamente, responderCerrado } = require('../utils/modoSitio');

const clienteGoogle = new OAuth2Client();

// Base de los links que van en los emails. En producción se define en el .env.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function registrar(req, res) {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Validación básica
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const errorPass = errorPassword(password);
    if (errorPass) return res.status(400).json({ error: errorPass });

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // Hashear la contraseña (nunca se guarda en texto plano)
        const passwordHasheada = await bcrypt.hash(password, 10);

    // Token de confirmación de cuenta: mismo mecanismo que el de recuperar contraseña,
    // pero vale más tiempo (24hs en vez de 1 hora).
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const expiraVerificacion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: passwordHasheada,
        rol: 'alumno',
        verificacionToken: tokenVerificacion,
        verificacionExpira: expiraVerificacion,
      },
    });

    const linkVerificacion = `${FRONTEND_URL}/verificar-email?token=${tokenVerificacion}`;

    await enviarEmail({
      to: nuevoUsuario.email,
      subject: 'Confirmá tu cuenta - Elegant Music Studio',
      html: plantillaEmail({
        titulo: `Hola ${nuevoUsuario.nombre}, ¡ya casi estás!`,
        parrafos: [
          'Gracias por registrarte en Elegant Music Studio. Confirmá tu cuenta para poder iniciar sesión.',
        ],
        textoBoton: 'Confirmar mi cuenta',
        urlBoton: linkVerificacion,
        notaFinal: 'Este link vale por 24 horas. Si no creaste esta cuenta, podés ignorar este email.',
      }),
    });

    const { password: _, verificacionToken: __, ...usuarioSinPassword } = nuevoUsuario;

    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Buscar el usuario por email
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar el password ingresado contra el hash guardado
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.emailVerificado) {
      return res.status(403).json({ error: 'Tenés que confirmar tu email antes de iniciar sesión' });
    }

    // Generar el token JWT
    // Iniciar sesión cuenta como actividad (y reactiva al alumno si estaba inactivo)
    registrarActividad(usuario.id, { forzar: true });

    const token = await iniciarSesion(req, res, usuario);

    const { password: _, resetPasswordToken: __, resetPasswordExpires: ___, ...usuarioSinPassword } = usuario;

    res.json({ usuario: usuarioSinPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

async function solicitarRecuperacion(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Por seguridad, respondemos igual aunque el email no exista
    // (así no revelamos qué emails están registrados)
    if (!usuario) {
      return res.json({ mensaje: 'Si el email existe, se envió un link de recuperación' });
    }

    // Generar un token aleatorio y seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // vale 1 hora

    await prisma.usuario.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expira,
      },
    });

        const linkRecuperacion = `${FRONTEND_URL}/resetear-password?token=${token}`;

    await enviarEmail({
      to: usuario.email,
      subject: 'Recuperá tu contraseña - Elegant Music Studio',
      html: plantillaEmail({
        titulo: `Hola ${usuario.nombre}`,
        parrafos: [
          'Pediste recuperar tu contraseña. Hacé clic en el botón para elegir una nueva.',
        ],
        textoBoton: 'Restablecer contraseña',
        urlBoton: linkRecuperacion,
        notaFinal: 'Este link expira en 1 hora. Si no fuiste vos, podés ignorar este email.',
      }),
    });

    res.json({ mensaje: 'Si el email existe, se envió un link de recuperación' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al solicitar recuperación' });
  }
}

async function resetearPassword(req, res) {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
    }
    const errorPass = errorPassword(nuevaPassword);
    if (errorPass) return res.status(400).json({ error: errorPass });

    const usuario = await prisma.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }, // que no haya expirado
      },
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const passwordHasheada = await bcrypt.hash(nuevaPassword, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: passwordHasheada,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    // Con la contraseña nueva, se cierran las sesiones abiertas en otros dispositivos
    await cerrarSesionesDeUsuario(usuario.id);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear la contraseña' });
  }
}

async function verificarEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Falta el token de verificación' });
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        verificacionToken: token,
        verificacionExpira: { gt: new Date() },
      },
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        verificacionToken: null,
        verificacionExpira: null,
      },
    });

    res.json({ mensaje: 'Email verificado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar el email' });
  }
}

// Login / registro con Google. El frontend manda el "credential" (un ID token firmado
// por Google); acá se verifica contra Google y recién ahí se confía en el email.
async function loginConGoogle(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Falta la credencial de Google' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'El acceso con Google no está configurado' });
    }

    let datos;
    try {
      const ticket = await clienteGoogle.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      datos = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'No se pudo verificar tu cuenta de Google' });
    }

    if (!datos || !datos.email || !datos.email_verified) {
      return res.status(401).json({ error: 'Tu cuenta de Google no tiene el email verificado' });
    }

    const email = datos.email.toLowerCase();
    let usuario = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!usuario) {
      // En "Próximamente" no se crean cuentas nuevas (las existentes entran igual)
      if (await modoProximamente()) return responderCerrado(res);
      // Cuenta nueva: la contraseña queda como un hash aleatorio que nadie conoce.
      // Si después quiere una, puede usar "¿Olvidaste tu clave?".
      const passwordAleatoria = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      usuario = await prisma.usuario.create({
        data: {
          nombre: datos.given_name || datos.name || email.split('@')[0],
          apellido: datos.family_name || '',
          email,
          password: passwordAleatoria,
          rol: 'alumno',
          emailVerificado: true,
          fotoPerfil: datos.picture || null,
        },
      });
    } else {
      // Cuenta existente: Google ya verificó el email, así que se da por confirmado.
      const cambios = {};
      if (!usuario.emailVerificado) {
        cambios.emailVerificado = true;
        cambios.verificacionToken = null;
        cambios.verificacionExpira = null;
      }
      if (!usuario.fotoPerfil && datos.picture) cambios.fotoPerfil = datos.picture;
      if (Object.keys(cambios).length > 0) {
        usuario = await prisma.usuario.update({ where: { id: usuario.id }, data: cambios });
      }
    }

    // Iniciar sesión cuenta como actividad (y reactiva al alumno si estaba inactivo)
    registrarActividad(usuario.id, { forzar: true });

    const token = await iniciarSesion(req, res, usuario);

    const {
      password: _,
      resetPasswordToken: __,
      resetPasswordExpires: ___,
      verificacionToken: ____,
      verificacionExpira: _____,
      ...usuarioSinPassword
    } = usuario;

    res.json({ usuario: usuarioSinPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión con Google' });
  }
}

// El navegador manda la cookie de sesión y recibe un token de acceso nuevo.
// Se usa al abrir la página y cada vez que el token de acceso vence.
async function renovar(req, res) {
  try {
    const resultado = await renovarSesion(req, res);
    if (!resultado) {
      return res.status(401).json({ error: 'Tu sesión venció. Volvé a iniciar sesión.', codigo: 'SESION_VENCIDA' });
    }
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo renovar la sesión' });
  }
}

async function logout(req, res) {
  try {
    await cerrarSesion(req, res);
    res.json({ mensaje: 'Sesión cerrada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo cerrar la sesión' });
  }
}

module.exports = { renovar, logout, registrar, login, loginConGoogle, solicitarRecuperacion, resetearPassword, verificarEmail };