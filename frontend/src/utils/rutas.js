// A dónde va cada usuario apenas inicia sesión (con email o con Google).
// Alumnos e instructores entran directo a "Mis cursos"; el admin, a su panel (dashboard).
export function rutaInicioSegunRol(usuario) {
  if (usuario?.rol === 'admin') return '/admin';
  if (usuario?.rol === 'alumno' || usuario?.rol === 'profesor') return '/mis-cursos';
  return '/';
}
