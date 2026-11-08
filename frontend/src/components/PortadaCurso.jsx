// Portada de un curso: si tiene imagen cargada se muestra esa; si no, se arma
// un fondo oscuro con un degradé elegido según la categoría (siempre el mismo
// para la misma categoría) y un ícono musical en dorado, para que nunca quede vacío.
const PALETAS = [
  ['#1c1a17', '#5a4512'], // bronce
  ['#14161c', '#2f3a52'], // medianoche
  ['#1d1418', '#5b2a3a'], // vino
  ['#121a18', '#24483f'], // bosque
  ['#1a1720', '#45365e'], // ciruela
];

function paletaPara(texto = '') {
  let suma = 0;
  for (const letra of texto.toLowerCase()) suma = (suma + letra.charCodeAt(0)) % 997;
  return PALETAS[suma % PALETAS.length];
}

function PortadaCurso({ curso, className = '' }) {
  if (curso.imagenPortada) {
    return (
      <div className={`portada-curso ${className}`}>
        <img src={curso.imagenPortada} alt="" loading="lazy" />
      </div>
    );
  }

  const [desde, hasta] = paletaPara(curso.categoria || curso.titulo);
  return (
    <div
      className={`portada-curso portada-curso--generada ${className}`}
      style={{ background: `radial-gradient(circle at 80% 15%, rgba(201,162,39,0.28), transparent 55%), linear-gradient(135deg, ${desde}, ${hasta})` }}
      aria-hidden="true"
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  );
}

export default PortadaCurso;
