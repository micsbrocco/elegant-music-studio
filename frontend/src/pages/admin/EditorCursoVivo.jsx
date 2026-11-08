import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCenter, closestCorners, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';
import {
  obtenerCursoRequest, editarCursoRequest, subirFotoCursoRequest, cambiarEstadoCursoRequest,
  solicitarPublicacionRequest, devolverCursoRequest, listarCategoriasRequest, listarMensajesRevisionRequest, actualizarMensajeRevisionRequest,
  agregarColaboradorCursoRequest, actualizarColaboradorCursoRequest, quitarColaboradorCursoRequest,
} from '../../services/cursoService';
import {
  crearModuloRequest, editarModuloRequest, eliminarModuloRequest, reordenarModulosLoteRequest,
} from '../../services/moduloService';
import {
  crearContenidoRequest, editarContenidoRequest, eliminarContenidoRequest, reordenarContenidosLoteRequest,
  subirArchivoLeccionRequest, firmarUrlArchivoAdminRequest, moverContenidoRequest,
} from '../../services/contenidoService';
import {
  crearBloqueRequest, editarBloqueRequest, eliminarBloqueRequest, reordenarBloquesLoteRequest,
} from '../../services/bloqueService';
import {
  listarPreguntasAdminRequest, crearPreguntaRequest, editarPreguntaRequest, eliminarPreguntaRequest,
} from '../../services/preguntaService';
import EditorTextoEnriquecido from './EditorTextoEnriquecido';
import { FormularioPregunta, ICONOS_DISPONIBLES } from './editorCursoPiezas';
import { listarInstructoresRequest } from '../../services/usuarioService';
import useAutoguardado from './useAutoguardado';
import FiltroSegmentado from '../../components/FiltroSegmentado';
import { SkeletonEditorCurso } from '../../components/Skeleton';
import { htmlSeguro } from '../../utils/htmlSeguro';

/* ============================================================
 * Editor "en vivo": el curso se arma viéndolo como lo va a ver el alumno.
 *  - Clases: igual que la cursada (módulos y clases a la izquierda, la clase
 *    en el centro con el video y el panel de archivos al costado).
 *  - Página del curso: igual que la página de venta.
 * Cada texto se ve como texto normal y se edita con el lápiz. Todo se guarda solo.
 * ============================================================ */

const ETIQUETA_ESTADO = { activo: 'Publicado', oculto: 'Oculto', borrador: 'Borrador', archivado: 'Archivado' };
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const MAX_BLOQUES = 3;
const ICONO_STAT = Object.fromEntries(ICONOS_DISPONIBLES.map((o) => [o.value, o]));

// Links de YouTube / Vimeo como los copia cualquiera → dirección para insertar el video
export function aUrlEmbed(texto) {
  const url = (texto || '').trim();
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo && !url.includes('player.vimeo.com')) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Bunny Stream: el link para compartir (/play/) se pasa al de insertar (/embed/)
  const bunny = url.match(/(iframe|player)\.mediadelivery\.net\/play\/(\d+)\/([\w-]+)/);
  if (bunny) return `https://${bunny[1]}.mediadelivery.net/embed/${bunny[2]}/${bunny[3]}`;
  return url;
}

function ordenados(lista) {
  return [...(lista || [])].sort((a, b) => a.orden - b.orden);
}

function formatearPesos(valor) {
  const n = Number(valor);
  if (!valor || Number.isNaN(n)) return '';
  return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

function formatearFechaHora(fecha) {
  const d = new Date(fecha);
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;
}

function payloadCurso(g) {
  return {
    titulo: (g.titulo || '').trim(),
    descripcion: g.descripcion || '',
    imagenPortada: g.imagenPortada || null,
    precio: parseFloat(g.precio) || 0,
    precioOriginal: g.precioOriginal ? parseFloat(g.precioOriginal) : null,
    categoria: (g.categoria || '').trim(),
    nivel: (g.nivel || '').trim() || null,
    incluye: (g.incluye || []).map((v) => v.trim()).filter(Boolean),
    estadisticas: (g.estadisticas || []).filter((e) => (e.titulo || '').trim()),
    emiteCertificado: g.emiteCertificado !== false,
  };
}

function payloadClase(c) {
  return {
    titulo: c.titulo,
    tipo: c.tipo,
    urlVideo: c.urlVideo || null,
    archivos: c.archivos,
    contenidoTexto: c.contenidoTexto || null,
    visible: c.visible !== false,
  };
}

function borradorDeClase(contenido) {
  return {
    id: contenido.id,
    idModulo: contenido.idModulo,
    titulo: contenido.titulo,
    tipo: contenido.tipo,
    urlVideo: contenido.urlVideo || '',
    archivos: (contenido.archivos || []).map((a) => ({ url: a.url, nombre: a.nombre })),
    contenidoTexto: contenido.contenidoTexto || '',
    visible: contenido.visible !== false,
  };
}

function htmlVacio(html) {
  return !html || !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// ---------- Íconos ----------
const Svg = ({ children, size = 16, ...resto }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...resto}>
    {children}
  </svg>
);
const IconoPlay = () => <Svg size={12}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" /></Svg>;
const IconoTexto = () => <Svg size={13}><path d="M4 6h16M4 12h16M4 18h10" /></Svg>;
const IconoMas = () => <Svg size={15}><path d="M12 5v14M5 12h14" /></Svg>;
const IconoArriba = () => <Svg size={14}><path d="M18 15l-6-6-6 6" /></Svg>;
const IconoAbajo = () => <Svg size={14}><path d="M6 9l6 6 6-6" /></Svg>;
const IconoIzq = () => <Svg size={15}><path d="M15 18l-6-6 6-6" /></Svg>;
const IconoDer = () => <Svg size={15}><path d="M9 18l6-6-6-6" /></Svg>;
const IconoBasura = () => <Svg size={14}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Svg>;
const IconoOjo = () => <Svg size={14}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>;
const IconoOjoTachado = () => <Svg size={14}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /></Svg>;
const IconoArchivo = () => <Svg size={15}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></Svg>;
const IconoSubir = () => <Svg size={15}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Svg>;
const IconoDescarga = () => <Svg size={14}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></Svg>;
const IconoX = () => <Svg size={15}><path d="M18 6L6 18M6 6l12 12" /></Svg>;
const IconoCheck = () => <Svg size={13}><path d="M20 6L9 17l-5-5" /></Svg>;
const IconoImagen = () => <Svg size={22}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></Svg>;
const IconoLapiz = () => <Svg size={13}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></Svg>;
const IconoMensaje = () => <Svg size={17}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></Svg>;
const IconoPregunta = () => <Svg size={14}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></Svg>;
const IconoCapas = () => <Svg size={20} strokeWidth="1.8"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M3 12l9 4.5 9-4.5" /><path d="M3 16.5L12 21l9-4.5" /></Svg>;
const IconoClases = () => <Svg size={20} strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5.5 3.5-5.5 3.5v-7z" /></Svg>;

const TEXTO_GUARDADO = {
  guardado: 'Guardado',
  pendiente: 'Cambios sin guardar…',
  guardando: 'Guardando…',
  error: 'No se pudo guardar',
};

/* ============================================================
 * Texto que se ve normal y se edita con el lápiz
 * ============================================================ */
function Editable({
  valor, onGuardar, onVaciar, placeholder, etiqueta, multilinea = false, tipo = 'text', formato, className = '',
  maxLength, obligatorio = false, autoEditar = false, lista,
}) {
  const [editando, setEditando] = useState(autoEditar);
  const [borrador, setBorrador] = useState(valor ?? '');
  const ref = useRef(null);

  useEffect(() => {
    if (!editando || !ref.current) return;
    ref.current.focus();
    if (!multilinea && ref.current.select) ref.current.select();
    if (multilinea) {
      const fin = ref.current.value.length;
      ref.current.setSelectionRange(fin, fin);
    }
  }, [editando, multilinea]);

  function empezar() {
    setBorrador(valor ?? '');
    setEditando(true);
  }
  function confirmar() {
    const v = String(borrador ?? '').trim();
    setEditando(false);
    if (!v) {
      if (onVaciar) { onVaciar(); return; }
      if (obligatorio) return;
    }
    if (v !== String(valor ?? '')) onGuardar(v);
  }
  function teclas(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditando(false);
      if (!String(valor ?? '').trim() && onVaciar) onVaciar();
    }
    if (e.key === 'Enter' && (!multilinea || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      confirmar();
    }
  }

  if (editando) {
    const props = {
      ref,
      value: borrador,
      onChange: (e) => setBorrador(e.target.value),
      onBlur: confirmar,
      // Que las teclas y el mouse no lleguen a la fila (abrir clase / arrastrar)
      onKeyDown: (e) => { e.stopPropagation(); teclas(e); },
      onPointerDown: (e) => e.stopPropagation(),
      onClick: (e) => e.stopPropagation(),
      placeholder,
      maxLength,
      'aria-label': etiqueta,
      list: lista,
      className: 'vivo-editable-input',
    };
    return (
      <div className={`vivo-editable editando ${className}`}>
        {multilinea ? <textarea {...props} rows={3} /> : <input type={tipo} min={tipo === 'number' ? 0 : undefined} {...props} />}
      </div>
    );
  }

  const vacio = valor === undefined || valor === null || String(valor).trim() === '';
  return (
    <div className={`vivo-editable ${className}`}>
      <span className={`vivo-editable-texto ${vacio ? 'vacio' : ''}`}>{vacio ? placeholder : (formato ? formato(valor) : valor)}</span>
      <button type="button" className="vivo-lapiz" onClick={(e) => { e.stopPropagation(); empezar(); }} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} aria-label={`Editar ${etiqueta}`} title="Editar">
        <IconoLapiz />
      </button>
    </div>
  );
}

// Texto con formato (notas, bloques de texto): se lee como lo ve el alumno y se edita con "Editar"
function TextoRicoEditable({ valor, onCambiar, placeholder, titulo, nivelTitulo = 'h2' }) {
  const [editando, setEditando] = useState(false);
  const Titulo = nivelTitulo;
  return (
    <section className="vivo-seccion">
      <div className="vivo-seccion-cabecera">
        {titulo ? <Titulo className="vivo-seccion-titulo">{titulo}</Titulo> : <span />}
        <button type="button" className={`vivo-chip ${editando ? 'vivo-chip--activo' : ''}`} onClick={() => setEditando((v) => !v)}>
          {editando ? <><IconoCheck /> Listo</> : <><IconoLapiz /> Editar</>}
        </button>
      </div>
      {editando ? (
        <div className="vivo-tarjeta vivo-tarjeta--editor">
          <EditorTextoEnriquecido value={valor} onChange={onCambiar} placeholder={placeholder} />
        </div>
      ) : htmlVacio(valor) ? (
        <button type="button" className="vivo-tarjeta vivo-notas vivo-notas--vacio" onClick={() => setEditando(true)}>
          {placeholder}
        </button>
      ) : (
        // eslint-disable-next-line react/no-danger
        <div className="vivo-tarjeta vivo-notas" dangerouslySetInnerHTML={{ __html: htmlSeguro(valor) }} />
      )}
    </section>
  );
}

/* ============================================================
 * Pantalla
 * ============================================================ */
