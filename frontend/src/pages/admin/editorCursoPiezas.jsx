// Piezas del editor de cursos (EditorCursoVivo): íconos de los datos destacados
// y el formulario de una pregunta de quiz.

// Íconos para los "datos destacados" de la página del curso (mismos que usa la página de venta)
export const ICONOS_DISPONIBLES = [
  {
    value: 'duracion',
    label: 'Duración',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    value: 'practicas',
    label: 'Prácticas',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    value: 'software',
    label: 'Software',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="4" width="20" height="13" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: 'certificacion',
    label: 'Certificación',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="6" /><path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    ),
  },
  {
    value: 'general',
    label: 'General',
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
      </svg>
    ),
  },
];

// Formulario para crear o editar una pregunta de quiz (2 a 4 opciones)
export function FormularioPregunta({ form, setForm, onSubmit, onCancelar }) {
  if (!form) return null;

  // A y B son siempre obligatorias. C existe solo si form.opcionC no es null,
  // y D solo puede existir si C ya existe (para no dejar "huecos" en las opciones).
  const tieneC = form.opcionC !== null && form.opcionC !== undefined;
  const tieneD = form.opcionD !== null && form.opcionD !== undefined;
  const letrasPresentes = ['A', 'B', ...(tieneC ? ['C'] : []), ...(tieneD ? ['D'] : [])];

  function agregarOpcion(letra) {
    setForm((p) => ({ ...p, [`opcion${letra}`]: '' }));
  }

  function quitarOpcion(letra) {
    setForm((p) => {
      const actualizado = { ...p, [`opcion${letra}`]: null, [`explicacion${letra}`]: '' };
      // Si se quita C, D tampoco puede seguir existiendo (no puede haber D sin C).
      if (letra === 'C') {
        actualizado.opcionD = null;
        actualizado.explicacionD = '';
      }
      // Si la respuesta correcta apuntaba a la opción que se está quitando (o a D al quitar C),
      // volvemos a A para no dejar una respuesta correcta inválida.
      if (p.respuestaCorrecta === letra || (letra === 'C' && p.respuestaCorrecta === 'D')) {
        actualizado.respuestaCorrecta = 'A';
      }
      return actualizado;
    });
  }

  return (
    <form onSubmit={onSubmit} className="editor-curso-pregunta-form">
      <div className="editor-curso-pregunta-campo editor-curso-pregunta-campo--enunciado">
        <label>Enunciado</label>
        <textarea value={form.enunciado} onChange={(e) => setForm((p) => ({ ...p, enunciado: e.target.value }))} className="admin-input" rows={2} required />
      </div>

      <div className="editor-curso-pregunta-opciones-grid">
        {['A', 'B'].map((letra) => (
          <div key={letra} className="editor-curso-pregunta-opcion-campo">
            <label>Opción {letra}</label>
            <input
              type="text"
              value={form[`opcion${letra}`] ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, [`opcion${letra}`]: e.target.value }))}
              className="admin-input"
              required
            />
            <input
              type="text"
              placeholder="Explicación (opcional)"
              value={form[`explicacion${letra}`] ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, [`explicacion${letra}`]: e.target.value }))}
              className="admin-input admin-input-sm"
            />
          </div>
        ))}

        {tieneC && (
          <div className="editor-curso-pregunta-opcion-campo">
            <div className="editor-curso-pregunta-opcion-campo-header">
              <label>Opción C</label>
              <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => quitarOpcion('C')}>Quitar</button>
            </div>
            <input
              type="text"
              value={form.opcionC ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, opcionC: e.target.value }))}
              className="admin-input"
              required
            />
            <input
              type="text"
              placeholder="Explicación (opcional)"
              value={form.explicacionC ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, explicacionC: e.target.value }))}
              className="admin-input admin-input-sm"
            />
          </div>
        )}

        {tieneC && tieneD && (
          <div className="editor-curso-pregunta-opcion-campo">
            <div className="editor-curso-pregunta-opcion-campo-header">
              <label>Opción D</label>
              <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => quitarOpcion('D')}>Quitar</button>
            </div>
            <input
              type="text"
              value={form.opcionD ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, opcionD: e.target.value }))}
              className="admin-input"
              required
            />
            <input
              type="text"
              placeholder="Explicación (opcional)"
              value={form.explicacionD ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, explicacionD: e.target.value }))}
              className="admin-input admin-input-sm"
            />
          </div>
        )}

        {(!tieneC || !tieneD) && (
          <div className="editor-curso-pregunta-opcion-campo editor-curso-pregunta-opcion-campo--agregar">
            {!tieneC && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => agregarOpcion('C')}>+ Agregar opción C</button>
            )}
            {tieneC && !tieneD && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => agregarOpcion('D')}>+ Agregar opción D</button>
            )}
          </div>
        )}
      </div>

      <div className="editor-curso-pregunta-pie">
        <div className="editor-curso-pregunta-campo editor-curso-pregunta-campo--respuesta">
          <label>Respuesta correcta</label>
          <select value={form.respuestaCorrecta} onChange={(e) => setForm((p) => ({ ...p, respuestaCorrecta: e.target.value }))} className="admin-input">
            {letrasPresentes.map((letra) => (
              <option key={letra} value={letra}>{letra}</option>
            ))}
          </select>
        </div>
        <div className="editor-curso-pregunta-pie-acciones">
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn-success btn-sm">Guardar pregunta</button>
        </div>
      </div>
    </form>
  );
}
