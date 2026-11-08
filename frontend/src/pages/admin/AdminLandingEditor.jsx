import { useState, useEffect, useRef } from 'react';
import { obtenerLandingRequest, actualizarLandingRequest, subirFotoLandingRequest } from '../../services/landingService';
import { SkeletonEditorLanding } from '../../components/Skeleton';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { useSitio } from '../../context/SitioContext';
import { DndContext, DragOverlay, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

function IconoX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconoBasura() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}
function IconoImagen() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function IconoExterno() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" />
    </svg>
  );
}


function IconoSubir() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
    </svg>
  );
}
function IconoLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
    </svg>
  );
}
function IconoCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Etiqueta de la portada: se edita escribiendo y se mueve arrastrando la manija
function ChipEtiqueta({ id, etiqueta, numero, onCambiar, onQuitar }) {
  // Las demás etiquetas no se corren mientras se arrastra (tienen anchos distintos
  // y se encimarían): la que está debajo del cursor muestra dónde va a caer.
  const { attributes, listeners, setNodeRef, isDragging, isOver, active, index, activeIndex } = useSortable({ id });
  const destino = isOver && active && active.id !== id ? (activeIndex < index ? 'despues' : 'antes') : '';
  return (
    <span
      ref={setNodeRef}
      className={`landing-chip ${isDragging ? 'landing-chip--origen' : ''} ${destino ? `landing-chip--destino-${destino}` : ''}`}
    >
      <span className="landing-chip-manija" {...attributes} {...listeners} aria-label={`Mover ${etiqueta}`}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2.5" r="1.4" /><circle cx="7.5" cy="2.5" r="1.4" />
          <circle cx="2.5" cy="7" r="1.4" /><circle cx="7.5" cy="7" r="1.4" />
          <circle cx="2.5" cy="11.5" r="1.4" /><circle cx="7.5" cy="11.5" r="1.4" />
        </svg>
      </span>
      <input
        type="text"
        value={etiqueta}
        onChange={(e) => onCambiar(e.target.value)}
        aria-label={`Etiqueta ${numero}`}
        size={Math.max(3, etiqueta.length)}
      />
      <button type="button" onClick={onQuitar} aria-label={`Quitar ${etiqueta}`}>
        <IconoX />
      </button>
    </span>
  );
}

function IconoMas() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  );
}

const SECCIONES = [
  { id: 'portada', titulo: 'Portada' },
  { id: 'producciones', titulo: 'Producciones' },
  { id: 'productor', titulo: 'Productor' },
  { id: 'equipo', titulo: 'Equipo' },
];
const MAX_PRODUCCIONES = 5; // 1 destacado + hasta 4 en la grilla de la home

function Campo({ etiqueta, children }) {
  return (
    <label className="landing-campo">
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

// Foto como mosaico: se ve la imagen y, al pasar el mouse, las acciones:
// subir un archivo, pegar un link o quitarla. El link se escribe en un campo
// que aparece debajo y se aplica recién al confirmar.
function MosaicoFoto({ valor, subiendo, onSubir, onCambiar, redonda = false, etiqueta }) {
  const [conLink, setConLink] = useState(false);
  const [borrador, setBorrador] = useState('');

  function abrirLink() {
    setBorrador(valor || '');
    setConLink(true);
  }
  function aplicarLink() {
    onCambiar(borrador.trim());
    setConLink(false);
  }

  return (
    <div className={`landing-foto ${redonda ? 'landing-foto--redonda' : ''}`}>
      <div className="landing-foto-imagen">
        {valor ? <img src={valor} alt="" /> : <span className="landing-foto-vacia"><IconoImagen /></span>}
        <div className="landing-foto-acciones">
          <label className="landing-foto-boton" title="Subir una imagen">
            <IconoSubir />
            {!redonda && <span>{subiendo ? 'Subiendo…' : valor ? 'Cambiar' : 'Subir'}</span>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onSubir} disabled={subiendo} className="admin-landing-archivo" />
          </label>
          <button type="button" className="landing-foto-boton landing-foto-boton--icono" onClick={abrirLink} title="Pegar un link" aria-label="Pegar un link">
            <IconoLink />
          </button>
          {valor && (
            <button type="button" className="landing-foto-boton landing-foto-boton--icono landing-foto-boton--quitar" onClick={() => onCambiar('')} title="Quitar foto" aria-label="Quitar foto">
              <IconoX />
            </button>
          )}
        </div>
      </div>
      {etiqueta && <span className="landing-foto-etiqueta">{etiqueta}</span>}
      {conLink && (
        <form className="landing-foto-link-panel" onSubmit={(e) => { e.preventDefault(); aplicarLink(); }}>
          <span className="landing-foto-link-icono"><IconoLink /></span>
          <input
            type="text"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setConLink(false); }}
            placeholder="Pegá el link de la imagen"
            aria-label="Link de la imagen"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          <button type="submit" className="landing-foto-link-ok" aria-label="Usar este link"><IconoCheck /></button>
          <button type="button" className="landing-foto-link-cancelar" onClick={() => setConLink(false)} aria-label="Cancelar"><IconoX /></button>
        </form>
      )}
    </div>
  );
}

