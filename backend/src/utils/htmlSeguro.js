const sanitizeHtml = require('sanitize-html');

// El texto de las clases se guarda como HTML (negritas, listas, títulos, links).
// Antes de guardarlo se le saca todo lo que no sea formato: scripts, eventos
// (onclick, onerror...), estilos, iframes y links "javascript:". Así, aunque
// alguien mande HTML armado a mano a la API, no puede meter código en la página.
const OPCIONES = {
  allowedTags: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'p', 'br', 'h1', 'h2', 'h3', 'div', 'span'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    // Los links se abren aparte y sin darle acceso a la página que los abrió
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

function limpiarHtml(html) {
  if (html === null || html === undefined) return html;
  return sanitizeHtml(String(html), OPCIONES);
}

module.exports = { limpiarHtml };