function EditorCursoVivo() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const baseRuta = esAdmin ? '/admin' : '/panel-instructor';

  const [curso, setCurso] = useState(null);
  const [general, setGeneral] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('clases'); // 'clases' | 'pagina'
  const [clase, setClase] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [preguntasPorBloque, setPreguntasPorBloque] = useState({});
  const [confirmacion, setConfirmacion] = useState(null);
  const [publicacion, setPublicacion] = useState(null);
  const [devolucion, setDevolucion] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [mensajesAbiertos, setMensajesAbiertos] = useState(false);

  // ---------- Guardado automático ----------
  const guardar = useCallback(async (clave, datos) => {
    if (clave === 'curso') {
      await editarCursoRequest(id, datos);
      setCurso((p) => ({ ...p, ...datos }));
    } else if (clave.startsWith('clase:')) {
      const idClase = parseInt(clave.split(':')[1], 10);
      await editarContenidoRequest(idClase, datos);
      setCurso((p) => ({
        ...p,
        modulos: p.modulos.map((m) => ({
          ...m,
          contenidos: m.contenidos.map((c) => (c.id === idClase ? { ...c, ...datos } : c)),
        })),
      }));
    } else if (clave.startsWith('bloque:')) {
      const idBloque = parseInt(clave.split(':')[1], 10);
      await editarBloqueRequest(idBloque, datos);
      setCurso((p) => ({
        ...p,
        modulos: p.modulos.map((m) => ({
          ...m,
          contenidos: m.contenidos.map((c) => ({
            ...c,
            bloques: (c.bloques || []).map((b) => (b.id === idBloque ? { ...b, contenidoTexto: datos } : b)),
          })),
        })),
      }));
    }
  }, [id]);
  const { estado: estadoGuardado, marcar, programar, guardarTodo } = useAutoguardado(guardar);

  // ---------- Carga ----------
  const cargarMensajes = useCallback(() => {
    listarMensajesRevisionRequest(id).then(setMensajes).catch(() => {});
  }, [id]);

  const cargarCurso = useCallback(async ({ abrir } = {}) => {
    try {
      const data = await obtenerCursoRequest(id);
      setCurso(data);
      const g = {
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        imagenPortada: data.imagenPortada || '',
        precio: data.precio ?? '',
        precioOriginal: data.precioOriginal ?? '',
        categoria: data.categoria || '',
        nivel: data.nivel || '',
        incluye: data.incluye || [],
        estadisticas: data.estadisticas || [],
        estado: data.estado || 'borrador',
        emiteCertificado: data.emiteCertificado !== false,
      };
      marcar('curso', payloadCurso(g));
      setGeneral(g);

      const quizzes = data.modulos.flatMap((m) => m.contenidos.flatMap((c) => (c.bloques || []).filter((b) => b.tipo === 'quiz')));
      Promise.all(quizzes.map((b) => listarPreguntasAdminRequest(b.id).then((preguntas) => [b.id, preguntas]).catch(() => [b.id, null])))
        .then((pares) => setPreguntasPorBloque((p) => {
          const nuevo = { ...p };
          pares.forEach(([idBloque, preguntas]) => { if (preguntas) nuevo[idBloque] = preguntas; });
          return nuevo;
        }));

      const todas = ordenados(data.modulos).flatMap((m) => ordenados(m.contenidos));
      const claseUrl = parseInt(new URLSearchParams(window.location.search).get('clase'), 10);
      const elegida = (abrir && todas.find((c) => c.id === abrir))
        || (!clase && claseUrl && todas.find((c) => c.id === claseUrl))
        || (clase && todas.find((c) => c.id === clase.id))
        || todas[0];
      if (elegida) abrirClaseLocal(elegida);
      else { setClase(null); setBloques([]); }
    } catch {
      setError('No se pudo cargar el curso');
    } finally {
      setCargando(false);
    }
  }, [id, clase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarCurso();
    cargarMensajes();
    listarCategoriasRequest().then(setCategorias).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Llegó desde una notificación estando acá: se recarga y se muestran los mensajes
  const refresco = location.state?.desdeNotificacion;
  useEffect(() => {
    if (!refresco) return;
    cargarCurso();
    cargarMensajes();
    setMensajesAbiertos(true);
  }, [refresco]); // eslint-disable-line react-hooks/exhaustive-deps

  function abrirClaseLocal(contenido) {
    const borrador = borradorDeClase(contenido);
    marcar(`clase:${borrador.id}`, payloadClase(borrador));
    setClase(borrador);
    const bl = ordenados(contenido.bloques);
    bl.filter((b) => b.tipo === 'texto').forEach((b) => marcar(`bloque:${b.id}`, b.contenidoTexto || ''));
    setBloques(bl);
  }

  async function abrirClase(contenido) {
    setVista('clases');
    if (clase?.id === contenido.id) return;
    await guardarTodo();
    abrirClaseLocal(contenido);
  }

  // En el celular la clase queda debajo de la lista: al elegir una, la pantalla baja hasta ella
  const centroRef = useRef(null);
  async function abrirClaseYMostrar(contenido) {
    await abrirClase(contenido);
    if (!window.matchMedia('(max-width: 1000px)').matches) return;
    requestAnimationFrame(() => centroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // ---------- Edición ----------
  function cambiarClase(cambios) {
    setClase((previa) => {
      const nueva = { ...previa, ...cambios };
      if (nueva.titulo.trim()) programar(`clase:${nueva.id}`, payloadClase(nueva));
      return nueva;
    });
    if (cambios.titulo !== undefined) {
      setCurso((p) => ({
        ...p,
        modulos: p.modulos.map((m) => ({
          ...m,
          contenidos: m.contenidos.map((c) => (c.id === clase.id ? { ...c, titulo: cambios.titulo } : c)),
        })),
      }));
    }
  }

  function cambiarGeneral(cambios) {
    setGeneral((previo) => {
      const nuevo = { ...previo, ...cambios };
      if (nuevo.titulo.trim()) programar('curso', payloadCurso(nuevo));
      return nuevo;
    });
  }

  // ---------- Módulos y clases ----------
  const modulos = useMemo(() => (curso ? ordenados(curso.modulos).map((m) => ({ ...m, contenidos: ordenados(m.contenidos) })) : []), [curso]);
  const todasLasClases = useMemo(() => modulos.flatMap((m, i) => m.contenidos.map((c) => ({ ...c, modulo: m, numeroModulo: i + 1 }))), [modulos]);

  async function agregarModulo(titulo) {
    const orden = modulos.length > 0 ? Math.max(...modulos.map((m) => m.orden)) + 1 : 1;
    await crearModuloRequest(id, { titulo, orden });
    await cargarCurso();
  }

  async function renombrarModulo(modulo, titulo) {
    await editarModuloRequest(modulo.id, { titulo, orden: modulo.orden });
    setCurso((p) => ({ ...p, modulos: p.modulos.map((m) => (m.id === modulo.id ? { ...m, titulo } : m)) }));
  }

  // Nuevo orden de los módulos (arrastrando): se ve al toque y después se guarda
  async function reordenarModulos(idsOrdenados) {
    setCurso((p) => ({ ...p, modulos: p.modulos.map((m) => ({ ...m, orden: idsOrdenados.indexOf(m.id) + 1 })) }));
    try {
      await reordenarModulosLoteRequest(idsOrdenados);
    } catch {
      mostrarError('No se pudo mover el módulo');
      cargarCurso();
    }
  }

  // Una clase cambió de lugar (en su módulo o a otro). "estructura": [{ id, contenidos: [ids] }]
  async function moverClaseA(idClase, idModuloOrigen, estructura) {
    const todas = new Map(curso.modulos.flatMap((m) => m.contenidos).map((c) => [c.id, c]));
    setCurso((p) => ({
      ...p,
      modulos: p.modulos.map((m) => {
        const nuevo = estructura.find((e) => e.id === m.id);
        if (!nuevo) return m;
        return { ...m, contenidos: nuevo.contenidos.map((idC, i) => ({ ...todas.get(idC), idModulo: m.id, orden: i + 1 })) };
      }),
    }));
    const destino = estructura.find((e) => e.contenidos.includes(idClase));
    const origen = estructura.find((e) => e.id === idModuloOrigen);
    try {
      await guardarTodo();
      if (destino.id !== idModuloOrigen) await moverContenidoRequest(idClase, destino.id);
      await reordenarContenidosLoteRequest(destino.contenidos);
      if (origen && origen.id !== destino.id && origen.contenidos.length > 0) {
        await reordenarContenidosLoteRequest(origen.contenidos);
      }
    } catch {
      mostrarError('No se pudo mover la clase');
      cargarCurso();
    }
  }

  async function renombrarClase(contenido, titulo) {
    if (clase?.id === contenido.id) {
      cambiarClase({ titulo });
      return;
    }
    try {
      await editarContenidoRequest(contenido.id, { ...payloadClase(borradorDeClase(contenido)), titulo });
      setCurso((p) => ({
        ...p,
        modulos: p.modulos.map((m) => ({
          ...m,
          contenidos: m.contenidos.map((c) => (c.id === contenido.id ? { ...c, titulo } : c)),
        })),
      }));
    } catch {
      mostrarError('No se pudo cambiar el nombre de la clase');
    }
  }

  async function agregarClase(modulo, titulo, tipo) {
    const orden = modulo.contenidos.length > 0 ? Math.max(...modulo.contenidos.map((c) => c.orden)) + 1 : 1;
    await guardarTodo();
    const nueva = await crearContenidoRequest(modulo.id, { titulo, orden, tipo });
    await cargarCurso({ abrir: nueva.id });
    setVista('clases');
  }

  function pedirConfirmacion(texto, accion) {
    setConfirmacion({ texto, accion });
  }

  async function eliminarClase(contenido) {
    await eliminarContenidoRequest(contenido.id);
    if (clase?.id === contenido.id) setClase(null);
    await cargarCurso();
  }

  async function eliminarModulo(modulo) {
    await eliminarModuloRequest(modulo.id);
    if (clase && modulo.contenidos.some((c) => c.id === clase.id)) setClase(null);
    await cargarCurso();
  }

  // ---------- Bloques ----------
  async function agregarBloque(tipo) {
    if (!clase || bloques.length >= MAX_BLOQUES) return;
    await guardarTodo();
    const nuevo = await crearBloqueRequest(clase.id, tipo);
    if (tipo === 'texto') marcar(`bloque:${nuevo.id}`, '');
    if (tipo === 'quiz') setPreguntasPorBloque((p) => ({ ...p, [nuevo.id]: [] }));
    setBloques((prev) => [...prev, nuevo]);
    setCurso((p) => ({
      ...p,
      modulos: p.modulos.map((m) => ({
        ...m,
        contenidos: m.contenidos.map((c) => (c.id === clase.id ? { ...c, bloques: [...(c.bloques || []), nuevo] } : c)),
      })),
    }));
  }

  function cambiarTextoBloque(bloque, html) {
    setBloques((prev) => prev.map((b) => (b.id === bloque.id ? { ...b, contenidoTexto: html } : b)));
    programar(`bloque:${bloque.id}`, html);
  }

  async function eliminarBloque(bloque) {
    await eliminarBloqueRequest(bloque.id);
    setBloques((prev) => prev.filter((b) => b.id !== bloque.id));
    setCurso((p) => ({
      ...p,
      modulos: p.modulos.map((m) => ({
        ...m,
        contenidos: m.contenidos.map((c) => (c.id === clase.id ? { ...c, bloques: (c.bloques || []).filter((b) => b.id !== bloque.id) } : c)),
      })),
    }));
  }

  async function moverBloque(indice, direccion) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= bloques.length) return;
    const nuevos = [...bloques];
    [nuevos[indice], nuevos[destino]] = [nuevos[destino], nuevos[indice]];
    setBloques(nuevos);
    await reordenarBloquesLoteRequest(clase.id, nuevos.map((b) => b.id));
  }

  async function recargarPreguntas(idBloque) {
    const preguntas = await listarPreguntasAdminRequest(idBloque);
    setPreguntasPorBloque((p) => ({ ...p, [idBloque]: preguntas }));
  }

  // ---------- Archivos ----------
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  function mostrarError(texto) {
    setError(texto);
    setTimeout(() => setError(''), 4000);
  }
  async function subirArchivos(e) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!archivos.length) return;
    setSubiendoArchivo(true);
    try {
      const nuevos = [];
      for (const archivo of archivos) {
        // eslint-disable-next-line no-await-in-loop
        const { url, nombre } = await subirArchivoLeccionRequest(archivo);
        nuevos.push({ url, nombre });
      }
      cambiarClase({ archivos: [...clase.archivos, ...nuevos] });
    } catch (err) {
      mostrarError(err.response?.data?.error || 'No se pudo subir el archivo');
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function verArchivo(ruta) {
    try {
      const { url } = await firmarUrlArchivoAdminRequest(ruta);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // sin acceso
    }
  }

  // ---------- Portada ----------
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  async function subirPortada(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendoPortada(true);
    try {
      const { url } = await subirFotoCursoRequest(archivo);
      cambiarGeneral({ imagenPortada: url });
    } catch (err) {
      mostrarError(err.response?.data?.error || 'No se pudo subir la imagen');
    } finally {
      setSubiendoPortada(false);
    }
  }

  // ---------- Publicación ----------
  const faltantes = useMemo(() => {
    if (!general) return [];
    const lista = [];
    if (!general.titulo.trim()) lista.push({ texto: 'Título del curso', vista: 'pagina' });
    if (!(general.descripcion || '').trim()) lista.push({ texto: 'Descripción', vista: 'pagina' });
    if (!(general.categoria || '').trim()) lista.push({ texto: 'Categoría', vista: 'pagina' });
    if (!(parseFloat(general.precio) > 0)) lista.push({ texto: 'Precio', vista: 'pagina' });
    if (!todasLasClases.some((c) => c.visible !== false)) lista.push({ texto: 'Al menos una clase visible', vista: 'clases' });
    todasLasClases.forEach((c) => {
      const bl = c.id === clase?.id ? bloques : (c.bloques || []);
      if (bl.some((b) => b.tipo === 'quiz' && preguntasPorBloque[b.id] && preguntasPorBloque[b.id].length === 0)) {
        lista.push({ texto: `Preguntas del quiz de "${c.titulo}"`, vista: 'clases', clase: c });
      }
    });
    return lista;
  }, [general, todasLasClases, clase?.id, bloques, preguntasPorBloque]);

  function irAFaltante(f) {
    setVista(f.vista);
    if (f.clase) abrirClase(f.clase);
  }

  async function publicar() {
    setPublicacion({ enviando: true, error: '' });
    try {
      await guardarTodo();
      if (esAdmin) {
        const actualizado = await cambiarEstadoCursoRequest(id, 'activo');
        setGeneral((g) => ({ ...g, estado: actualizado.estado }));
        setCurso((c) => ({ ...c, estado: actualizado.estado, revisionSolicitadaEn: null, comentarioRevision: null }));
      } else {
        const actualizado = await solicitarPublicacionRequest(id);
        setCurso((c) => ({ ...c, revisionSolicitadaEn: actualizado.revisionSolicitadaEn, comentarioRevision: null }));
      }
      setPublicacion(null);
    } catch (err) {
      setPublicacion({ enviando: false, error: err.response?.data?.error || 'No se pudo completar' });
    }
  }

  async function ocultar() {
    const actualizado = await cambiarEstadoCursoRequest(id, 'oculto');
    setGeneral((g) => ({ ...g, estado: actualizado.estado }));
    setCurso((c) => ({ ...c, estado: actualizado.estado }));
  }

  async function devolver() {
    setDevolucion((d) => ({ ...d, enviando: true, error: '' }));
    try {
      const actualizado = await devolverCursoRequest(id, devolucion.comentario);
      setCurso((c) => ({ ...c, revisionSolicitadaEn: null, comentarioRevision: actualizado.comentarioRevision }));
      setDevolucion(null);
      cargarMensajes();
    } catch (err) {
      setDevolucion((d) => ({ ...d, enviando: false, error: err.response?.data?.error || 'No se pudo devolver' }));
    }
  }

  if (cargando) return <SkeletonEditorCurso />;
  if (!curso || !general) return <div className="error-box" style={{ maxWidth: 480, margin: '60px auto' }}>{error || 'No se encontró el curso'}</div>;

  const estado = general.estado;
  const enRevision = Boolean(curso.revisionSolicitadaEn) && estado !== 'activo';
  // Punto en el botón de mensajes: el instructor tiene mensajes sin leer
  const mensajesSinLeer = !esAdmin && mensajes.some((m) => !m.leidoEn);
  const posicion = clase ? todasLasClases.findIndex((c) => c.id === clase.id) : -1;
  const claseActual = posicion >= 0 ? todasLasClases[posicion] : null;
  const anterior = posicion > 0 ? todasLasClases[posicion - 1] : null;
  const siguiente = posicion >= 0 && posicion < todasLasClases.length - 1 ? todasLasClases[posicion + 1] : null;

  return (
    <div className="vivo editor-curso-page">
      {/* ---------- Barra superior ---------- */}
      <header className="vivo-barra">
        <div className="vivo-barra-titulo">
          <nav className="vivo-migas" aria-label="Ubicación">
            <Link to={`${baseRuta}/cursos`}>{esAdmin ? 'Cursos' : 'Mis cursos'}</Link>
            <span aria-hidden="true">/</span>
            <span>{general.titulo || 'Curso sin título'}</span>
          </nav>
          <div className="vivo-barra-fila">
            <FiltroSegmentado
              etiqueta="Qué querés editar"
              className="admin-segmentado"
              opciones={[{ id: 'clases', etiqueta: 'Clases' }, { id: 'pagina', etiqueta: 'Página del curso' }]}
              valor={vista}
              onCambiar={setVista}
            />
            <span className={`editor-curso-estado-pill editor-curso-estado-pill--${estado}`}>{ETIQUETA_ESTADO[estado] || estado}</span>
          </div>
        </div>
        <div className="vivo-barra-acciones">
          <span className={`vivo-guardado vivo-guardado--${estadoGuardado}`} role="status" aria-live="polite">
            {estadoGuardado === 'guardado' && <IconoCheck />}
            {TEXTO_GUARDADO[estadoGuardado]}
          </span>
          <PanelMensajes
            mensajes={mensajes}
            sinLeer={mensajesSinLeer}
            abierto={mensajesAbiertos}
            onAbrir={setMensajesAbiertos}
            esAdmin={esAdmin}
            onActualizar={async (m, cambios) => {
              try {
                const actualizado = await actualizarMensajeRevisionRequest(id, m.id, cambios);
                setMensajes((lista) => lista.map((x) => (x.id === m.id ? actualizado : x)));
                if (cambios.resuelto !== undefined) cargarCurso();
              } catch (err) {
                mostrarError(err.response?.data?.error || 'No se pudo actualizar el mensaje');
              }
            }}
          />
          <Link
            to={`/cursos/${id}/aprender?${new URLSearchParams({
              ...(clase ? { clase: String(clase.id) } : {}),
              volver: `${location.pathname}${clase ? `?clase=${clase.id}` : ''}`,
            }).toString()}`}
            className="admin-tabla-accion admin-tabla-accion--contorno vivo-boton"
          >
            <IconoOjo /> Ver como alumno
          </Link>
          {esAdmin && enRevision && (
            <button type="button" className="admin-tabla-accion admin-tabla-accion--contorno vivo-boton" onClick={() => setDevolucion({ comentario: '', enviando: false, error: '' })}>
              Devolver con comentario
            </button>
          )}
          {esAdmin && estado === 'activo' && (
            <button type="button" className="admin-tabla-accion admin-tabla-accion--contorno vivo-boton" onClick={ocultar}>Ocultar</button>
          )}
          {estado !== 'activo' && estado !== 'archivado' && (
            !esAdmin && enRevision ? (
              <span className="editor-revision-pill" title={`Enviado el ${new Date(curso.revisionSolicitadaEn).toLocaleDateString('es-AR')}`}>En revisión</span>
            ) : (
              <button type="button" className="admin-boton-primario vivo-boton" onClick={() => setPublicacion({ enviando: false, error: '' })}>
                {esAdmin ? (enRevision ? 'Aprobar y publicar' : 'Publicar') : 'Solicitar publicación'}
              </button>
            )
          )}
        </div>
      </header>

      {error && <div className="error-box vivo-error">{error}</div>}

      {vista === 'clases' ? (
        <div className="vivo-cursada">
          <PanelEstructura
            titulo={general.titulo}
            modulos={modulos}
            claseAbiertaId={clase?.id}
            onAbrir={abrirClaseYMostrar}
            onAgregarModulo={agregarModulo}
            onRenombrarModulo={renombrarModulo}
            onRenombrarClase={renombrarClase}
            onReordenarModulos={reordenarModulos}
            onEliminarModulo={(m) => pedirConfirmacion(`¿Eliminar el módulo "${m.titulo}" y todas sus clases?`, () => eliminarModulo(m))}
            onAgregarClase={agregarClase}
            onMoverClase={moverClaseA}
            anterior={anterior}
            siguiente={siguiente}
          />

          <main className="vivo-centro" ref={centroRef}>
            {!clase || !claseActual ? (
              <div className="vivo-vacio">
                <p className="vivo-vacio-titulo">{modulos.length === 0 ? 'Empezá creando el primer módulo' : 'Agregá la primera clase'}</p>
                <p>
                  {modulos.length === 0
                    ? 'A la izquierda, escribí el nombre del módulo (por ejemplo "Introducción") y tocá Agregar.'
                    : 'Debajo de cada módulo hay un "+ Agregar clase". Elegí si es un video o una clase de texto y quiz.'}
                </p>
              </div>
            ) : (
              <ClaseEnVivo
                key={clase.id}
                clase={clase}
                modulo={claseActual.modulo}
                numeroModulo={claseActual.numeroModulo}
                indiceEnModulo={claseActual.modulo.contenidos.findIndex((c) => c.id === clase.id)}
                bloques={bloques}
                preguntasPorBloque={preguntasPorBloque}
                subiendoArchivo={subiendoArchivo}
                baseRuta={baseRuta}
                onCambiar={cambiarClase}
                onSubirArchivos={subirArchivos}
                onVerArchivo={verArchivo}
                onEliminar={() => pedirConfirmacion(`¿Eliminar la clase "${clase.titulo}"?`, () => eliminarClase(clase))}
                onAgregarBloque={agregarBloque}
                onCambiarTextoBloque={cambiarTextoBloque}
                onEliminarBloque={(b) => pedirConfirmacion(b.tipo === 'quiz' ? '¿Eliminar este quiz y sus preguntas?' : '¿Eliminar este bloque de texto?', () => eliminarBloque(b))}
                onMoverBloque={moverBloque}
                onRecargarPreguntas={recargarPreguntas}
                onEliminarPregunta={(idBloque, idPregunta) => pedirConfirmacion('¿Eliminar esta pregunta?', async () => { await eliminarPreguntaRequest(idPregunta); await recargarPreguntas(idBloque); })}
              />
            )}
            {clase && claseActual && (
              <button type="button" className="vivo-volver-arriba" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <IconoArriba /> Volver arriba
              </button>
            )}
          </main>
        </div>
      ) : (
        <PaginaCursoEnVivo
          general={general}
          categorias={categorias}
          modulos={modulos}
          totalClases={todasLasClases.length}
          faltantes={faltantes}
          subiendoPortada={subiendoPortada}
          onCambiar={cambiarGeneral}
          onSubirPortada={subirPortada}
          onIrA={irAFaltante}
          onAbrirClase={abrirClase}
          instructores={(
            <InstructoresCurso
              curso={curso}
              setCurso={setCurso}
              esAdmin={esAdmin}
              idUsuario={usuario?.id}
              onSalir={() => navigate(`${baseRuta}/cursos`)}
              onError={mostrarError}
            />
          )}
        />
      )}

      {/* ---------- Ventanas ---------- */}
      {publicacion && (
        <div className="admin-modal-fondo" onClick={() => !publicacion.enviando && setPublicacion(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="vivo-publicar" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3 id="vivo-publicar" className="admin-modal-titulo">{esAdmin ? 'Publicar curso' : 'Solicitar publicación'}</h3>
              <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" onClick={() => setPublicacion(null)}><IconoX /></button>
            </div>
            {faltantes.length > 0 ? (
              <>
                <p className="vivo-modal-texto">Antes de publicar, completá:</p>
                <ul className="vivo-faltantes">
                  {faltantes.map((f) => (
                    <li key={f.texto}>
                      <button type="button" onClick={() => { setPublicacion(null); irAFaltante(f); }}>{f.texto}</button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="vivo-modal-texto">
                {esAdmin
                  ? 'Está todo listo. Al publicarlo aparece en el catálogo y se puede comprar.'
                  : 'Está todo listo. El administrador lo revisa y lo publica, o te avisa si falta algo.'}
              </p>
            )}
            {publicacion.error && <p className="modal-nuevo-curso-error">{publicacion.error}</p>}
            <div className="admin-modal-acciones">
              <button type="button" className="admin-tabla-accion" onClick={() => setPublicacion(null)}>Cancelar</button>
              <button type="button" className="admin-boton-primario" disabled={faltantes.length > 0 || publicacion.enviando} onClick={publicar}>
                {publicacion.enviando ? 'Enviando…' : esAdmin ? 'Publicar curso' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {devolucion && (
        <div className="admin-modal-fondo" onClick={() => !devolucion.enviando && setDevolucion(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="vivo-devolver" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3 id="vivo-devolver" className="admin-modal-titulo">Devolver al instructor</h3>
              <button type="button" className="admin-modal-cerrar" aria-label="Cerrar" onClick={() => setDevolucion(null)}><IconoX /></button>
            </div>
            <label className="editor-devolver-campo">
              ¿Qué le falta o qué hay que cambiar?
              <textarea className="admin-input" rows={4} maxLength={1000} autoFocus value={devolucion.comentario} onChange={(e) => setDevolucion((d) => ({ ...d, comentario: e.target.value }))} />
            </label>
            {devolucion.error && <p className="modal-nuevo-curso-error">{devolucion.error}</p>}
            <div className="admin-modal-acciones">
              <button type="button" className="admin-tabla-accion" onClick={() => setDevolucion(null)}>Cancelar</button>
              <button type="button" className="admin-boton-primario" disabled={!devolucion.comentario.trim() || devolucion.enviando} onClick={devolver}>
                {devolucion.enviando ? 'Enviando…' : 'Devolver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmacion && (
        <div className="admin-modal-fondo" onClick={() => setConfirmacion(null)}>
          <div className="admin-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="vivo-modal-texto vivo-modal-texto--fuerte">{confirmacion.texto}</p>
            <div className="admin-modal-acciones">
              <button type="button" className="admin-tabla-accion" onClick={() => setConfirmacion(null)}>Cancelar</button>
              <button
                type="button"
                className="admin-boton-primario vivo-boton-peligro"
                onClick={async () => {
                  const { accion } = confirmacion;
                  setConfirmacion(null);
                  try { await accion(); } catch (err) { mostrarError(err.response?.data?.error || 'No se pudo eliminar'); }
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Mensajes del administrador (cuadradito arriba a la derecha)
 * ============================================================ */
function PanelMensajes({ mensajes, sinLeer, abierto, onAbrir, esAdmin, onActualizar }) {
  const ref = useRef(null);
  const hayPendientes = mensajes.some((m) => !m.resueltoEn);

  useEffect(() => {
    if (!abierto) return undefined;
    function fuera(e) {
      if (ref.current && !ref.current.contains(e.target)) onAbrir(false);
    }
    function escape(e) {
      if (e.key === 'Escape') onAbrir(false);
    }
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto, onAbrir]);

  return (
    <div className="vivo-mensajes" ref={ref}>
      <button
        type="button"
        className={`vivo-mensajes-boton ${abierto ? 'activo' : ''}`}
        onClick={() => onAbrir(!abierto)}
        aria-expanded={abierto}
        aria-label={sinLeer ? 'Mensajes del administrador (hay mensajes sin leer)' : 'Mensajes del administrador'}
        title="Mensajes del administrador"
      >
        <IconoMensaje />
        {sinLeer && <span className="vivo-mensajes-punto" aria-hidden="true" />}
      </button>
      {abierto && (
        <div className="vivo-mensajes-panel" role="dialog" aria-label="Mensajes del administrador">
          <div className="vivo-mensajes-cabecera">
            <p>{esAdmin ? 'Comentarios enviados al instructor' : 'Mensajes del administrador'}</p>
            {!esAdmin && sinLeer && (
              <button
                type="button"
                className="vivo-mensajes-accion"
                onClick={() => mensajes.filter((m) => !m.leidoEn).forEach((m) => onActualizar(m, { leido: true }))}
              >
                Marcar todo como leído
              </button>
            )}
            <button type="button" className="vivo-icono-boton" aria-label="Cerrar" onClick={() => onAbrir(false)}><IconoX /></button>
          </div>
          {mensajes.length === 0 ? (
            <p className="vivo-mensajes-vacio">{esAdmin ? 'Todavía no le devolviste este curso con comentarios.' : 'Todavía no hay mensajes sobre este curso.'}</p>
          ) : (
            <ul className="vivo-mensajes-lista">
              {mensajes.map((m) => {
                const pendiente = !m.resueltoEn;
                const noLeido = !esAdmin && !m.leidoEn;
                return (
                  <li key={m.id} className={`${pendiente ? 'pendiente' : 'resuelto'} ${noLeido ? 'no-leido' : ''}`}>
                    <div className="vivo-mensajes-meta">
                      <span>{formatearFechaHora(m.creadoEn)}</span>
                      {pendiente
                        ? <span className="vivo-mensajes-etiqueta">Pendiente</span>
                        : <span className="vivo-mensajes-etiqueta vivo-mensajes-etiqueta--ok"><IconoCheck /> Realizado</span>}
                    </div>
                    <p>{m.texto}</p>
                    <div className="vivo-mensajes-pie-item">
                      {m.autor && <span className="vivo-mensajes-autor">{m.autor.nombre} {m.autor.apellido}</span>}
                      {esAdmin ? (
                        <span className="vivo-mensajes-visto">{m.leidoEn ? 'Leído por el instructor' : 'Sin leer'}</span>
                      ) : noLeido ? (
                        <button type="button" className="vivo-mensajes-accion vivo-mensajes-accion--suave" onClick={() => onActualizar(m, { leido: true })}>
                          Marcar como leído
                        </button>
                      ) : (
                        <span className="vivo-mensajes-visto"><IconoCheck /> Leído</span>
                      )}
                      {/* Admin e instructor pueden marcarlo como realizado: es para organizarse */}
                      <button type="button" className="vivo-mensajes-accion" onClick={() => onActualizar(m, { resuelto: pendiente, ...(pendiente && !esAdmin ? { leido: true } : {}) })}>
                        {pendiente ? 'Marcar como realizado' : 'Volver a pendiente'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {hayPendientes && !esAdmin && (
            <p className="vivo-mensajes-pie">Cuando lo tengas listo, volvé a tocar "Solicitar publicación".</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Columna izquierda: módulos y clases, como en la cursada.
 * Los módulos y las clases se ordenan arrastrándolos; una clase también
 * se puede arrastrar a otro módulo.
 * ============================================================ */
const idModuloDnd = (id) => `m-${id}`;
const idClaseDnd = (id) => `c-${id}`;
const esModuloDnd = (id) => String(id).startsWith('m-');
const numeroDnd = (id) => parseInt(String(id).slice(2), 10);

function PanelEstructura({
  titulo, modulos, claseAbiertaId, onAbrir, onAgregarModulo, onRenombrarModulo, onRenombrarClase,
  onReordenarModulos, onMoverClase, onEliminarModulo, onAgregarClase, anterior, siguiente,
}) {
  const [nuevoModulo, setNuevoModulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Mientras se arrastra, la estructura se arma acá y recién se guarda al soltar
  const [vistaPrevia, setVistaPrevia] = useState(null); // [{ ...modulo, contenidos: [...] }]
  const [activo, setActivo] = useState(null); // id dnd de lo que se arrastra
  const vistaRef = useRef(null);
  const origenRef = useRef(null); // idModulo de la clase al empezar a arrastrar

  const lista = vistaPrevia || modulos;
  vistaRef.current = lista;
  const totalClases = modulos.reduce((n, m) => n + m.contenidos.length, 0);

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Arrastrando un módulo solo cuentan los módulos. Arrastrando una clase
  // cuentan las clases y los módulos vacíos (para poder soltarla adentro).
  const deteccion = useCallback((args) => {
    if (esModuloDnd(args.active.id)) {
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => esModuloDnd(c.id)) });
    }
    const vacios = new Set((vistaRef.current || []).filter((m) => m.contenidos.length === 0).map((m) => idModuloDnd(m.id)));
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => !esModuloDnd(c.id) || vacios.has(c.id)),
    });
  }, []);

  function moduloDeClase(estructura, idClase) {
    return estructura.find((m) => m.contenidos.some((c) => c.id === idClase));
  }

  function alEmpezar({ active }) {
    setActivo(active.id);
    const copia = modulos.map((m) => ({ ...m, contenidos: [...m.contenidos] }));
    setVistaPrevia(copia);
    if (!esModuloDnd(active.id)) origenRef.current = moduloDeClase(copia, numeroDnd(active.id))?.id ?? null;
  }

  // Pasar una clase de un módulo a otro mientras se arrastra
  function alPasarPor({ active, over }) {
    if (!over || esModuloDnd(active.id)) return;
    const idClase = numeroDnd(active.id);
    setVistaPrevia((previa) => {
      if (!previa) return previa;
      const origen = moduloDeClase(previa, idClase);
      const destino = esModuloDnd(over.id)
        ? previa.find((m) => m.id === numeroDnd(over.id))
        : moduloDeClase(previa, numeroDnd(over.id));
      if (!origen || !destino || origen.id === destino.id) return previa;
      const clase = origen.contenidos.find((c) => c.id === idClase);
      let indice = destino.contenidos.length;
      if (!esModuloDnd(over.id)) {
        const indiceSobre = destino.contenidos.findIndex((c) => c.id === numeroDnd(over.id));
        const abajo = active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
        indice = indiceSobre + (abajo ? 1 : 0);
      }
      return previa.map((m) => {
        if (m.id === origen.id) return { ...m, contenidos: m.contenidos.filter((c) => c.id !== idClase) };
        if (m.id === destino.id) {
          const contenidos = [...m.contenidos];
          contenidos.splice(indice, 0, clase);
          return { ...m, contenidos };
        }
        return m;
      });
    });
  }

  function alSoltar({ active, over }) {
    const previa = vistaRef.current;
    setActivo(null);
    setVistaPrevia(null);
    if (!over || !previa) return;

    if (esModuloDnd(active.id)) {
      const ids = modulos.map((m) => idModuloDnd(m.id));
      const desde = ids.indexOf(active.id);
      const hasta = ids.indexOf(over.id);
      if (desde < 0 || hasta < 0 || desde === hasta) return;
      onReordenarModulos(arrayMove(modulos.map((m) => m.id), desde, hasta));
      return;
    }

    const idClase = numeroDnd(active.id);
    let estructura = previa;
    const destino = moduloDeClase(estructura, idClase);
    if (!destino) return;
    if (!esModuloDnd(over.id)) {
      const desde = destino.contenidos.findIndex((c) => c.id === idClase);
      const hasta = destino.contenidos.findIndex((c) => c.id === numeroDnd(over.id));
      if (hasta >= 0 && desde !== hasta) {
        estructura = estructura.map((m) => (m.id === destino.id ? { ...m, contenidos: arrayMove(m.contenidos, desde, hasta) } : m));
      }
    }
    const final = estructura.map((m) => ({ id: m.id, contenidos: m.contenidos.map((c) => c.id) }));
    const antes = modulos.map((m) => ({ id: m.id, contenidos: m.contenidos.map((c) => c.id) }));
    if (JSON.stringify(final) === JSON.stringify(antes)) return;
    onMoverClase(idClase, origenRef.current, final);
  }

  function alCancelar() {
    setActivo(null);
    setVistaPrevia(null);
  }

  async function enviarModulo(e) {
    e.preventDefault();
    if (!nuevoModulo.trim()) return;
    setEnviando(true);
    try {
      await onAgregarModulo(nuevoModulo.trim());
      setNuevoModulo('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <aside className="vivo-lateral" aria-label="Módulos y clases">
      <div className="vivo-lateral-scroll">
        <h2 className="vivo-lateral-curso">{titulo || 'Curso sin título'}</h2>
        <div className="vivo-lateral-fila">
          <span className="vivo-ayuda-raton">Arrastrá para ordenar</span>
          <span className="vivo-ayuda-tactil">Mantené apretado para ordenar</span>
          <span>{modulos.length} {modulos.length === 1 ? 'módulo' : 'módulos'} · {totalClases} {totalClases === 1 ? 'clase' : 'clases'}</span>
        </div>

        <DndContext
          sensors={sensores}
          collisionDetection={deteccion}
          onDragStart={alEmpezar}
          onDragOver={alPasarPor}
          onDragEnd={alSoltar}
          onDragCancel={alCancelar}
        >
          <SortableContext items={lista.map((m) => idModuloDnd(m.id))} strategy={verticalListSortingStrategy}>
            <div className={`vivo-modulos ${activo ? 'arrastrando' : ''}`}>
              {lista.map((modulo, i) => (
                <ModuloEnVivo
                  key={modulo.id}
                  modulo={modulo}
                  numero={i + 1}
                  claseAbiertaId={claseAbiertaId}
                  onAbrir={onAbrir}
                  onRenombrar={(t) => onRenombrarModulo(modulo, t)}
                  onRenombrarClase={onRenombrarClase}
                  onEliminar={() => onEliminarModulo(modulo)}
                  onAgregarClase={(t, tipo) => onAgregarClase(modulo, t, tipo)}
                />
              ))}
            </div>
          </SortableContext>
          {/* Lo que sigue al cursor mientras se mueve un módulo: solo su cabecera */}
          <DragOverlay dropAnimation={null}>
            {activo && esModuloDnd(activo) ? (() => {
              const indice = lista.findIndex((m) => idModuloDnd(m.id) === activo);
              const m = lista[indice];
              if (!m) return null;
              return (
                <div className="vivo-modulo vivo-modulo--flotante">
                  <div className="vivo-modulo-tarjeta">
                    <span className="vivo-agarrar" aria-hidden="true"><IconoAgarrar /></span>
                    <span className="vivo-modulo-numero">{String(indice + 1).padStart(2, '0')}</span>
                    <div className="vivo-modulo-info">
                      <span className="vivo-modulo-etiqueta">Módulo {indice + 1} · {m.contenidos.length} {m.contenidos.length === 1 ? 'clase' : 'clases'}</span>
                      <span className="vivo-modulo-titulo">{m.titulo}</span>
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>

        <form className="vivo-nuevo-modulo" onSubmit={enviarModulo}>
          <input
            type="text"
            value={nuevoModulo}
            onChange={(e) => setNuevoModulo(e.target.value)}
            placeholder="Nombre del nuevo módulo"
            aria-label="Nombre del nuevo módulo"
            maxLength={150}
          />
          <button type="submit" className="admin-boton-primario" disabled={!nuevoModulo.trim() || enviando}>
            <IconoMas /> Agregar
          </button>
        </form>
      </div>

      <nav className="vivo-lateral-pie" aria-label="Otras clases">
        <button type="button" className="vivo-nav vivo-nav--anterior" disabled={!anterior} onClick={() => anterior && onAbrir(anterior)}>
          <IconoIzq /> Anterior
        </button>
        <button type="button" className="vivo-nav vivo-nav--siguiente" disabled={!siguiente} onClick={() => siguiente && onAbrir(siguiente)}>
          Siguiente <IconoDer />
        </button>
      </nav>
    </aside>
  );
}

const IconoAgarrar = () => (
  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
    <circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" />
    <circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" />
    <circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" />
  </svg>
);

function ModuloEnVivo({
  modulo, numero, claseAbiertaId, onAbrir, onRenombrar, onRenombrarClase, onEliminar, onAgregarClase,
}) {
  const [agregando, setAgregando] = useState(false);
  const [nuevaClase, setNuevaClase] = useState('');
  const [tipoNueva, setTipoNueva] = useState('video');
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState(true);
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id: idModuloDnd(modulo.id) });

  async function crearClase(e) {
    e.preventDefault();
    if (!nuevaClase.trim()) return;
    setEnviando(true);
    try {
      await onAgregarClase(nuevaClase.trim(), tipoNueva);
      setNuevaClase('');
      setAgregando(false);
    } finally {
      setEnviando(false);
    }
  }

  const cantidad = modulo.contenidos.length;
  // El módulo que se está moviendo deja un hueco chico (solo la cabecera); los demás no
  // cambian de tamaño para que lo que sigue al cursor no se desacomode.
  const mostrarClases = abierto && !isDragging;

  return (
    <section
      ref={setNodeRef}
      className={`vivo-modulo ${isDragging ? 'vivo-modulo--lugar' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="vivo-modulo-tarjeta" ref={setActivatorNodeRef} {...listeners} {...attributes} aria-roledescription="módulo arrastrable">
        <span className="vivo-agarrar" aria-hidden="true"><IconoAgarrar /></span>
        <button
          type="button"
          className="vivo-modulo-numero"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? 'Plegar módulo' : 'Desplegar módulo'}
          title={abierto ? 'Plegar' : 'Desplegar'}
        >
          {String(numero).padStart(2, '0')}
        </button>
        <div className="vivo-modulo-info">
          <span className="vivo-modulo-etiqueta">Módulo {numero} · {cantidad} {cantidad === 1 ? 'clase' : 'clases'}</span>
          <Editable
            valor={modulo.titulo}
            onGuardar={onRenombrar}
            etiqueta={`nombre del módulo ${numero}`}
            placeholder="Nombre del módulo"
            className="vivo-modulo-titulo"
            maxLength={150}
            obligatorio
          />
        </div>
        <button
          type="button"
          className="vivo-icono-boton vivo-peligro vivo-modulo-eliminar"
          onClick={onEliminar}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Eliminar módulo"
          title="Eliminar módulo"
        >
          <IconoBasura />
        </button>
      </div>

      {mostrarClases && (
        <div className="vivo-modulo-cuerpo">
          <SortableContext items={modulo.contenidos.map((c) => idClaseDnd(c.id))} strategy={verticalListSortingStrategy}>
            <ul className="vivo-clases">
              {modulo.contenidos.map((c, i) => (
                <ClaseArrastrable
                  key={c.id}
                  clase={c}
                  numero={i + 1}
                  activa={c.id === claseAbiertaId}
                  onAbrir={() => onAbrir(c)}
                  onRenombrar={(t) => onRenombrarClase(c, t)}
                />
              ))}
              {cantidad === 0 && <li className="vivo-clases-vacio">Sin clases. Agregá una o arrastrá una acá.</li>}
            </ul>
          </SortableContext>

          {agregando ? (
            <form className="vivo-nueva-clase" onSubmit={crearClase}>
              <input
                type="text"
                autoFocus
                value={nuevaClase}
                onChange={(e) => setNuevaClase(e.target.value)}
                placeholder="Nombre de la clase"
                aria-label="Nombre de la nueva clase"
                maxLength={150}
                onKeyDown={(e) => { if (e.key === 'Escape') setAgregando(false); }}
              />
              <div className="vivo-nueva-clase-tipos" role="radiogroup" aria-label="Tipo de clase">
                <button type="button" role="radio" aria-checked={tipoNueva === 'video'} className={tipoNueva === 'video' ? 'activo' : ''} onClick={() => setTipoNueva('video')}>
                  <IconoPlay /> Video
                </button>
                <button type="button" role="radio" aria-checked={tipoNueva === 'bloques'} className={tipoNueva === 'bloques' ? 'activo' : ''} onClick={() => setTipoNueva('bloques')}>
                  <IconoTexto /> Texto y quiz
                </button>
              </div>
              <div className="vivo-nueva-clase-acciones">
                <button type="button" className="admin-tabla-accion" onClick={() => setAgregando(false)}>Cancelar</button>
                <button type="submit" className="admin-boton-primario" disabled={!nuevaClase.trim() || enviando}>Crear clase</button>
              </div>
            </form>
          ) : (
            <button type="button" className="vivo-agregar-clase" onClick={() => setAgregando(true)}>
              <IconoMas /> Agregar clase
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ClaseArrastrable({ clase, numero, activa, onAbrir, onRenombrar }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: idClaseDnd(clase.id) });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`vivo-clase ${activa ? 'activa' : ''} ${clase.visible === false ? 'oculta' : ''} ${isDragging ? 'arrastrado' : ''}`}
      {...attributes}
      {...listeners}
      aria-roledescription="clase arrastrable"
      onClick={onAbrir}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (!e.defaultPrevented && e.key === 'Enter' && e.target === e.currentTarget) onAbrir();
      }}
    >
      <span className="vivo-agarrar" aria-hidden="true"><IconoAgarrar /></span>
      <span className="vivo-clase-icono">{clase.tipo === 'video' ? <IconoPlay /> : <IconoTexto />}</span>
      <span className="vivo-clase-numero">{numero}.</span>
      <Editable
        valor={clase.titulo}
        onGuardar={onRenombrar}
        etiqueta={`nombre de la clase ${numero}`}
        placeholder="Nombre de la clase"
        className="vivo-clase-titulo"
        maxLength={200}
        obligatorio
      />
      {clase.visible === false && <span className="vivo-clase-oculta" title="No la ven los alumnos"><IconoOjoTachado /></span>}
    </li>
  );
}

/* ============================================================
 * Centro: la clase como la ve el alumno
 * ============================================================ */
function ClaseEnVivo({
  clase, modulo, numeroModulo, indiceEnModulo, bloques, preguntasPorBloque, subiendoArchivo, baseRuta, onCambiar,
  onSubirArchivos, onVerArchivo, onEliminar, onAgregarBloque, onCambiarTextoBloque, onEliminarBloque, onMoverBloque,
  onRecargarPreguntas, onEliminarPregunta,
}) {
  const [linkVideo, setLinkVideo] = useState(clase.urlVideo || '');
  const [editandoVideo, setEditandoVideo] = useState(!clase.urlVideo);
  const [pestana, setPestana] = useState('archivos');
  const inputArchivo = useRef(null);

  function aplicarVideo(e) {
    e?.preventDefault();
    const embed = aUrlEmbed(linkVideo);
    onCambiar({ urlVideo: embed });
    setLinkVideo(embed);
    if (embed) setEditandoVideo(false);
  }

  const archivos = (
    <div className="vivo-archivos-panel">
      {clase.archivos.length === 0 ? (
        <p className="vivo-nota">Sin archivos. Podés subir PDFs, partituras, samples, proyectos…</p>
      ) : (
        <ul className="vivo-archivos">
          {clase.archivos.map((a, i) => (
            <li key={`${a.url}-${i}`} className="vivo-archivo">
              <span className="vivo-archivo-icono"><IconoArchivo /></span>
              <Editable
                valor={a.nombre}
                onGuardar={(nombre) => onCambiar({ archivos: clase.archivos.map((x, j) => (j === i ? { ...x, nombre } : x)) })}
                etiqueta="nombre del archivo"
                placeholder="Nombre del archivo"
                className="vivo-archivo-nombre"
                obligatorio
              />
              <button type="button" className="vivo-icono-boton" aria-label="Ver archivo" title="Ver" onClick={() => onVerArchivo(a.url)}><IconoDescarga /></button>
              <button type="button" className="vivo-icono-boton vivo-peligro" aria-label="Quitar archivo" title="Quitar" onClick={() => onCambiar({ archivos: clase.archivos.filter((_, j) => j !== i) })}>
                <IconoX />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="vivo-subir" onClick={() => inputArchivo.current?.click()} disabled={subiendoArchivo}>
        <IconoSubir /> {subiendoArchivo ? 'Subiendo…' : 'Subir archivo'}
      </button>
      <input ref={inputArchivo} type="file" multiple hidden onChange={onSubirArchivos} />
    </div>
  );

  const preguntas = (
    <div className="vivo-preguntas-info">
      <div className="vivo-preguntas-caja" aria-hidden="true">Escribí tu pregunta sobre esta clase…</div>
      <p className="vivo-nota">Esta consulta es privada: solo la podrán ver los instructores de este curso.</p>
      <p className="vivo-nota">Así lo ve el alumno. Las preguntas te llegan a <Link to={`${baseRuta}/preguntas`}>Preguntas</Link>.</p>
    </div>
  );

  return (
    <article className="vivo-clase-vista">
      <div className="vivo-clase-arriba">
        <p className="vivo-breadcrumb">
          <span className="vivo-breadcrumb-modulo">Módulo {numeroModulo}: {modulo.titulo}</span>
          <span aria-hidden="true">/</span>
          Lección {indiceEnModulo + 1} de {modulo.contenidos.length}
        </p>
        <div className="vivo-clase-opciones">
          <button
            type="button"
            className={`vivo-chip ${clase.visible ? 'vivo-chip--ok' : ''}`}
            onClick={() => onCambiar({ visible: !clase.visible })}
            title={clase.visible ? 'Los alumnos la ven. Tocá para ocultarla.' : 'Está oculta para los alumnos. Tocá para mostrarla.'}
          >
            {clase.visible ? <IconoOjo /> : <IconoOjoTachado />}
            {clase.visible ? 'Visible' : 'Oculta'}
          </button>
          <button type="button" className="vivo-chip vivo-chip--peligro" onClick={onEliminar}>
            <IconoBasura /> Eliminar clase
          </button>
        </div>
      </div>

      <Editable
        valor={clase.titulo}
        onGuardar={(titulo) => onCambiar({ titulo })}
        etiqueta="título de la clase"
        placeholder="Título de la clase"
        className="vivo-titulo-clase"
        maxLength={200}
        obligatorio
      />

      {clase.tipo === 'video' ? (
        <>
          <div className="vivo-video-fila">
            <div className="vivo-video">
              {clase.urlVideo && !editandoVideo ? (
                <>
                  <iframe src={clase.urlVideo} title={clase.titulo} allowFullScreen />
                  <button type="button" className="vivo-video-cambiar" onClick={() => setEditandoVideo(true)}><IconoLapiz /> Cambiar video</button>
                </>
              ) : (
                <form className="vivo-video-vacio" onSubmit={aplicarVideo}>
                  <span className="vivo-video-icono"><IconoPlay /></span>
                  <p>Pegá el link del video</p>
                  <div className="vivo-video-campo">
                    <input type="url" value={linkVideo} onChange={(e) => setLinkVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" aria-label="Link del video" />
                    <button type="submit" className="admin-boton-primario" disabled={!linkVideo.trim()}>Usar este video</button>
                  </div>
                  {clase.urlVideo && (
                    <div className="vivo-video-acciones">
                      <button type="button" className="admin-filtro-quitar" onClick={() => { setLinkVideo(clase.urlVideo); setEditandoVideo(false); }}>Cancelar</button>
                      {/* Deja la clase sin video (sigue siendo de video, con sus notas y archivos) */}
                      <button type="button" className="admin-filtro-quitar vivo-video-quitar" onClick={() => { onCambiar({ urlVideo: '' }); setLinkVideo(''); }}>Quitar video</button>
                    </div>
                  )}
                </form>
              )}
            </div>

            <div className="vivo-video-lateral">
              <div className="vivo-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={pestana === 'archivos'} className={pestana === 'archivos' ? 'activa' : ''} onClick={() => setPestana('archivos')}>
                  <IconoDescarga /> Archivos {clase.archivos.length > 0 && <span className="vivo-tab-cantidad">{clase.archivos.length}</span>}
                </button>
                <button type="button" role="tab" aria-selected={pestana === 'preguntas'} className={pestana === 'preguntas' ? 'activa' : ''} onClick={() => setPestana('preguntas')}>
                  <IconoPregunta /> Preguntas
                </button>
              </div>
              <div className="vivo-tab-panel" role="tabpanel">
                {pestana === 'archivos' ? archivos : preguntas}
              </div>
            </div>
          </div>

          <TextoRicoEditable
            titulo="Notas de la lección"
            valor={clase.contenidoTexto}
            onCambiar={(html) => onCambiar({ contenidoTexto: html })}
            placeholder="Todavía no hay notas. Tocá Editar para escribir lo que el alumno lee debajo del video: resumen, pasos, links…"
          />
        </>
      ) : (
        <>
          <section className="vivo-bloques">
            {bloques.length === 0 && (
              <div className="vivo-vacio vivo-vacio--chico">
                <p className="vivo-vacio-titulo">Esta clase todavía no tiene contenido</p>
                <p>Agregá un bloque de texto o un quiz. Pueden ser hasta {MAX_BLOQUES}.</p>
              </div>
            )}
            {bloques.map((b, i) => (
              <div key={b.id} className="vivo-bloque">
                <div className="vivo-bloque-barra">
                  <span className={`vivo-bloque-tipo vivo-bloque-tipo--${b.tipo}`}>{b.tipo === 'quiz' ? 'Quiz' : 'Texto'}</span>
                  <div className="vivo-mini-acciones">
                    <button type="button" onClick={() => onMoverBloque(i, -1)} disabled={i === 0} aria-label="Subir bloque" title="Subir"><IconoArriba /></button>
                    <button type="button" onClick={() => onMoverBloque(i, 1)} disabled={i === bloques.length - 1} aria-label="Bajar bloque" title="Bajar"><IconoAbajo /></button>
                    <button type="button" onClick={() => onEliminarBloque(b)} aria-label="Eliminar bloque" title="Eliminar" className="vivo-peligro"><IconoBasura /></button>
                  </div>
                </div>
                {b.tipo === 'texto' ? (
                  <TextoRicoEditable
                    valor={b.contenidoTexto || ''}
                    onCambiar={(html) => onCambiarTextoBloque(b, html)}
                    placeholder="Bloque vacío. Tocá Editar para escribir el contenido."
                  />
                ) : (
                  <QuizEnVivo
                    bloque={b}
                    preguntas={preguntasPorBloque[b.id] || []}
                    onRecargar={() => onRecargarPreguntas(b.id)}
                    onEliminarPregunta={(idPregunta) => onEliminarPregunta(b.id, idPregunta)}
                  />
                )}
              </div>
            ))}
            {bloques.length < MAX_BLOQUES && (
              <div className="vivo-agregar-bloque">
                <span>Agregar:</span>
                <button type="button" className="vivo-chip" onClick={() => onAgregarBloque('texto')}><IconoTexto /> Texto</button>
                <button type="button" className="vivo-chip" onClick={() => onAgregarBloque('quiz')}><IconoMas /> Quiz</button>
              </div>
            )}
          </section>

          <div className="vivo-bloques-extra">
            <section className="vivo-seccion">
              <h2 className="vivo-seccion-titulo">Archivos</h2>
              <div className="vivo-tarjeta vivo-tab-panel">{archivos}</div>
            </section>
            <section className="vivo-seccion">
              <h2 className="vivo-seccion-titulo">Preguntas</h2>
              <div className="vivo-tarjeta vivo-tab-panel">{preguntas}</div>
            </section>
          </div>
        </>
      )}
    </article>
  );
}

function formularioVacio() {
  return {
    enunciado: '', opcionA: '', opcionB: '', opcionC: null, opcionD: null,
    respuestaCorrecta: 'A', explicacionA: '', explicacionB: '', explicacionC: '', explicacionD: '',
  };
}

function QuizEnVivo({ bloque, preguntas, onRecargar, onEliminarPregunta }) {
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  function empezar(p) {
    setError('');
    if (p === 'nueva') {
      setEditando('nueva');
      setForm(formularioVacio());
    } else {
      setEditando(p.id);
      setForm({
        enunciado: p.enunciado, opcionA: p.opcionA, opcionB: p.opcionB,
        opcionC: p.opcionC ?? null, opcionD: p.opcionD ?? null, respuestaCorrecta: p.respuestaCorrecta,
        explicacionA: p.explicacionA || '', explicacionB: p.explicacionB || '',
        explicacionC: p.explicacionC || '', explicacionD: p.explicacionD || '',
      });
    }
  }

  async function guardarPregunta(e) {
    e.preventDefault();
    try {
      const datos = { ...form, opcionC: form.opcionC || null, opcionD: form.opcionD || null };
      if (editando === 'nueva') await crearPreguntaRequest(bloque.id, datos);
      else await editarPreguntaRequest(editando, datos);
      setEditando(null);
      setForm(null);
      await onRecargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la pregunta');
    }
  }

  return (
    <div className="vivo-tarjeta vivo-quiz">
      {preguntas.length === 0 && editando !== 'nueva' && (
        <p className="vivo-nota vivo-nota--aviso">Este quiz no tiene preguntas. Agregá al menos una antes de publicar.</p>
      )}
      {preguntas.map((p, i) => (
        <div key={p.id} className="vivo-pregunta">
          {editando === p.id ? (
            <FormularioPregunta form={form} setForm={setForm} onSubmit={guardarPregunta} onCancelar={() => { setEditando(null); setForm(null); }} />
          ) : (
            <>
              <div className="vivo-pregunta-cabecera">
                <p className="vivo-pregunta-enunciado">{i + 1}. {p.enunciado}</p>
                <div className="vivo-mini-acciones vivo-mini-acciones--visibles">
                  <button type="button" onClick={() => empezar(p)} aria-label="Editar pregunta" title="Editar"><IconoLapiz /></button>
                  <button type="button" onClick={() => onEliminarPregunta(p.id)} aria-label="Eliminar pregunta" title="Eliminar" className="vivo-peligro"><IconoBasura /></button>
                </div>
              </div>
              <ul className="vivo-opciones">
                {['A', 'B', 'C', 'D'].filter((l) => p[`opcion${l}`]).map((l) => (
                  <li key={l} className={p.respuestaCorrecta === l ? 'correcta' : ''}>
                    <span className="vivo-opcion-letra">{l}</span>
                    <span>{p[`opcion${l}`]}</span>
                    {p.respuestaCorrecta === l && <span className="vivo-opcion-ok"><IconoCheck /> Correcta</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
      {editando === 'nueva' ? (
        <div className="vivo-pregunta">
          <FormularioPregunta form={form} setForm={setForm} onSubmit={guardarPregunta} onCancelar={() => { setEditando(null); setForm(null); }} />
        </div>
      ) : (
        <button type="button" className="vivo-agregar-clase" onClick={() => empezar('nueva')}><IconoMas /> Agregar pregunta</button>
      )}
      {error && <p className="modal-nuevo-curso-error">{error}</p>}
    </div>
  );
}

/* ============================================================
 * Página del curso: igual que la página de venta
 * ============================================================ */
function PaginaCursoEnVivo({
  general, categorias, modulos, totalClases, faltantes, subiendoPortada, onCambiar, onSubirPortada, onIrA, onAbrirClase,
  instructores,
}) {
  const inputPortada = useRef(null);
  const [nuevoIncluye, setNuevoIncluye] = useState(null);
  const [nuevaEstadistica, setNuevaEstadistica] = useState(null);
  const [eligiendoNivel, setEligiendoNivel] = useState(false);
  const [abiertos, setAbiertos] = useState(() => new Set(modulos[0] ? [modulos[0].id] : []));

  const incluye = general.incluye;
  const estadisticas = general.estadisticas;
  const hayDescuento = general.precioOriginal && Number(general.precioOriginal) > Number(general.precio);
  const ahorro = hayDescuento ? Math.round((1 - Number(general.precio) / Number(general.precioOriginal)) * 100) : 0;

  function cambiarIncluye(i, texto) {
    onCambiar({ incluye: incluye.map((x, j) => (j === i ? texto : x)) });
  }
  function quitarIncluye(i) {
    onCambiar({ incluye: incluye.filter((_, j) => j !== i) });
    setNuevoIncluye(null);
  }
  function agregarIncluye() {
    setNuevoIncluye(incluye.length);
    onCambiar({ incluye: [...incluye, ''] });
  }

  function cambiarEstadistica(i, cambios) {
    onCambiar({ estadisticas: estadisticas.map((e, j) => (j === i ? { ...e, ...cambios } : e)) });
  }
  function quitarEstadistica(i) {
    onCambiar({ estadisticas: estadisticas.filter((_, j) => j !== i) });
    setNuevaEstadistica(null);
  }
  function agregarEstadistica() {
    setNuevaEstadistica(estadisticas.length);
    onCambiar({ estadisticas: [...estadisticas, { icono: 'duracion', titulo: '', subtitulo: '' }] });
  }
  function siguienteIcono(actual) {
    const i = ICONOS_DISPONIBLES.findIndex((o) => o.value === actual);
    return ICONOS_DISPONIBLES[(i + 1) % ICONOS_DISPONIBLES.length].value;
  }

  return (
    <div className="vivo-pagina">
      <div className="vivo-pagina-principal">
        <nav className="vivo-pagina-migas">Cursos <span>/</span> {general.categoria || 'Categoría'}</nav>

        <div className="vivo-chips">
          <div className="vivo-chip-editable vivo-chip-editable--dorado">
            <Editable
              valor={general.categoria}
              onGuardar={(categoria) => onCambiar({ categoria })}
              etiqueta="categoría"
              lista="vivo-categorias"
              placeholder="Categoría"
              maxLength={60}
              obligatorio
            />
          </div>
          {datalistCategorias(categorias)}
          {eligiendoNivel ? (
            <div className="vivo-niveles" role="radiogroup" aria-label="Nivel">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={general.nivel === n}
                  className={`vivo-chip ${general.nivel === n ? 'vivo-chip--activo' : ''}`}
                  onClick={() => { onCambiar({ nivel: general.nivel === n ? '' : n }); setEligiendoNivel(false); }}
                >
                  {n}
                </button>
              ))}
              <button type="button" className="vivo-icono-boton" aria-label="Cerrar" onClick={() => setEligiendoNivel(false)}><IconoX /></button>
            </div>
          ) : (
            <div className="vivo-chip-editable">
              <div className="vivo-editable">
                <span className={`vivo-editable-texto ${general.nivel ? '' : 'vacio'}`}>{general.nivel || 'Nivel'}</span>
                <button type="button" className="vivo-lapiz" onClick={() => setEligiendoNivel(true)} aria-label="Editar nivel" title="Editar"><IconoLapiz /></button>
              </div>
            </div>
          )}
        </div>

        <Editable
          valor={general.titulo}
          onGuardar={(titulo) => onCambiar({ titulo })}
          etiqueta="título del curso"
          placeholder="Título del curso"
          className="vivo-pagina-titulo"
          maxLength={200}
          obligatorio
        />

        <Editable
          valor={general.descripcion}
          onGuardar={(descripcion) => onCambiar({ descripcion })}
          etiqueta="descripción"
          placeholder="Contá de qué se trata el curso, para quién es y qué va a lograr el alumno."
          className="vivo-pagina-descripcion"
          multilinea
        />

        <div className="vivo-stats">
          <div className="vivo-stat vivo-stat--modulos">
            <span className="vivo-stat-icono"><IconoCapas /></span>
            <span className="vivo-stat-texto vivo-stat-texto--inline"><span className="vivo-stat-valor">{modulos.length}</span><span className="vivo-stat-label">Módulos</span></span>
          </div>
          <div className="vivo-stat vivo-stat--clases">
            <span className="vivo-stat-icono"><IconoClases /></span>
            <span className="vivo-stat-texto vivo-stat-texto--inline"><span className="vivo-stat-valor">{totalClases}</span><span className="vivo-stat-label">Clases</span></span>
          </div>
          {estadisticas.map((est, i) => {
            const icono = ICONO_STAT[est.icono] ? est.icono : 'general';
            return (
              <div key={i} className={`vivo-stat vivo-stat--${icono} vivo-stat--editable`}>
                <button type="button" className="vivo-stat-icono vivo-stat-icono--boton" onClick={() => cambiarEstadistica(i, { icono: siguienteIcono(icono) })} title="Tocá para cambiar el ícono" aria-label="Cambiar ícono">
                  {ICONO_STAT[icono].icono}
                </button>
                <span className="vivo-stat-texto">
                  <Editable
                    valor={est.titulo}
                    onGuardar={(titulo) => cambiarEstadistica(i, { titulo })}
                    onVaciar={() => quitarEstadistica(i)}
                    etiqueta="dato destacado"
                    placeholder="Ej: 4 horas"
                    className="vivo-stat-valor-chica"
                    maxLength={40}
                    autoEditar={i === nuevaEstadistica}
                  />
                  <Editable
                    valor={est.subtitulo}
                    onGuardar={(subtitulo) => cambiarEstadistica(i, { subtitulo })}
                    etiqueta="detalle del dato"
                    placeholder="Detalle (opcional)"
                    className="vivo-stat-label"
                    maxLength={60}
                  />
                </span>
                <button type="button" className="vivo-icono-boton vivo-peligro vivo-stat-quitar" aria-label="Quitar dato" title="Quitar" onClick={() => quitarEstadistica(i)}><IconoX /></button>
              </div>
            );
          })}
          <button type="button" className="vivo-stat vivo-stat--agregar" onClick={agregarEstadistica}>
            <IconoMas /> Agregar dato destacado
          </button>
        </div>

        <div className="vivo-programa-cabecera">
          <h2 className="vivo-pagina-seccion">Programa</h2>
          <button type="button" className="vivo-chip" onClick={() => onIrA({ vista: 'clases' })}><IconoLapiz /> Editar clases</button>
        </div>
        {modulos.length === 0 ? (
          <button type="button" className="vivo-tarjeta vivo-notas vivo-notas--vacio" onClick={() => onIrA({ vista: 'clases' })}>
            Todavía no hay módulos. Armalos en la pestaña Clases.
          </button>
        ) : (
          <div className="vivo-tarjeta vivo-programa">
            {modulos.map((m, i) => {
              const abierto = abiertos.has(m.id);
              return (
                <div key={m.id} className={`vivo-programa-modulo ${abierto ? 'abierto' : ''}`}>
                  <button
                    type="button"
                    className="vivo-programa-boton"
                    aria-expanded={abierto}
                    onClick={() => setAbiertos((a) => { const s = new Set(a); if (s.has(m.id)) s.delete(m.id); else s.add(m.id); return s; })}
                  >
                    <span className="vivo-programa-numero">{String(i + 1).padStart(2, '0')}</span>
                    <span className="vivo-programa-info">
                      <span className="vivo-programa-titulo">{m.titulo}</span>
                      <span className="vivo-programa-meta">{m.contenidos.length} {m.contenidos.length === 1 ? 'clase' : 'clases'}</span>
                    </span>
                    <IconoAbajo />
                  </button>
                  {abierto && (
                    <ul className="vivo-programa-clases">
                      {m.contenidos.map((c) => (
                        <li key={c.id}>
                          <button type="button" onClick={() => onAbrirClase(c)}>
                            <span className="vivo-programa-clase-icono">{c.tipo === 'video' ? <IconoPlay /> : <IconoTexto />}</span>
                            <span className={c.visible === false ? 'oculta' : ''}>{c.titulo}</span>
                            <IconoDer />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="vivo-pagina-compra">
        <div className="vivo-tarjeta vivo-compra">
          <button type="button" className="vivo-portada" onClick={() => inputPortada.current?.click()} disabled={subiendoPortada}>
            {general.imagenPortada ? (
              <img src={general.imagenPortada} alt="" />
            ) : (
              <span className="vivo-portada-vacia"><IconoImagen /> Subir portada</span>
            )}
            {general.imagenPortada && <span className="vivo-portada-cambiar"><IconoLapiz /> {subiendoPortada ? 'Subiendo…' : 'Cambiar portada'}</span>}
            {!general.imagenPortada && subiendoPortada && <span className="vivo-portada-cambiar">Subiendo…</span>}
          </button>
          <input ref={inputPortada} type="file" accept="image/*" hidden onChange={onSubirPortada} />

          <div className="vivo-compra-cuerpo">
            <div className="vivo-precio-fila">
              <Editable
                valor={general.precio ? String(general.precio) : ''}
                onGuardar={(precio) => onCambiar({ precio })}
                etiqueta="precio"
                placeholder="Precio"
                tipo="number"
                formato={formatearPesos}
                className="vivo-precio"
              />
              <Editable
                valor={general.precioOriginal ? String(general.precioOriginal) : ''}
                onGuardar={(precioOriginal) => onCambiar({ precioOriginal })}
                etiqueta="precio anterior"
                placeholder="Precio anterior"
                tipo="number"
                formato={formatearPesos}
                className="vivo-precio-original"
              />
              {hayDescuento && <span className="vivo-ahorro">Ahorrás {ahorro}%</span>}
            </div>

            <ul className="vivo-incluye">
              {incluye.map((item, i) => (
                <li key={i}>
                  <span className="vivo-incluye-check"><IconoCheck /></span>
                  <Editable
                    valor={item}
                    onGuardar={(texto) => cambiarIncluye(i, texto)}
                    onVaciar={() => quitarIncluye(i)}
                    etiqueta={`ítem ${i + 1} de lo que incluye`}
                    placeholder="Ej: archivos de proyecto"
                    maxLength={120}
                    autoEditar={i === nuevoIncluye}
                  />
                  <button type="button" className="vivo-icono-boton vivo-peligro" aria-label="Quitar ítem" title="Quitar" onClick={() => quitarIncluye(i)}><IconoX /></button>
                </li>
              ))}
            </ul>
            <button type="button" className="vivo-agregar-clase vivo-agregar-incluye" onClick={agregarIncluye}><IconoMas /> Agregar qué incluye</button>

            <span className="vivo-boton-comprar" aria-hidden="true">Inscribirme{general.precio ? ` — ${formatearPesos(general.precio)}` : ''}</span>

            <button
              type="button"
              className={`vivo-certificado ${general.emiteCertificado ? 'activo' : ''}`}
              onClick={() => onCambiar({ emiteCertificado: !general.emiteCertificado })}
              aria-pressed={general.emiteCertificado}
            >
              <span className="vivo-certificado-perilla" />
              {general.emiteCertificado ? 'Entrega certificado al terminar' : 'Sin certificado'}
            </button>
          </div>
        </div>

        <div className={`vivo-tarjeta vivo-checklist ${faltantes.length === 0 ? 'listo' : ''}`}>
          {faltantes.length === 0 ? (
            <p><IconoCheck /> Listo para publicar</p>
          ) : (
            <>
              <p>Para publicar falta:</p>
              <ul>
                {faltantes.map((f) => (
                  <li key={f.texto}>
                    {f.vista === 'clases' ? <button type="button" onClick={() => onIrA(f)}>{f.texto}</button> : f.texto}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {instructores}
      </aside>
    </div>
  );
}

/* ============================================================
 * Instructores del curso (como la tarjeta de la página de venta)
 * El admin agrega o saca instructores; cada uno decide su rol y si se muestra.
 * ============================================================ */
function InstructoresCurso({ curso, setCurso, esAdmin, idUsuario, onSalir, onError }) {
  const [disponibles, setDisponibles] = useState([]);
  const [elegido, setElegido] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const lista = curso.colaboradores || [];
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (esAdmin) listarInstructoresRequest().then(setDisponibles).catch(() => {});
  }, [esAdmin]);

  async function ejecutar(accion, mensajeError) {
    setOcupado(true);
    try {
      const actualizado = await accion();
      if (actualizado?.colaboradores) setCurso((c) => ({ ...c, colaboradores: actualizado.colaboradores }));
      return true;
    } catch (err) {
      onError(err.response?.data?.error || mensajeError);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function agregar() {
    if (!elegido) return;
    if (await ejecutar(() => agregarColaboradorCursoRequest(curso.id, elegido), 'No se pudo agregar al instructor')) setElegido('');
  }

  async function quitar(col) {
    const ok = await ejecutar(() => quitarColaboradorCursoRequest(curso.id, col.usuario.id), 'No se pudo sacar al instructor');
    if (ok && col.usuario.id === idUsuario && !esAdmin) onSalir();
  }

  async function alSoltar({ active, over }) {
    if (!over || active.id === over.id) return;
    const desde = lista.findIndex((c) => c.usuario.id === active.id);
    const hasta = lista.findIndex((c) => c.usuario.id === over.id);
    if (desde < 0 || hasta < 0) return;
    const nueva = arrayMove(lista, desde, hasta).map((c, i) => ({ ...c, orden: i }));
    setCurso((c) => ({ ...c, colaboradores: nueva }));
    await ejecutar(async () => {
      let ultimo = null;
      for (const c of nueva) {
        const original = lista.find((x) => x.usuario.id === c.usuario.id);
        // eslint-disable-next-line no-await-in-loop
        if (original.orden !== c.orden) ultimo = await actualizarColaboradorCursoRequest(curso.id, c.usuario.id, { orden: c.orden });
      }
      return ultimo;
    }, 'No se pudo cambiar el orden');
  }

  const elegibles = disponibles.filter((u) => !lista.some((c) => c.usuario.id === u.id));

  return (
    <div className="vivo-tarjeta vivo-instructores">
      <div className="vivo-instructores-cabecera">
        <p>Instructores</p>
        <span>Arrastrá para ordenar</span>
      </div>
      {lista.length === 0 ? (
        <p className="vivo-nota">Todavía no hay instructores en este curso.</p>
      ) : (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={lista.map((c) => c.usuario.id)} strategy={verticalListSortingStrategy}>
            <ul className="vivo-instructores-lista">
              {lista.map((col) => (
                <InstructorFila
                  key={col.usuario.id}
                  col={col}
                  esCreador={col.usuario.id === curso.idAdminCreador}
                  puedeSacar={esAdmin || col.usuario.id === idUsuario}
                  esYo={col.usuario.id === idUsuario}
                  ocupado={ocupado}
                  onEtiqueta={(etiqueta) => ejecutar(() => actualizarColaboradorCursoRequest(curso.id, col.usuario.id, { etiqueta }), 'No se pudo guardar el rol')}
                  onVisible={() => ejecutar(() => actualizarColaboradorCursoRequest(curso.id, col.usuario.id, { visible: !col.visible }), 'No se pudo cambiar')}
                  onQuitar={() => quitar(col)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {esAdmin ? (
        <div className="vivo-instructores-agregar">
          <select className="admin-input" value={elegido} onChange={(e) => setElegido(e.target.value)} aria-label="Instructor para agregar">
            <option value="">Agregar instructor…</option>
            {elegibles.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
          </select>
          <button type="button" className="admin-boton-primario" disabled={!elegido || ocupado} onClick={agregar}><IconoMas /> Agregar</button>
        </div>
      ) : (
        <p className="vivo-nota">Solo el administrador puede sumar instructores.</p>
      )}
    </div>
  );
}

function InstructorFila({ col, esCreador, puedeSacar, esYo, ocupado, onEtiqueta, onVisible, onQuitar }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: col.usuario.id });
  const nombre = `${col.usuario.nombre} ${col.usuario.apellido}`;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`vivo-instructor ${isDragging ? 'arrastrado' : ''} ${col.visible ? '' : 'oculto'}`}
      {...attributes}
      {...listeners}
      aria-roledescription="instructor arrastrable"
    >
      <span className="vivo-agarrar" aria-hidden="true"><IconoAgarrar /></span>
      {col.usuario.fotoPerfil ? (
        <img className="vivo-instructor-foto" src={col.usuario.fotoPerfil} alt="" />
      ) : (
        <span className="vivo-instructor-foto" aria-hidden="true">{col.usuario.nombre?.[0] || '?'}</span>
      )}
      <div className="vivo-instructor-datos">
        <span className="vivo-instructor-nombre">{nombre}{esCreador && <span className="vivo-instructor-creador"> · creador</span>}</span>
        <Editable
          valor={col.etiqueta || ''}
          onGuardar={onEtiqueta}
          etiqueta={`rol de ${nombre}`}
          placeholder="Rol (ej: Productor musical)"
          className="vivo-instructor-rol"
          maxLength={80}
        />
      </div>
      <button
        type="button"
        className={`vivo-icono-boton ${col.visible ? 'vivo-instructor-visible' : ''}`}
        onClick={onVisible}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={ocupado}
        aria-label={col.visible ? `Ocultar a ${nombre} de la página` : `Mostrar a ${nombre} en la página`}
        title={col.visible ? 'Se muestra en la página del curso' : 'No se muestra en la página del curso'}
      >
        {col.visible ? <IconoOjo /> : <IconoOjoTachado />}
      </button>
      {puedeSacar && (
        <button
          type="button"
          className="vivo-icono-boton vivo-peligro"
          onClick={onQuitar}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={ocupado}
          aria-label={esYo ? 'Sacarme del curso' : `Sacar a ${nombre}`}
          title={esYo ? 'Sacarme del curso' : 'Sacar del curso'}
        >
          <IconoX />
        </button>
      )}
    </li>
  );
}

// Sugerencias de categorías ya usadas (se muestran al escribir la categoría)
function datalistCategorias(categorias) {
  return (
    <datalist id="vivo-categorias">
      {categorias.map((c) => <option key={c} value={c} />)}
    </datalist>
  );
}

export default EditorCursoVivo;
