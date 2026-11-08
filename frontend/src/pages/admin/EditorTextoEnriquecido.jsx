import { useRef, useEffect, useCallback, useState } from 'react';
import { htmlSeguro } from '../../utils/htmlSeguro';

function IconoNegrita() {
  return <span style={{ fontWeight: 800 }}>B</span>;
}
function IconoItalica() {
  return <span style={{ fontStyle: 'italic' }}>I</span>;
}
function IconoSubrayado() {
  return <span style={{ textDecoration: 'underline' }}>U</span>;
}
function IconoListaVinetas() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconoListaNumerada() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10h2" strokeLinecap="round" />
      <path d="M4 13h2c0 0 -2 1.5 -2 3h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconoEnlace() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07l1.5-1.5" />
    </svg>
  );
}

const COMANDOS_TOGGLE = ['bold', 'italic', 'underline'];

// Etiquetas que se conservan al pegar contenido de afuera (Word, Google Docs,
// una página web, etc.). Todo lo demás (spans/divs envoltorio, estilos en
// línea con la tipografía/color de origen, clases, atributos "face"/"color")
// se descarta para que el contenido pegado siempre termine con la única
// tipografía del editor, sin importar de dónde se lo copió.
const ETIQUETAS_PERMITIDAS_AL_PEGAR = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'P', 'BR', 'H1', 'H2', 'H3']);

function limpiarHtmlPegado(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function limpiar(nodo) {
    [...nodo.childNodes].forEach((hijo) => {
      if (hijo.nodeType === Node.ELEMENT_NODE) {
        // Primero se limpian los hijos (así, si el nodo se "desenvuelve" más
        // abajo, lo que sube ya quedó limpio).
        limpiar(hijo);

        if (hijo.tagName === 'A') {
          const href = hijo.getAttribute('href') || '';
          [...hijo.attributes].forEach((attr) => hijo.removeAttribute(attr.name));
          if (href) hijo.setAttribute('href', href);
        } else {
          hijo.removeAttribute('style');
          hijo.removeAttribute('class');
          hijo.removeAttribute('face');
          hijo.removeAttribute('color');
          hijo.removeAttribute('size');
        }

        if (!ETIQUETAS_PERMITIDAS_AL_PEGAR.has(hijo.tagName)) {
          // No es una etiqueta de las permitidas (span, div, font, etc. que
          // solo traían formato de origen): se reemplaza por su contenido,
          // sin perder el texto.
          while (hijo.firstChild) hijo.parentNode.insertBefore(hijo.firstChild, hijo);
          hijo.parentNode.removeChild(hijo);
        }
      } else if (hijo.nodeType !== Node.TEXT_NODE) {
        // Comentarios u otros nodos que a veces trae el HTML de Word: fuera.
        hijo.parentNode.removeChild(hijo);
      }
    });
  }

  limpiar(doc.body);
  return doc.body.innerHTML;
}

function textoPlanoAHtml(texto) {
  const div = document.createElement('div');
  return texto
    .split(/\r?\n/)
    .map((linea) => {
      div.textContent = linea;
      return div.innerHTML || '<br>';
    })
    .join('<br>');
}

