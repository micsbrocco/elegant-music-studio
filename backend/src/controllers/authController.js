const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');

async function registrar(req, res) {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Validación básica
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    // Hashear la contraseña (nunca se guarda en texto plano)
    const passwordHasheada = await bcrypt.hash(password, 10);

    // Crear el usuario en la base
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: passwordHasheada,
        rol: 'alumno', // por defecto, todos se registran como alumno
      },
    });

    // No devolvemos la contraseña en la respuesta
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;

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

    // Generar el token JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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

    // Acá, en un sistema real, se enviaría un email con este link.
    // Por ahora (MVP), lo simulamos mostrándolo en la consola del servidor.
    const linkRecuperacion = `http://localhost:5173/resetear-password?token=${token}`;
    console.log('🔗 Link de recuperación (simulado):', linkRecuperacion);

    res.json({
      mensaje: 'Si el email existe, se envió un link de recuperación',
      linkSimulado: linkRecuperacion, // esto lo dejamos para poder probarlo fácil; se puede sacar más adelante
    });
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

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear la contraseña' });
  }
}

module.exports = { registrar, login, solicitarRecuperacion, resetearPassword };