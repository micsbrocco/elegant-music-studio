/* ============================================================
 * Carga DATOS DE PRUEBA en la base: instructores, alumnos, cursos con
 * módulos y clases (video, texto y quiz), compras, progreso y favoritos.
 *
 * Uso (desde la carpeta backend):   node scripts/cargarDatosPrueba.js
 * Para borrarlos después:           node scripts/borrarDatosPrueba.js
 *
 * - No toca ni borra nada de lo que ya existe: solo agrega.
 * - Todo lo que crea se reconoce por el email @prueba.elegant.com (usuarios) y
 *   porque los cursos los "creó" un instructor de prueba. Así el script de
 *   borrado elimina exactamente esto y nada más.
 * - Si ya se cargaron, no los duplica (avisa y sale).
 * - Contraseña de todos los usuarios de prueba: Prueba123!
 * ============================================================ */
require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

const DOMINIO = '@prueba.elegant.com';
const PASSWORD = 'Prueba123!';
const DIA = 24 * 60 * 60 * 1000;

// Números "al azar" pero siempre los mismos en cada corrida (semilla fija)
let semilla = 20261027;
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
}
const entre = (min, max) => Math.floor(azar() * (max - min + 1)) + min;
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const haceDias = (dias) => new Date(Date.now() - dias * DIA - entre(0, 12 * 60) * 60 * 1000);
function sinAcentos(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const NOMBRES = ['Lucía', 'Tomás', 'Sofía', 'Martín', 'Valentina', 'Juan', 'Camila', 'Mateo', 'Martina', 'Santiago',
  'Julieta', 'Benjamín', 'Catalina', 'Joaquín', 'Agustina', 'Facundo', 'Florencia', 'Nicolás', 'Milagros', 'Lautaro',
  'Paula', 'Ignacio', 'Micaela', 'Franco', 'Abril', 'Gonzalo', 'Rocío', 'Thiago', 'Antonella', 'Bruno'];
const APELLIDOS = ['Gómez', 'Rodríguez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero',
  'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Suárez', 'Aguirre',
  'Giménez', 'Molina', 'Castro', 'Ortiz', 'Silva', 'Núñez', 'Luna', 'Juárez'];

// ---------- Contenido de los cursos ----------
function texto(titulo, parrafos) {
  return `<h2>${titulo}</h2>${parrafos.map((p) => `<p>${p}</p>`).join('')}`;
}

const CURSOS = [
  {
    titulo: 'Producción musical desde cero',
    categoria: 'Producción',
    nivel: 'Principiante',
    precio: 45000,
    precioOriginal: 60000,
    estado: 'activo',
    descripcion: 'Aprendé a producir tus propios temas desde la primera idea hasta la canción terminada: DAW, ritmo, armonía, arreglos y una mezcla básica para compartirla.',
    incluye: ['Acceso de por vida', 'Proyectos de ejemplo para descargar', 'Certificado de finalización'],
    estadisticas: [
      { icono: 'duracion', titulo: '8 horas', subtitulo: 'de contenido' },
      { icono: 'software', titulo: 'Cualquier DAW', subtitulo: 'Ableton, FL o Reaper' },
      { icono: 'practicas', titulo: '12 prácticas', subtitulo: 'guiadas' },
      { icono: 'certificacion', titulo: 'Certificado', subtitulo: 'al terminar' },
    ],
    modulos: [
      { titulo: 'Primeros pasos', clases: [
        { tipo: 'video', titulo: 'Bienvenida y cómo aprovechar el curso' },
        { tipo: 'video', titulo: 'Elegir tu DAW y configurarlo' },
        { tipo: 'bloques', titulo: 'Conceptos básicos de audio', textoTitulo: 'Frecuencia, volumen y formatos', parrafos: ['El sonido se mide en frecuencia (Hz) y en nivel (dB). Entender estas dos ideas te va a ayudar en todo el curso.', 'Trabajá siempre en WAV a 24 bits y 48 kHz mientras producís; el MP3 queda para compartir el resultado final.'], quiz: [
          { enunciado: '¿Qué formato conviene usar mientras producís?', opciones: ['WAV a 24 bits', 'MP3 a 128 kbps', 'OGG'], correcta: 'A' },
          { enunciado: '¿En qué unidad se mide la frecuencia?', opciones: ['Decibeles (dB)', 'Hertz (Hz)', 'Milisegundos (ms)'], correcta: 'B' },
        ] },
      ] },
      { titulo: 'Ritmo y groove', clases: [
        { tipo: 'video', titulo: 'Programar una batería que funcione' },
        { tipo: 'video', titulo: 'Swing, cuantización y humanización' },
        { tipo: 'bloques', titulo: 'Patrones clásicos por género', textoTitulo: 'Patrones que conviene conocer', parrafos: ['El four on the floor (bombo en cada tiempo) es la base del house; el boom bap alterna bombo y caja con bastante espacio.', 'Probá cada patrón a distintos tempos: el mismo ritmo cambia mucho a 90 o a 125 BPM.'] },
      ] },
      { titulo: 'Armonía y melodía', clases: [
        { tipo: 'video', titulo: 'Acordes que suenan bien juntos' },
        { tipo: 'video', titulo: 'Escribir una melodía pegadiza' },
        { tipo: 'bloques', titulo: 'Repaso de armonía', textoTitulo: 'Lo esencial', parrafos: ['Con los grados I, IV, V y vi de una tonalidad ya podés armar la mayoría de las progresiones populares.'], quiz: [
          { enunciado: 'En Do mayor, ¿cuál es el acorde del grado V?', opciones: ['Fa mayor', 'Sol mayor', 'La menor', 'Mi menor'], correcta: 'B' },
        ] },
      ] },
      { titulo: 'Del loop a la canción', clases: [
        { tipo: 'video', titulo: 'Arreglo: intro, estrofa y estribillo' },
        { tipo: 'video', titulo: 'Exportar y compartir tu primer tema' },
      ] },
    ],
  },
  {
    titulo: 'Mezcla y masterización profesional',
    categoria: 'Mezcla',
    nivel: 'Intermedio',
    precio: 62000,
    estado: 'activo',
    descripcion: 'Llevá tus mezclas a un sonido profesional: balance, ecualización, compresión, efectos de tiempo y un master listo para las plataformas de streaming.',
    incluye: ['Sesiones multipista para practicar', 'Presets de los ejemplos', 'Certificado de finalización'],
    estadisticas: [
      { icono: 'duracion', titulo: '10 horas', subtitulo: 'de contenido' },
      { icono: 'practicas', titulo: '6 sesiones', subtitulo: 'multipista reales' },
      { icono: 'certificacion', titulo: 'Certificado', subtitulo: 'al terminar' },
    ],
    modulos: [
      { titulo: 'Preparar la sesión', clases: [
        { tipo: 'video', titulo: 'Organizar pistas, colores y buses' },
        { tipo: 'video', titulo: 'Gain staging: el primer paso de toda mezcla' },
      ] },
      { titulo: 'Ecualización y compresión', clases: [
        { tipo: 'video', titulo: 'EQ sustractiva y aditiva' },
        { tipo: 'video', titulo: 'Compresión: ataque, release y ratio' },
        { tipo: 'bloques', titulo: 'Repaso de dinámica', textoTitulo: 'Compresión sin misterio', parrafos: ['El ratio define cuánto se reduce la señal por encima del umbral; el ataque, qué tan rápido actúa.', 'Si el bombo pierde golpe al comprimir, probá un ataque más lento.'], quiz: [
          { enunciado: 'Si el bombo pierde golpe al comprimirlo, ¿qué conviene probar?', opciones: ['Un ataque más lento', 'Un ratio infinito', 'Subir el umbral al máximo'], correcta: 'A' },
          { enunciado: '¿Qué define el ratio de un compresor?', opciones: ['La velocidad de reacción', 'Cuánto reduce por encima del umbral', 'El volumen de salida'], correcta: 'B' },
        ] },
      ] },
      { titulo: 'Espacio y profundidad', clases: [
        { tipo: 'video', titulo: 'Reverb y delay con criterio' },
        { tipo: 'video', titulo: 'Paneo y mezcla en estéreo' },
      ] },
      { titulo: 'Master para streaming', clases: [
        { tipo: 'video', titulo: 'Cadena básica de mastering' },
        { tipo: 'bloques', titulo: 'Loudness y plataformas', textoTitulo: 'Cuánto volumen es suficiente', parrafos: ['Spotify normaliza alrededor de −14 LUFS: un master demasiado fuerte se baja y pierde dinámica.', 'Dejá el pico real por debajo de −1 dBTP para evitar distorsión al convertir a formatos comprimidos.'], quiz: [
          { enunciado: '¿Alrededor de qué nivel normaliza Spotify?', opciones: ['−6 LUFS', '−14 LUFS', '−23 LUFS'], correcta: 'B' },
        ] },
      ] },
    ],
  },
  {
    titulo: 'Grabación de voces en casa',
    categoria: 'Grabación',
    nivel: 'Principiante',
    precio: 28000,
    estado: 'activo',
    descripcion: 'Grabá voces con calidad profesional en tu casa: elegir el micrófono, tratar la habitación, dirigir la toma y editar para que suene limpia.',
    incluye: ['Checklist de grabación', 'Acceso de por vida'],
    estadisticas: [
      { icono: 'duracion', titulo: '4 horas', subtitulo: 'de contenido' },
      { icono: 'general', titulo: 'Sin estudio', subtitulo: 'todo desde tu casa' },
    ],
    modulos: [
      { titulo: 'Equipo y espacio', clases: [
        { tipo: 'video', titulo: 'Micrófonos dinámicos y de condensador' },
        { tipo: 'video', titulo: 'Tratar la habitación con poco presupuesto' },
      ] },
      { titulo: 'La toma', clases: [
        { tipo: 'video', titulo: 'Distancia, filtro antipop y nivel' },
        { tipo: 'bloques', titulo: 'Checklist antes de grabar', textoTitulo: 'Antes de apretar REC', parrafos: ['Calentá la voz, revisá que el nivel pique entre −12 y −6 dB y grabá siempre una toma de prueba.'], quiz: [
          { enunciado: '¿Entre qué niveles conviene que piquen las voces al grabar?', opciones: ['Entre −12 y −6 dB', 'Siempre en 0 dB', 'Por debajo de −40 dB'], correcta: 'A' },
        ] },
      ] },
      { titulo: 'Edición', clases: [
        { tipo: 'video', titulo: 'Comping: armar la mejor toma' },
        { tipo: 'video', titulo: 'Limpiar respiraciones y ruidos' },
      ] },
    ],
  },
  {
    titulo: 'Teoría musical aplicada a la producción',
    categoria: 'Teoría',
    nivel: 'Principiante',
    precio: 22000,
    estado: 'activo',
    descripcion: 'La teoría que de verdad usás al producir: escalas, acordes, progresiones y ritmo, explicada con ejemplos en el DAW y sin partituras.',
    incluye: ['Ejercicios descargables', 'Certificado de finalización'],
    estadisticas: [
      { icono: 'duracion', titulo: '5 horas', subtitulo: 'de contenido' },
      { icono: 'practicas', titulo: '20 ejercicios', subtitulo: 'con respuestas' },
    ],
    modulos: [
      { titulo: 'Escalas y tonalidades', clases: [
        { tipo: 'video', titulo: 'La escala mayor en el piano roll' },
        { tipo: 'bloques', titulo: 'Escalas menores', textoTitulo: 'Natural, armónica y melódica', parrafos: ['La menor natural tiene el mismo material que su relativa mayor; la armónica sube el séptimo grado y le da un color más tenso.'], quiz: [
          { enunciado: '¿Cuál es la relativa menor de Do mayor?', opciones: ['Mi menor', 'La menor', 'Re menor'], correcta: 'B' },
        ] },
      ] },
      { titulo: 'Acordes y progresiones', clases: [
        { tipo: 'video', titulo: 'Tríadas y acordes con séptima' },
        { tipo: 'video', titulo: 'Progresiones que funcionan' },
      ] },
    ],
  },
  {
    titulo: 'Diseño sonoro con sintetizadores',
    categoria: 'Producción',
    nivel: 'Avanzado',
    precio: 54000,
    estado: 'activo',
    descripcion: 'Creá tus propios sonidos desde cero con síntesis sustractiva, FM y wavetable: bajos, pads, leads y efectos para tus producciones.',
    incluye: ['Banco de presets del curso', 'Acceso de por vida', 'Certificado de finalización'],
    estadisticas: [
      { icono: 'duracion', titulo: '7 horas', subtitulo: 'de contenido' },
      { icono: 'software', titulo: 'Vital (gratis)', subtitulo: 'o el sinte que tengas' },
    ],
    modulos: [
      { titulo: 'Fundamentos de síntesis', clases: [
        { tipo: 'video', titulo: 'Osciladores, filtros y envolventes' },
        { tipo: 'video', titulo: 'LFOs y modulación' },
      ] },
      { titulo: 'Sonidos para tus temas', clases: [
        { tipo: 'video', titulo: 'Un bajo que se siente' },
        { tipo: 'video', titulo: 'Pads amplios y atmosféricos' },
        { tipo: 'bloques', titulo: 'Repaso de síntesis', textoTitulo: 'Cómo pensar un sonido', parrafos: ['Empezá por la forma de onda, después el filtro y por último la envolvente: ese orden ahorra mucho tiempo.'], quiz: [
          { enunciado: '¿Qué parte del sinte define cómo evoluciona el volumen en el tiempo?', opciones: ['El oscilador', 'La envolvente (ADSR)', 'El ecualizador'], correcta: 'B' },
        ] },
      ] },
    ],
  },
  {
    titulo: 'Beatmaking de trap y hip hop',
    categoria: 'Producción',
    nivel: 'Intermedio',
    precio: 38000,
    estado: 'borrador',
    descripcion: 'Curso en preparación: 808, hi-hats con rolls y samples para armar beats de trap y hip hop.',
    incluye: ['Pack de samples'],
    estadisticas: [],
    modulos: [
      { titulo: 'El 808', clases: [{ tipo: 'video', titulo: 'Afinar y saturar el 808' }] },
    ],
  },
];

async function main() {
  const yaCargados = await prisma.usuario.count({ where: { email: { endsWith: DOMINIO } } });
  if (yaCargados > 0) {
    console.log(`Ya hay ${yaCargados} usuarios de prueba cargados. Si querés volver a cargarlos, primero corré: node scripts/borrarDatosPrueba.js`);
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log('Cargando datos de prueba...');

  // ---------- Instructores ----------
  const instructores = [];
  for (const [nombre, apellido, descripcion] of [
    ['Lucas', 'Ferreyra', 'Productor musical y docente. Más de 10 años produciendo artistas de la escena local.'],
    ['Sofía', 'Méndez', 'Ingeniera de mezcla y mastering. Trabaja con bandas y solistas de todo el país.'],
  ]) {
    instructores.push(await prisma.usuario.create({
      data: {
        nombre, apellido, descripcion,
        email: `${sinAcentos(nombre)}.${sinAcentos(apellido)}${DOMINIO}`,
        password: hash,
        rol: 'profesor',
        emailVerificado: true,
        fechaRegistro: haceDias(400),
        ultimaActividad: haceDias(entre(0, 5)),
      },
    }));
  }

  // Registro de instructores: el alta de cada uno, y una persona que fue
  // instructora un tiempo y después se dio de baja (vuelve a ser alumna).
  const admin = await prisma.usuario.findFirst({ where: { rol: 'admin' }, select: { id: true, nombre: true, apellido: true } });
  const nombreAdmin = admin ? `${admin.nombre} ${admin.apellido}` : null;
  for (const [k, instructor] of instructores.entries()) {
    await prisma.historialInstructor.create({
      data: {
        idUsuario: instructor.id,
        nombre: `${instructor.nombre} ${instructor.apellido}`,
        email: instructor.email,
        accion: 'alta',
        fecha: haceDias(380 - k * 40),
        idAdmin: admin?.id ?? null,
        nombreAdmin,
      },
    });
  }
  const exInstructora = await prisma.usuario.create({
    data: {
      nombre: 'Carla', apellido: 'Vega',
      email: `carla.vega${DOMINIO}`,
      password: hash, rol: 'alumno', emailVerificado: true,
      fechaRegistro: haceDias(300), ultimaActividad: haceDias(20),
    },
  });
  for (const [accion, dias] of [['alta', 250], ['baja', 60]]) {
    await prisma.historialInstructor.create({
      data: {
        idUsuario: exInstructora.id,
        nombre: 'Carla Vega',
        email: exInstructora.email,
        accion,
        fecha: haceDias(dias),
        idAdmin: admin?.id ?? null,
        nombreAdmin,
      },
    });
  }

  // ---------- Cursos ----------
  const cursos = [];
  for (const [i, def] of CURSOS.entries()) {
    const creador = instructores[i % 2];
    const curso = await prisma.curso.create({
      data: {
        titulo: def.titulo,
        descripcion: def.descripcion,
        precio: def.precio,
        precioOriginal: def.precioOriginal || null,
        categoria: def.categoria,
        nivel: def.nivel,
        incluye: def.incluye,
        estadisticas: def.estadisticas,
        estado: def.estado,
        idAdminCreador: creador.id,
        colaboradores: { create: { idUsuario: creador.id, visible: true, orden: 0, etiqueta: i % 2 === 0 ? 'Productor musical' : 'Ingeniera de mezcla' } },
      },
    });
    const clases = [];
    for (const [im, mod] of def.modulos.entries()) {
      const modulo = await prisma.modulo.create({ data: { idCurso: curso.id, titulo: mod.titulo, orden: im + 1 } });
      for (const [ic, cl] of mod.clases.entries()) {
        const contenido = await prisma.contenido.create({
          data: {
            idModulo: modulo.id,
            titulo: cl.titulo,
            orden: ic + 1,
            tipo: cl.tipo,
            // Sin URL de video: se carga desde el editor con los videos reales
            urlVideo: null,
            contenidoTexto: cl.tipo === 'video' ? `<p>Notas de la clase "${cl.titulo}". Revisá los puntos clave antes de pasar a la siguiente.</p>` : null,
          },
        });
        if (cl.tipo === 'bloques') {
          await prisma.bloque.create({
            data: { idContenido: contenido.id, tipo: 'texto', orden: 1, contenidoTexto: texto(cl.textoTitulo, cl.parrafos) },
          });
          if (cl.quiz) {
            const bloqueQuiz = await prisma.bloque.create({ data: { idContenido: contenido.id, tipo: 'quiz', orden: 2 } });
            for (const q of cl.quiz) {
              await prisma.pregunta.create({
                data: {
                  idBloque: bloqueQuiz.id,
                  enunciado: q.enunciado,
                  opcionA: q.opciones[0],
                  opcionB: q.opciones[1],
                  opcionC: q.opciones[2] || null,
                  opcionD: q.opciones[3] || null,
                  respuestaCorrecta: q.correcta,
                },
              });
            }
          }
        }
        clases.push(contenido.id);
      }
    }
    cursos.push({ ...curso, clases });
  }
  const cursosEnVenta = cursos.filter((c) => c.estado === 'activo');
  // Los primeros cursos se venden más (como pasa en la realidad)
  const pesos = [5, 4, 3, 2, 1];

  // ---------- Alumnos, compras y progreso ----------
  let compras = 0;
  const TOTAL_ALUMNOS = 70;
  for (let i = 0; i < TOTAL_ALUMNOS; i++) {
    const nombre = NOMBRES[i % NOMBRES.length];
    const apellido = APELLIDOS[(i * 7) % APELLIDOS.length];
    // Registro en los últimos 12 meses (más registros recientes)
    const diasDesdeRegistro = Math.floor(Math.pow(azar(), 1.6) * 360) + 2;
    const fechaRegistro = haceDias(diasDesdeRegistro);
    // ~70% usó la plataforma en los últimos 90 días; el resto quedó inactivo
    const activo = azar() < 0.7;
    const diasDesdeActividad = activo
      ? entre(0, Math.min(85, diasDesdeRegistro - 1))
      : Math.min(diasDesdeRegistro - 1, entre(95, 300));
    const ultimaActividad = haceDias(Math.max(0, diasDesdeActividad));

    const alumno = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email: `${sinAcentos(nombre)}.${sinAcentos(apellido)}${i}${DOMINIO}`,
        password: hash,
        rol: 'alumno',
        emailVerificado: true,
        fechaRegistro,
        ultimaActividad,
        activo: diasDesdeActividad <= 90,
      },
    });

    // 0 a 3 cursos comprados (algunos se registran y no compran)
    const cantidad = azar() < 0.15 ? 0 : entre(1, 3);
    const elegidos = new Set();
    while (elegidos.size < Math.min(cantidad, cursosEnVenta.length)) {
      const total = pesos.reduce((a, b) => a + b, 0);
      let r = azar() * total;
      let idx = 0;
      while (r > pesos[idx]) { r -= pesos[idx]; idx++; }
      elegidos.add(idx);
    }

    for (const idx of elegidos) {
      const curso = cursosEnVenta[idx];
      // La compra cae entre el registro y la última actividad
      const desde = diasDesdeRegistro;
      const hasta = Math.max(0, diasDesdeActividad);
      const diasCompra = entre(hasta, Math.max(hasta, desde - 1));
      const fechaCompra = haceDias(diasCompra);
      // Como en el sistema real: solo se guardan los pagos aprobados. Unos pocos
      // después se reembolsan (el alumno pierde el acceso).
      const reembolsado = azar() < 0.04;
      const estadoPago = reembolsado ? 'reembolsado' : 'aprobado';
      const idOperacion = `PRUEBA-${alumno.id}-${curso.id}`;

      // Operación de Mercado Pago con valores de ejemplo (la comisión real
      // depende del plazo de cobro que tenga configurado la cuenta)
      const tipoMedio = elegir(['credit_card', 'credit_card', 'credit_card', 'account_money', 'account_money', 'debit_card']);
      const total = Number(curso.precio);
      const comision = Math.round(total * 0.0761 * 100) / 100;
      await prisma.operacionPago.create({
        data: {
          idExterno: idOperacion,
          idUsuario: alumno.id,
          estado: estadoPago,
          montoTotal: total,
          comision,
          neto: Math.round((total - comision) * 100) / 100,
          medioPago: { credit_card: elegir(['visa', 'master', 'amex']), debit_card: elegir(['debvisa', 'debmaster']), account_money: 'account_money' }[tipoMedio],
          tipoMedio,
          cuotas: tipoMedio === 'credit_card' ? elegir([1, 1, 3, 6]) : 1,
          fechaAprobacion: fechaCompra,
          fechaAcreditacion: fechaCompra,
        },
      });

      // Progreso: qué parte del curso completó
      const confirmada = estadoPago === 'aprobado';
      const avance = confirmada ? elegir([0, 0.2, 0.4, 0.6, 0.8, 1, 1]) : 0;
      const completadas = Math.round(curso.clases.length * avance);
      const completado = confirmada && completadas === curso.clases.length;

      const inscripcion = await prisma.inscripcion.create({
        data: {
          idUsuario: alumno.id,
          idCurso: curso.id,
          fechaInscripcion: fechaCompra,
          completado,
          pago: {
            create: {
              monto: curso.precio,
              estado: estadoPago,
              metodo: 'mercadopago',
              fechaPago: fechaCompra,
              idTransaccionExterna: idOperacion,
            },
          },
        },
      });
      compras++;

      if (completadas > 0) {
        const fin = fechaCompra.getTime();
        const ultimo = ultimaActividad.getTime();
        await prisma.progreso.createMany({
          data: curso.clases.slice(0, completadas).map((idContenido, k) => ({
            idInscripcion: inscripcion.id,
            idContenido,
            completado: true,
            fecha: new Date(fin + ((ultimo - fin) * (k + 1)) / (completadas + 1)),
          })),
        });
      }
    }

    // Algunos guardan cursos en favoritos
    if (azar() < 0.35) {
      const curso = elegir(cursosEnVenta);
      await prisma.favorito.create({ data: { idUsuario: alumno.id, idCurso: curso.id, fechaAgregado: ultimaActividad } });
    }
  }

  console.log('Listo:');
  console.log(`  ${instructores.length} instructores (con su registro de altas y una baja), ${TOTAL_ALUMNOS + 1} alumnos (algunos inactivos)`);
  console.log(`  ${cursos.length} cursos (${cursosEnVenta.length} publicados y 1 borrador) con módulos, clases y quizzes`);
  console.log(`  ${compras} compras con su progreso`);
  console.log(`  Contraseña de todos los usuarios de prueba: ${PASSWORD}`);
  console.log(`  Por ejemplo: ${instructores[0].email}`);
}

main()
  .catch((error) => {
    console.error('Error al cargar los datos de prueba:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
