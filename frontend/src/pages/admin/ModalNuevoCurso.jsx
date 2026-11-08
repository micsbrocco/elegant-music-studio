import { useState, useEffect, useRef } from 'react';
import { crearCursoRequest } from '../../services/cursoService';

// Ventanita para crear un curso: solo título y categoría. El curso se crea
// como borrador y se abre directo en el editor, en "Contenido", para empezar
// a cargar módulos y clases. Todo lo demás (descripción, portada, precio...)
// se completa después en el editor, que guarda solo.
function ModalNuevoCurso({ categorias, onCerrar, onCreado }) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaNueva, setCategoriaNueva] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const inputTitulo = useRef(null);

  useEffect(() => {
    inputTitulo.current?.focus();
    function alTeclear(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  // Sin categorías cargadas todavía, se escribe una nueva directamente
  const escribiendoCategoria = categoriaNueva || categorias.length === 0;
  const puedeCrear = titulo.trim() && categoria.trim() && !creando;

  async function handleCrear(e) {
    e.preventDefault();
    if (!puedeCrear) return;
    setCreando(true);
    setError('');
    try {
      const curso = await crearCursoRequest({ titulo: titulo.trim(), categoria: categoria.trim() });
      onCreado(curso);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el curso');
      setCreando(false);
    }
  }

  return (
    <div className="admin-modal-fondo" onClick={onCerrar}>
      <form
        className="admin-modal modal-nuevo-curso"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-curso-titulo"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleCrear}
      >
        <div className="admin-modal-head">
          <div>
            <h3 id="nuevo-curso-titulo" className="admin-modal-titulo">Nuevo curso</h3>
            <p className="modal-nuevo-curso-sub">Empezá con lo básico. El resto lo completás después, mientras armás el contenido.</p>
          </div>
          <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <label className="modal-nuevo-curso-campo">
          <span>Título del curso</span>
          <input
            ref={inputTitulo}
            type="text"
            className="admin-input"
            placeholder="Ej: Mezcla y masterización desde cero"
            value={titulo}
            maxLength={120}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>

        <div className="modal-nuevo-curso-campo">
          <span id="nuevo-curso-categoria">Categoría</span>
          {!escribiendoCategoria ? (
            <div className="modal-nuevo-curso-chips" role="radiogroup" aria-labelledby="nuevo-curso-categoria">
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={categoria === c}
                  className={`modal-nuevo-curso-chip ${categoria === c ? 'activo' : ''}`}
                  onClick={() => setCategoria(c)}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                className="modal-nuevo-curso-chip modal-nuevo-curso-chip--nueva"
                onClick={() => { setCategoriaNueva(true); setCategoria(''); }}
              >
                + Nueva categoría
              </button>
            </div>
          ) : (
            <div className="modal-nuevo-curso-nueva">
              <input
                type="text"
                className="admin-input"
                placeholder="Nombre de la categoría"
                value={categoria}
                maxLength={40}
                autoFocus={categorias.length > 0}
                onChange={(e) => setCategoria(e.target.value)}
              />
              {categorias.length > 0 && (
                <button type="button" className="admin-tabla-accion" onClick={() => { setCategoriaNueva(false); setCategoria(''); }}>
                  Elegir existente
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="modal-nuevo-curso-error">{error}</p>}

        <div className="admin-modal-acciones">
          <p className="modal-nuevo-curso-nota">Se guarda como borrador: nadie lo ve hasta que lo publiques.</p>
          <button type="button" className="admin-tabla-accion" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="admin-boton-primario modal-nuevo-curso-crear" disabled={!puedeCrear}>
            {creando ? 'Creando…' : 'Crear y agregar contenido'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModalNuevoCurso;
