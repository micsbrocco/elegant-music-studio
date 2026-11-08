import DOMPurify from 'dompurify';

// Mismas reglas que el backend (utils/htmlSeguro.js): solo formato de texto.
// Se aplica también al mostrar, por si quedó guardado algo de antes.
const OPCIONES = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'p', 'br', 'h1', 'h2', 'h3', 'div', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

// Los links se abren aparte y sin acceso a esta página
DOMPurify.addHook('afterSanitizeAttributes', (nodo) => {
  if (nodo.tagName === 'A' && nodo.getAttribute('href')) {
    nodo.setAttribute('target', '_blank');
    nodo.setAttribute('rel', 'noopener noreferrer');
  }
});

export function htmlSeguro(html) {
  return DOMPurify.sanitize(html || '', OPCIONES);
}