// Editor de texto enriquecido simple, basado en contentEditable, para las clases de tipo texto.
// Guarda y carga HTML plano (compatible con lecciones viejas guardadas como texto simple).
function EditorTextoEnriquecido({ value, onChange, placeholder }) {
  const areaRef = useRef(null);
  // Arranca en null para que el efecto de abajo cargue el contenido en el área
  // apenas se monta. Si arrancara igual a "value", al volver a mostrar el editor
  // (por ejemplo, cambiando de la pestaña "Contenido" a "Video") el área
  // quedaría vacía aunque el texto siga guardado en el borrador.
  const valorInterno = useRef(null);
  const rangoGuardado = useRef(null);
  const [estadoActivo, setEstadoActivo] = useState({ bold: false, italic: false, underline: false });

  useEffect(() => {
    if (areaRef.current && value !== valorInterno.current) {
      areaRef.current.innerHTML = htmlSeguro(value);
      valorInterno.current = value || '';
    }
  }, [value]);

  const emitirCambio = useCallback(() => {
    if (!areaRef.current) return;
    const html = areaRef.current.innerHTML;
    valorInterno.current = html;
    onChange(html);
  }, [onChange]);

  // El contentEditable no nos avisa cuándo cambia la selección, así que la guardamos nosotros
  // cada vez que el usuario hace clic o mueve el cursor adentro del área. Así, cuando se usa un
  // botón o el selector de título (que le sacan el foco al área un instante), sabemos exactamente
  // dónde había que aplicar el formato.
  function guardarSeleccion() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && areaRef.current && areaRef.current.contains(sel.anchorNode)) {
      rangoGuardado.current = sel.getRangeAt(0).cloneRange();
    }
    actualizarEstadoActivo();
  }

  function restaurarSeleccion() {
    if (!rangoGuardado.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rangoGuardado.current);
  }

  function actualizarEstadoActivo() {
    setEstadoActivo({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }

  // El navegador guarda el estado de negrita/cursiva/subrayado a nivel de documento, no por cada
  // editor: si se activó en una clase, al pasar a otra clase vacía el texto nuevo arranca con ese
  // mismo formato "pegado". Al enfocar un editor vacío, apagamos cualquier formato que haya
  // quedado prendido de otra clase para que siempre arranque en texto normal.
  function handleFocus() {
    if (areaRef.current && areaRef.current.textContent.trim() === '') {
      COMANDOS_TOGGLE.forEach((comando) => {
        if (document.queryCommandState(comando)) {
          document.execCommand(comando);
        }
      });
    }
    guardarSeleccion();
  }

  function ejecutarComando(comando, valorArg) {
    areaRef.current?.focus();
    restaurarSeleccion();
    document.execCommand(comando, false, valorArg);
    guardarSeleccion();
    emitirCambio();
  }

  // Al pegar, se descarta la tipografía/color/formato que traiga el origen
  // (Word, Google Docs, una web) y solo se conserva el texto con el formato
  // básico que el propio editor sabe mostrar (negrita, cursiva, listas,
  // enlaces, títulos). Así el contenido siempre queda en una sola tipografía,
  // sea cual sea la fuente desde donde se copió.
  function handlePaste(e) {
    e.preventDefault();
    areaRef.current?.focus();
    restaurarSeleccion();
    const html = e.clipboardData.getData('text/html');
    const contenido = htmlSeguro(html ? limpiarHtmlPegado(html) : textoPlanoAHtml(e.clipboardData.getData('text/plain')));
    document.execCommand('insertHTML', false, contenido);
    guardarSeleccion();
    emitirCambio();
  }

  function handleEnlace() {
    const url = window.prompt('Pegá la URL del enlace:');
    if (url) ejecutarComando('createLink', url);
  }

  function handleCambiarTitulo(e) {
    const valor = e.target.value;
    if (valor) ejecutarComando('formatBlock', valor);
    e.target.value = '';
  }

  return (
    <div className="editor-rte">
      <div className="editor-rte-toolbar">
        <select className="editor-rte-select" title="Título" defaultValue="" onChange={handleCambiarTitulo}>
          <option value="">Título...</option>
          <option value="<h1>">Título 1</option>
          <option value="<h2>">Título 2</option>
          <option value="<h3>">Título 3</option>
          <option value="<p>">Texto normal</option>
        </select>
        <span className="editor-rte-separador" />
        <button type="button" className={`editor-rte-btn ${estadoActivo.bold ? 'activo' : ''}`} title="Negrita" onMouseDown={(e) => e.preventDefault()} onClick={() => ejecutarComando('bold')}>
          <IconoNegrita />
        </button>
        <button type="button" className={`editor-rte-btn ${estadoActivo.italic ? 'activo' : ''}`} title="Cursiva" onMouseDown={(e) => e.preventDefault()} onClick={() => ejecutarComando('italic')}>
          <IconoItalica />
        </button>
        <button type="button" className={`editor-rte-btn ${estadoActivo.underline ? 'activo' : ''}`} title="Subrayado" onMouseDown={(e) => e.preventDefault()} onClick={() => ejecutarComando('underline')}>
          <IconoSubrayado />
        </button>
        <button type="button" className="editor-rte-btn" title="Lista con viñetas" onMouseDown={(e) => e.preventDefault()} onClick={() => ejecutarComando('insertUnorderedList')}>
          <IconoListaVinetas />
        </button>
        <button type="button" className="editor-rte-btn" title="Lista numerada" onMouseDown={(e) => e.preventDefault()} onClick={() => ejecutarComando('insertOrderedList')}>
          <IconoListaNumerada />
        </button>
        <button type="button" className="editor-rte-btn" title="Enlace" onMouseDown={(e) => e.preventDefault()} onClick={handleEnlace}>
          <IconoEnlace />
        </button>
      </div>
      <div
        ref={areaRef}
        className="editor-rte-area"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || 'Escribí el contenido de la clase...'}
        onFocus={handleFocus}
        onMouseUp={guardarSeleccion}
        onKeyUp={guardarSeleccion}
        onInput={() => { guardarSeleccion(); emitirCambio(); }}
        onPaste={handlePaste}
        onBlur={emitirCambio}
      />
    </div>
  );
}

export default EditorTextoEnriquecido;
