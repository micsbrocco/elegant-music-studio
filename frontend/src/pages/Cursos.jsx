import CatalogoCursos from '../components/CatalogoCursos';

function Cursos() {
  return (
    <div className="cursos-page">
      <section className="cursos-hero">
        <div className="container">
          <h1 className="font-display cursos-hero-titulo">
            Encontrá el curso <em className="italic-gold">ideal para vos.</em>
          </h1>
          <p className="text-muted cursos-hero-subtitulo">
            Producción, mezcla, mastering y grabación — aprendé con quienes lo hacen todos los días en el estudio.
          </p>
        </div>
      </section>

      <section className="section-cream cursos-lista-section">
        <div className="container">
          <CatalogoCursos estilo="moderno" conFiltros />
        </div>
      </section>
    </div>
  );
}

export default Cursos;