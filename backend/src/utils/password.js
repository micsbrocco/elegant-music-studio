// Reglas para contraseñas nuevas (registro, cambio y recuperación).
// Las cuentas que ya existían con contraseñas más cortas pueden seguir entrando;
// la regla se aplica la próxima vez que la cambien.
function errorPassword(password) {
  const texto = String(password || '');
  if (texto.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  // bcrypt solo tiene en cuenta los primeros 72 bytes
  if (Buffer.byteLength(texto) > 72) return 'La contraseña es demasiado larga (máximo 72 caracteres)';
  if (!/[a-zA-ZñÑáéíóúÁÉÍÓÚ]/.test(texto) || !/\d/.test(texto)) {
    return 'La contraseña tiene que tener letras y números';
  }
  return null;
}

module.exports = { errorPassword };
