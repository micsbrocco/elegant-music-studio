import { useState, useEffect } from 'react';

const RETRASO_MS = 150;

export function Cargando({ children, oscuro = false, retraso = RETRASO_MS }) {
  const [visible, setVisible] = useState(retraso === 0);

  useEffect(() => {
    if (retraso === 0) return undefined;
    const t = setTimeout(() => setVisible(true), retraso);
    return () => clearTimeout(t);
  }, [retraso]);

  if (!visible) return null;
  return (
    <div className={`skel-envoltorio ${oscuro ? 'skel-oscuro' : ''}`} role="status" aria-busy="true" aria-live="polite">
      <span className="skel-solo-lectores">Cargando...</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

// Pieza básica. ancho/alto aceptan número (px) o cualquier medida CSS.
export function Skeleton({ ancho = '100%', alto = 14, circulo = false, radio, className = '' }) {
  const style = { width: ancho, height: alto };
  if (radio !== undefined) style.borderRadius = radio;
  return <span className={`skel ${circulo ? 'skel--circulo' : ''} ${className}`} style={style} />;
}

export function SkeletonTexto({ lineas = 3, ultima = '60%' }) {
  return (
    <div className="skel-pila">
      {Array.from({ length: lineas }).map((_, i) => (
        <Skeleton key={i} ancho={i === lineas - 1 && lineas > 1 ? ultima : '100%'} alto={14} />
      ))}
    </div>
  );
}

/* ---------------- Panel de administración ---------------- */

function TarjetaStat() {
  return (
    <div className="admin-dash-stat">
      <div className="admin-dash-stat-top">
        <Skeleton ancho={44} alto={44} circulo />
        <div className="skel-pila skel-pila--crece">
          <Skeleton ancho="55%" alto={28} />
          <Skeleton ancho="75%" alto={14} />
        </div>
      </div>
      <Skeleton ancho="65%" alto={12} />
    </div>
  );
}

function FilasTabla({ filas, columnas }) {
  const anchos = ['70%', '55%', '40%', '60%', '35%', '50%'];
  return (
    <div className="skel-tabla" style={{ '--skel-cols': columnas }}>
      <div className="skel-tabla-fila skel-tabla-fila--cabecera">
        {Array.from({ length: columnas }).map((_, c) => <Skeleton key={c} ancho="45%" alto={12} />)}
      </div>
      {Array.from({ length: filas }).map((_, f) => (
        <div key={f} className="skel-tabla-fila">
          {Array.from({ length: columnas }).map((__, c) => (
            <Skeleton key={c} ancho={anchos[(f + c) % anchos.length]} alto={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Tarjeta con título, acciones y tabla (Alumnos, Ventas, Instructores, Cursos…)
export function SkeletonTarjetaTabla({ filas = 6, columnas = 5, conBuscador = true }) {
  return (
    <div className="admin-card">
      <div className="skel-cabecera-tarjeta">
        <Skeleton ancho={200} alto={22} />
        <div className="skel-cabecera-acciones">
          {conBuscador && <Skeleton ancho={280} alto={36} radio={999} />}
          <Skeleton ancho={120} alto={36} />
        </div>
      </div>
      <FilasTabla filas={filas} columnas={columnas} />
    </div>
  );
}

function Encabezado({ ancho = 220 }) {
  return (
    <div className="admin-page-header">
      <Skeleton ancho={ancho} alto={32} />
    </div>
  );
}

// Páginas de lista del admin: título + una o más tarjetas con tabla
export function SkeletonListaAdmin({ tarjetas = 1, filas = 6, columnas = 5 }) {
  return (
    <Cargando>
      <Encabezado />
      {Array.from({ length: tarjetas }).map((_, i) => (
        <SkeletonTarjetaTabla key={i} filas={filas} columnas={columnas} />
      ))}
    </Cargando>
  );
}

export function SkeletonDashboardAdmin() {
  return (
    <Cargando>
      <div className="admin-dash">
        <div className="admin-dash-header"><Skeleton ancho={200} alto={32} /></div>
        <div className="admin-dash-stats">
          {[0, 1, 2, 3].map((i) => <TarjetaStat key={i} />)}
        </div>
        <div className="admin-dash-panel-grid">
          <div className="admin-dash-card">
            <div className="skel-cabecera-tarjeta">
              <Skeleton ancho={180} alto={22} />
              <Skeleton ancho={160} alto={32} radio={999} />
            </div>
            <Skeleton alto={240} radio={16} />
          </div>
          <div className="admin-dash-card">
            <Skeleton ancho={170} alto={22} className="skel-margen-abajo" />
            <div className="skel-pila skel-pila--amplia">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skel-fila-rank">
                  <Skeleton ancho={28} alto={28} circulo />
                  <div className="skel-pila skel-pila--crece">
                    <Skeleton ancho="70%" alto={14} />
                    <Skeleton alto={8} radio={999} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Cargando>
  );
}

export function SkeletonVentasAdmin() {
  return (
    <Cargando>
      <Encabezado ancho={260} />
      <div className="admin-dash-stats admin-dash-stats--3">
        {[0, 1, 2].map((i) => <TarjetaStat key={i} />)}
      </div>
      <div className="admin-card">
        <div className="skel-cabecera-tarjeta"><Skeleton ancho={180} alto={22} /></div>
        <div className="admin-curso-ventas-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel-tile-venta">
              <Skeleton ancho="60%" alto={16} />
              <Skeleton ancho="50%" alto={32} />
              <div className="skel-tile-cifras">
                <Skeleton alto={34} />
                <Skeleton alto={34} />
                <Skeleton alto={34} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <SkeletonTarjetaTabla filas={6} columnas={5} />
    </Cargando>
  );
}

export function SkeletonEditorCurso() {
  return (
    <Cargando>
      <div className="skel-editor-encabezado">
        <Skeleton ancho={340} alto={32} />
        <Skeleton ancho={150} alto={44} radio={999} />
      </div>
      <div className="skel-tabs">
        <Skeleton ancho={150} alto={20} />
        <Skeleton ancho={170} alto={20} />
      </div>
      <div className="admin-card skel-tarjeta-editor">
        <Skeleton ancho={220} alto={22} />
        <div className="skel-dos-col">
          <div className="skel-pila skel-pila--amplia skel-pila--crece">
            <Skeleton alto={40} />
            <Skeleton alto={110} />
            <Skeleton alto={100} />
          </div>
          <Skeleton ancho={300} alto={300} radio={16} className="skel-no-encoge" />
        </div>
      </div>
      <div className="skel-dos-col skel-dos-col--tarjetas">
        <div className="admin-card skel-pila skel-pila--amplia">
          <Skeleton ancho={180} alto={22} />
          <Skeleton alto={40} />
          <Skeleton alto={40} />
        </div>
        <div className="admin-card skel-pila skel-pila--amplia">
          <Skeleton ancho={220} alto={22} />
          <Skeleton alto={40} />
          <Skeleton alto={90} />
        </div>
      </div>
    </Cargando>
  );
}

export function SkeletonEditorLanding() {
  return (
    <Cargando>
      <div className="skel-dos-col skel-dos-col--lateral">
        <div className="admin-card skel-pila skel-pila--amplia skel-no-encoge">
          <Skeleton ancho="70%" alto={22} />
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} alto={40} />)}
        </div>
        <div className="admin-card skel-pila skel-pila--amplia skel-pila--crece">
          <Skeleton ancho={220} alto={22} />
          <Skeleton alto={90} />
          <Skeleton alto={90} />
        </div>
      </div>
    </Cargando>
  );
}

/* ---------------- Páginas públicas y del alumno ---------------- */

export function TarjetaCursoSkeleton() {
  return (
    <div className="course-card skel-tarjeta-curso">
      <Skeleton alto={170} radio={8} />
      <div className="course-card-body">
        <Skeleton ancho={80} alto={14} />
        <Skeleton ancho="85%" alto={20} />
        <SkeletonTexto lineas={2} />
        <div className="skel-tarjeta-curso-pie">
          <Skeleton ancho={70} alto={24} />
          <Skeleton ancho={100} alto={18} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCatalogo({ cantidad = 6 }) {
  return (
    <Cargando>
      <div className="courses-grid">
        {Array.from({ length: cantidad }).map((_, i) => <TarjetaCursoSkeleton key={i} />)}
      </div>
    </Cargando>
  );
}

export function SkeletonMisCursos() {
  return (
    <Cargando>
      <div className="portal-page">
        <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
          <div className="mc-bienvenida">
            <div>
              <Skeleton ancho={240} alto={36} className="skel-margen-abajo" />
              <Skeleton ancho={200} alto={16} />
            </div>
          </div>
          <div className="mc-destacado">
            <Skeleton alto={170} radio={16} />
            <div>
              <Skeleton ancho={160} alto={12} className="skel-margen-abajo" />
              <Skeleton ancho="70%" alto={26} className="skel-margen-abajo" />
              <Skeleton ancho="50%" alto={14} className="skel-margen-abajo" />
              <Skeleton alto={6} radio={999} />
            </div>
          </div>
          <Skeleton ancho={340} alto={42} radio={999} className="skel-margen-abajo" />
          <div className="mc-grilla">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mc-card">
                <Skeleton alto={150} radio={0} />
                <div className="mc-card-cuerpo">
                  <Skeleton ancho="80%" alto={18} />
                  <Skeleton alto={6} radio={999} />
                  <Skeleton ancho={100} alto={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Cargando>
  );
}

export function SkeletonDetalleCurso() {
  return (
    <Cargando>
      <div className="curso-detalle-page">
        <div className="container curso-detalle-grid">
          <div>
            <Skeleton ancho={180} alto={14} className="skel-margen-abajo" />
            <div className="skel-fila skel-margen-abajo">
              <Skeleton ancho={90} alto={24} radio={999} />
              <Skeleton ancho={70} alto={24} radio={999} />
            </div>
            <Skeleton ancho="75%" alto={44} className="skel-margen-abajo" />
            <SkeletonTexto lineas={3} />
            <div className="skel-fila skel-margen-arriba skel-margen-abajo">
              {[0, 1, 2].map((i) => <Skeleton key={i} ancho={130} alto={56} radio={16} />)}
            </div>
            <Skeleton ancho={240} alto={26} className="skel-margen-abajo" />
            <div className="skel-pila skel-pila--amplia">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} alto={60} radio={14} />)}
            </div>
          </div>
          <aside className="curso-sidebar">
            <div className="curso-sidebar-card">
              <Skeleton alto={180} radio={0} />
              <div className="curso-sidebar-body skel-pila skel-pila--amplia">
                <Skeleton ancho={120} alto={34} />
                <Skeleton alto={48} radio={999} />
                <SkeletonTexto lineas={3} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Cargando>
  );
}

export function SkeletonAprender() {
  let oscuro = true;
  try {
    oscuro = (localStorage.getItem('aprender-tema') || 'oscuro') === 'oscuro';
  } catch (e) {
    oscuro = true;
  }
  return (
    <Cargando oscuro={oscuro}>
      <div className={`aprender-page ${oscuro ? '' : 'aprender-tema-claro'}`}>
        <div className="aprender-subheader">
          <div className="aprender-subheader-inner">
            <Skeleton ancho={140} alto={16} />
          </div>
        </div>
        <div className="aprender-layout">
          <aside className="aprender-sidebar-izq">
            <div className="aprender-sidebar-scroll skel-pila skel-pila--amplia">
              <Skeleton ancho="80%" alto={22} />
              <Skeleton alto={70} radio={16} />
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} alto={44} radio={12} />)}
            </div>
          </aside>
          <div className="aprender-main-scroll">
            <div className="aprender-contenido-scroll skel-pila skel-pila--amplia">
              <Skeleton ancho="50%" alto={14} />
              <Skeleton ancho="65%" alto={34} />
              <div className="skel-video"><Skeleton alto="100%" radio={16} /></div>
              <SkeletonTexto lineas={3} />
            </div>
          </div>
        </div>
      </div>
    </Cargando>
  );
}

export function SkeletonPerfil() {
  return (
    <Cargando>
      <div className="perfil-page">
        <div className="container perfil-container">
          <div className="perfil-card skel-pila skel-pila--amplia">
            <div className="skel-fila">
              <Skeleton ancho={88} alto={88} circulo />
              <div className="skel-pila skel-pila--crece">
                <Skeleton ancho="45%" alto={26} />
                <Skeleton ancho="30%" alto={14} />
              </div>
            </div>
            <Skeleton alto={44} />
            <Skeleton alto={44} />
            <Skeleton alto={44} />
          </div>
        </div>
      </div>
    </Cargando>
  );
}

// Listas simples (carrito, favoritos) y formularios sueltos del admin
export function SkeletonLista({ filas = 3 }) {
  return (
    <Cargando>
      <div className="skel-pila skel-pila--amplia skel-contenedor-simple">
        <Skeleton ancho={220} alto={30} />
        {Array.from({ length: filas }).map((_, i) => <Skeleton key={i} alto={56} radio={14} />)}
      </div>
    </Cargando>
  );
}

export function SkeletonFormulario({ campos = 4 }) {
  return (
    <Cargando>
      <div className="skel-pila skel-pila--amplia skel-contenedor-simple">
        <Skeleton ancho={240} alto={30} />
        {Array.from({ length: campos }).map((_, i) => (
          <div key={i} className="skel-pila">
            <Skeleton ancho={120} alto={12} />
            <Skeleton alto={40} />
          </div>
        ))}
        <Skeleton ancho={140} alto={40} />
      </div>
    </Cargando>
  );
}