function extraerIdYoutube(valor) {
  if (!valor) return '';
  const texto = valor.trim();
  const patrones = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) return match[1];
  }
  return texto; // asumimos que ya nos pasaron el ID directamente
}


// Interruptor "Próximamente": con "Próximamente", el público solo ve la landing
// (sin catálogo, cursos, carrito ni registro). El admin y los instructores ven
// todo igual, y quien ya compró un curso lo sigue cursando.
function InterruptorProximamente() {
  const { proximamente, cambiarProximamente } = useSitio();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function cambiar(id) {
    const valor = id === 'proximamente';
    if (valor === proximamente || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await cambiarProximamente(valor);
    } catch {
      setError('No se pudo cambiar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="landing-interruptor">
      <span className="landing-interruptor-etiqueta">Cursos</span>
      <FiltroSegmentado
        className={`landing-interruptor-seg landing-interruptor-seg--${proximamente ? 'proximamente' : 'abiertos'}`}
        etiqueta="Cursos en el sitio"
        opciones={[{ id: 'abiertos', etiqueta: 'Abiertos' }, { id: 'proximamente', etiqueta: 'Próximamente' }]}
        valor={proximamente ? 'proximamente' : 'abiertos'}
        onCambiar={cambiar}
      />
      {error && <span className="landing-interruptor-error">{error}</span>}
    </div>
  );
}

function AdminLandingEditor() {
  const [contenido, setContenido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [subiendoClave, setSubiendoClave] = useState(null);
  const [errorSubida, setErrorSubida] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('portada');

  useEffect(() => {
    obtenerLandingRequest()
      // Por si ya había contenido guardado desde antes de que existieran las
      // etiquetas del hero, nos aseguramos de que el array siempre exista.
      // El carrusel tiene 5 fotos: si había menos guardadas, se agregan lugares vacíos
      .then((data) => setContenido({
        heroEtiquetas: [],
        ...data,
        heroFotos: [...(data.heroFotos || []), '', '', '', '', ''].slice(0, Math.max(5, data.heroFotos?.length || 0)),
      }))
      .catch(() => setError('No se pudo cargar el contenido actual de la landing'))
      .finally(() => setCargando(false));
  }, []);

  function actualizarHeroFoto(i, valor) {
    setContenido((prev) => {
      const heroFotos = [...prev.heroFotos];
      heroFotos[i] = valor;
      return { ...prev, heroFotos };
    });
  }

  // Sube el archivo elegido y le pasa la URL resultante a "aplicar".
  // "clave" identifica qué foto se está subiendo (para el cartel "Subiendo...").
  async function subirFoto(clave, e, aplicar) {
    const archivo = e.target.files[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo más tarde
    if (!archivo) return;

    setErrorSubida('');
    setSubiendoClave(clave);
    try {
      const { url } = await subirFotoLandingRequest(archivo);
      aplicar(url);
    } catch (err) {
      setErrorSubida(err.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setSubiendoClave(null);
    }
  }

  function actualizarEtiqueta(i, valor) {
    setContenido((prev) => {
      const heroEtiquetas = [...prev.heroEtiquetas];
      heroEtiquetas[i] = valor;
      return { ...prev, heroEtiquetas };
    });
  }

  function agregarEtiqueta() {
    setContenido((prev) => ({ ...prev, heroEtiquetas: [...prev.heroEtiquetas, ''] }));
  }

  // Arrastrar etiquetas para cambiarlas de lugar
  const [etiquetaArrastrada, setEtiquetaArrastrada] = useState(null);
  const sensoresEtiquetas = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function moverEtiqueta({ active, over }) {
    if (!over || active.id === over.id) return;
    const desde = Number(String(active.id).slice(4));
    const hasta = Number(String(over.id).slice(4));
    setContenido((prev) => ({ ...prev, heroEtiquetas: arrayMove(prev.heroEtiquetas, desde, hasta) }));
  }

  function eliminarEtiqueta(i) {
    setContenido((prev) => ({
      ...prev,
      heroEtiquetas: prev.heroEtiquetas.filter((_, idx) => idx !== i),
    }));
  }

  function actualizarProduccion(i, campo, valor) {
    setContenido((prev) => {
      const producciones = prev.producciones.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p));
      return { ...prev, producciones };
    });
  }

  // La landing tiene lugar para 1 video destacado (el primero, fijo) más
  // hasta 3 videos secundarios en la grilla de abajo: 4 en total.
  function agregarProduccion() {
    setContenido((prev) => ({
      ...prev,
      producciones: [...prev.producciones, { id: '', titulo: '', descripcion: '' }],
    }));
  }

  function eliminarProduccion(i) {
    if (i === 0) return; // el video destacado no se puede quitar
    setContenido((prev) => ({
      ...prev,
      producciones: prev.producciones.filter((_, idx) => idx !== i),
    }));
  }

  function actualizarProductor(campo, valor) {
    setContenido((prev) => ({ ...prev, productorPrincipal: { ...prev.productorPrincipal, [campo]: valor } }));
  }

  function actualizarEquipo(i, campo, valor) {
    setContenido((prev) => {
      const equipo = prev.equipo.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p));
      return { ...prev, equipo };
    });
  }

  function agregarIntegrante() {
    setContenido((prev) => ({
      ...prev,
      equipo: [...prev.equipo, { nombre: '', rol: '', bio: '', foto: '' }],
    }));
  }

  function eliminarIntegrante(i) {
    setContenido((prev) => ({
      ...prev,
      equipo: prev.equipo.filter((_, idx) => idx !== i),
    }));
  }

  // ---------- Guardado ----------
  // Los cambios se guardan con el botón "Guardar cambios" (no solos).
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [guardadoRecien, setGuardadoRecien] = useState(false);
  const [guardadoJson, setGuardadoJson] = useState(null); // lo último guardado, para saber si hay cambios

  useEffect(() => {
    if (contenido && guardadoJson === null) setGuardadoJson(JSON.stringify(contenido));
  }, [contenido, guardadoJson]);

  const hayCambios = Boolean(contenido) && guardadoJson !== null && JSON.stringify(contenido) !== guardadoJson;

  async function guardar() {
    if (!hayCambios || guardando) return;
    setGuardando(true);
    setErrorGuardado('');
    try {
      await actualizarLandingRequest(contenido);
      setGuardadoJson(JSON.stringify(contenido));
      setGuardadoRecien(true);
      setTimeout(() => setGuardadoRecien(false), 2500);
    } catch (err) {
      setErrorGuardado(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  function descartar() {
    if (guardadoJson) setContenido(JSON.parse(guardadoJson));
    setErrorGuardado('');
  }

  // Aviso del navegador si se cierra la pestaña con cambios sin guardar
  const hayCambiosRef = useRef(false);
  hayCambiosRef.current = hayCambios;
  useEffect(() => {
    function antesDeCerrar(e) {
      if (hayCambiosRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', antesDeCerrar);
    return () => window.removeEventListener('beforeunload', antesDeCerrar);
  }, []);

  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  function handleAgregarEtiqueta(e) {
    e.preventDefault();
    const texto = nuevaEtiqueta.trim();
    if (!texto) return;
    setContenido((prev) => ({ ...prev, heroEtiquetas: [...prev.heroEtiquetas.filter((t) => t.trim()), texto] }));
    setNuevaEtiqueta('');
  }

  if (cargando) return <SkeletonEditorLanding />;
  if (!contenido) return <div className="admin-dash-estado admin-dash-estado--error">{error || 'No se pudo cargar el contenido'}</div>;

  return (
    <div className="editor-curso-page landing-editor">
      <header className="editor-encabezado">
        <div className="editor-encabezado-texto">
          <div className="editor-encabezado-titulo">
            <h2>Página de inicio</h2>
          </div>
        </div>
        <div className="landing-encabezado-derecha">
          <InterruptorProximamente />
          <div className="editor-encabezado-acciones">
            {errorGuardado && <span className="landing-guardar-error" role="alert">{errorGuardado}</span>}
            {hayCambios && !guardando && (
              <button type="button" className="landing-descartar" onClick={descartar}>Descartar</button>
            )}
            <button
              type="button"
              className={`landing-guardar ${hayCambios ? 'landing-guardar--activo' : ''}`}
              onClick={guardar}
              disabled={!hayCambios || guardando}
            >
              {guardando ? 'Guardando…' : hayCambios ? 'Guardar cambios' : (
                <><IconoCheck /> {guardadoRecien ? 'Guardado' : 'Sin cambios'}</>
              )}
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="editor-curso-ver-como-alumno">
              Ver página
              <IconoExterno />
            </a>
          </div>
        </div>
      </header>

      <div className="editor-curso-tabs-top" role="tablist">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={seccionActiva === s.id}
            className={`editor-curso-tab-top ${seccionActiva === s.id ? 'activo' : ''}`}
            onClick={() => setSeccionActiva(s.id)}
          >
            {s.titulo}
          </button>
        ))}
      </div>

      {errorSubida && <div className="admin-landing-error admin-landing-error--bloque">{errorSubida}</div>}

      {seccionActiva === 'portada' && (
        <>
          <section className="admin-card landing-seccion">
            <h3 className="landing-seccion-titulo">Fotos</h3>
            <div className="landing-fotos-grid landing-fotos-grid--portada">
              {contenido.heroFotos.map((foto, i) => (
                <MosaicoFoto
                  key={i}
                  valor={foto}
                  etiqueta={`Foto ${i + 1}`}
                  subiendo={subiendoClave === `hero-${i}`}
                  onSubir={(e) => subirFoto(`hero-${i}`, e, (url) => actualizarHeroFoto(i, url))}
                  onCambiar={(v) => actualizarHeroFoto(i, v)}
                />
              ))}
            </div>
          </section>

          <section className="admin-card landing-seccion">
            <h3 className="landing-seccion-titulo">Etiquetas</h3>
            <div className="landing-chips">
              <DndContext
                sensors={sensoresEtiquetas}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setEtiquetaArrastrada(Number(String(active.id).slice(4)))}
                onDragEnd={(e) => { setEtiquetaArrastrada(null); moverEtiqueta(e); }}
                onDragCancel={() => setEtiquetaArrastrada(null)}
              >
                <SortableContext items={contenido.heroEtiquetas.map((_, i) => `etq-${i}`)} strategy={() => null}>
                  {contenido.heroEtiquetas.map((etiqueta, i) => (
                    <ChipEtiqueta
                      key={`etq-${i}`}
                      id={`etq-${i}`}
                      etiqueta={etiqueta}
                      numero={i + 1}
                      onCambiar={(valor) => actualizarEtiqueta(i, valor)}
                      onQuitar={() => eliminarEtiqueta(i)}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {etiquetaArrastrada !== null && (
                    <span className="landing-chip landing-chip--flotante">
                      <span className="landing-chip-manija">
                        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                          <circle cx="2.5" cy="2.5" r="1.4" /><circle cx="7.5" cy="2.5" r="1.4" />
                          <circle cx="2.5" cy="7" r="1.4" /><circle cx="7.5" cy="7" r="1.4" />
                          <circle cx="2.5" cy="11.5" r="1.4" /><circle cx="7.5" cy="11.5" r="1.4" />
                        </svg>
                      </span>
                      <span className="landing-chip-texto">{contenido.heroEtiquetas[etiquetaArrastrada]}</span>
                    </span>
                  )}
                </DragOverlay>
              </DndContext>
              <form className="landing-chip-nueva" onSubmit={handleAgregarEtiqueta}>
                <input
                  type="text"
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  placeholder="+ Nueva etiqueta"
                  aria-label="Nueva etiqueta"
                />
              </form>
            </div>
          </section>
        </>
      )}

      {seccionActiva === 'producciones' && (
        <section className="admin-card landing-seccion">
          <div className="landing-seccion-cabecera">
            <h3 className="landing-seccion-titulo">Videos <span>({contenido.producciones.length} de {MAX_PRODUCCIONES})</span></h3>
            {contenido.producciones.length < MAX_PRODUCCIONES && (
              <button type="button" className="admin-boton-primario landing-boton" onClick={agregarProduccion}>
                <IconoMas />
                Agregar video
              </button>
            )}
          </div>
          <div className="landing-videos">
            {contenido.producciones.map((produccion, i) => (
              <div key={i} className="landing-video">
                <div className="landing-video-miniatura">
                  {produccion.id ? (
                    <img src={`https://img.youtube.com/vi/${produccion.id}/mqdefault.jpg`} alt="" />
                  ) : (
                    <span className="landing-foto-vacia"><IconoImagen /></span>
                  )}
                  {i === 0 && <span className="landing-video-destacado">Destacado</span>}
                </div>
                <div className="landing-video-campos">
                  <Campo etiqueta="Link de YouTube">
                    <input
                      type="text"
                      value={produccion.id}
                      onChange={(e) => actualizarProduccion(i, 'id', extraerIdYoutube(e.target.value))}
                      className="admin-input"
                      placeholder="https://youtube.com/..."
                    />
                  </Campo>
                  <Campo etiqueta="Título">
                    <input type="text" value={produccion.titulo} onChange={(e) => actualizarProduccion(i, 'titulo', e.target.value)} className="admin-input" />
                  </Campo>
                  <Campo etiqueta="Descripción">
                    <input type="text" value={produccion.descripcion} onChange={(e) => actualizarProduccion(i, 'descripcion', e.target.value)} className="admin-input" />
                  </Campo>
                </div>
                {i > 0 && (
                  <button type="button" className="landing-borrar" onClick={() => eliminarProduccion(i)} aria-label={`Eliminar video ${i + 1}`} title="Eliminar">
                    <IconoBasura />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {seccionActiva === 'productor' && (
        <section className="admin-card landing-seccion">
          <div className="landing-persona landing-persona--grande">
            <MosaicoFoto
              redonda
              valor={contenido.productorPrincipal.foto}
              subiendo={subiendoClave === 'productor'}
              onSubir={(e) => subirFoto('productor', e, (url) => actualizarProductor('foto', url))}
              onCambiar={(v) => actualizarProductor('foto', v)}
            />
            <div className="landing-persona-campos">
              <div className="landing-dos-col">
                <Campo etiqueta="Nombre">
                  <input type="text" value={contenido.productorPrincipal.nombre} onChange={(e) => actualizarProductor('nombre', e.target.value)} className="admin-input" />
                </Campo>
                <Campo etiqueta="Rol">
                  <input type="text" value={contenido.productorPrincipal.rol} onChange={(e) => actualizarProductor('rol', e.target.value)} className="admin-input" />
                </Campo>
              </div>
              <Campo etiqueta="Bio">
                <textarea value={contenido.productorPrincipal.bio} onChange={(e) => actualizarProductor('bio', e.target.value)} className="admin-input" rows={4} />
              </Campo>
            </div>
          </div>
        </section>
      )}

      {seccionActiva === 'equipo' && (
        <section className="admin-card landing-seccion">
          <div className="landing-seccion-cabecera">
            <h3 className="landing-seccion-titulo">Integrantes <span>({contenido.equipo.length})</span></h3>
            <button type="button" className="admin-boton-primario landing-boton" onClick={agregarIntegrante}>
              <IconoMas />
              Agregar integrante
            </button>
          </div>
          <div className="landing-equipo">
            {contenido.equipo.map((persona, i) => (
              <div key={i} className="landing-persona">
                <MosaicoFoto
                  redonda
                  valor={persona.foto}
                  subiendo={subiendoClave === `equipo-${i}`}
                  onSubir={(e) => subirFoto(`equipo-${i}`, e, (url) => actualizarEquipo(i, 'foto', url))}
                  onCambiar={(v) => actualizarEquipo(i, 'foto', v)}
                />
                <div className="landing-persona-campos">
                  <div className="landing-dos-col">
                    <Campo etiqueta="Nombre">
                      <input type="text" value={persona.nombre} onChange={(e) => actualizarEquipo(i, 'nombre', e.target.value)} className="admin-input" />
                    </Campo>
                    <Campo etiqueta="Rol">
                      <input type="text" value={persona.rol} onChange={(e) => actualizarEquipo(i, 'rol', e.target.value)} className="admin-input" />
                    </Campo>
                  </div>
                  <Campo etiqueta="Bio">
                    <textarea value={persona.bio} onChange={(e) => actualizarEquipo(i, 'bio', e.target.value)} className="admin-input" rows={2} />
                  </Campo>
                </div>
                <button type="button" className="landing-borrar" onClick={() => eliminarIntegrante(i)} aria-label={`Eliminar a ${persona.nombre || 'este integrante'}`} title="Eliminar">
                  <IconoBasura />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminLandingEditor;
