// Curso demo 3: Grabación en home studio
module.exports = {
  titulo: 'Grabación en home studio',
  categoria: 'Grabación',
  nivel: 'Intermedio',
  precio: 42000,
  precioOriginal: 52000,
  etiquetaInstructor: 'Ingeniero de grabación',
  descripcion: 'Aprendé a grabar con calidad profesional en tu casa: la cadena de señal, cómo elegir y ubicar micrófonos, tratar la habitación, grabar voces, guitarras y teclados, editar las tomas y entregar todo listo para mezclar.',
  incluye: ['Checklist de sesión para descargar', 'Acceso de por vida', 'Evaluación en cada módulo', 'Certificado de finalización'],
  estadisticas: [
    { icono: 'duracion', titulo: '7 módulos', subtitulo: 'de la cadena a la entrega' },
    { icono: 'software', titulo: 'Interfaz + 1 mic', subtitulo: 'alcanza para empezar' },
    { icono: 'practicas', titulo: '14 prácticas', subtitulo: 'de grabación' },
    { icono: 'certificacion', titulo: 'Certificado', subtitulo: 'al terminar' },
  ],
  modulos: [
    {
      titulo: 'La cadena de señal',
      clases: [
        {
          titulo: 'Del micrófono a la computadora',
          nota: {
            intro: 'Toda grabación sigue el mismo camino. Entenderlo te permite encontrar rápido cualquier problema de ruido o de nivel.',
            puntos: [
              '<b>Fuente</b> (voz, instrumento) → <b>micrófono</b> → <b>preamplificador</b> → <b>conversor A/D</b> → <b>DAW</b>.',
              'La interfaz de audio suele incluir los <b>preamps</b> y el <b>conversor</b> en una sola caja.',
              'Los micrófonos de condensador necesitan <b>phantom power (+48 V)</b>.',
              'Usá cables <b>XLR balanceados</b>: rechazan mejor el ruido en tiradas largas.',
            ],
            practica: 'Dibujá la cadena de tu propio setup e identificá dónde se ajusta la ganancia.',
          },
        },
        {
          titulo: 'Ganancia y niveles de grabación',
          nota: {
            intro: 'Grabar fuerte no es grabar mejor. En digital, si la señal pasa 0 dBFS se recorta y no hay forma de arreglarlo.',
            puntos: [
              'Apuntá a picos entre <b>−12 y −6 dBFS</b> y un promedio cerca de −18 dBFS.',
              'A <b>24 bits</b> tenés margen de sobra: el ruido de fondo queda muy por debajo.',
              'Ajustá la ganancia con el músico <b>tocando o cantando en su parte más fuerte</b>.',
              'El <b>clip</b> (recorte) es un error irreversible; un nivel bajo se puede subir después.',
            ],
            practica: 'Grabá la misma frase con tres niveles distintos y compará cuál tiene mejor relación entre ruido y margen.',
          },
        },
        {
          titulo: 'Evaluación: cadena de señal',
          repaso: 'La señal va de la fuente al micrófono, al preamp, al conversor y al DAW. Los condensadores necesitan phantom power. A 24 bits conviene grabar con picos entre −12 y −6 dBFS: un clip no se puede arreglar.',
          quiz: [
            { q: '¿Qué necesita un micrófono de condensador para funcionar?', o: ['Pilas de 9 V siempre', 'Phantom power (+48 V)', 'Un cable USB', 'Nada'], c: 'B', e: 'La mayoría de los condensadores se alimentan con +48 V desde la interfaz.' },
            { q: '¿Qué pasa si la señal supera 0 dBFS?', o: ['Suena más fuerte y mejor', 'Se recorta (clip) y se distorsiona', 'Se graba en mono', 'Nada'], c: 'B', e: 'En digital no hay más lugar arriba de 0 dBFS: la onda se recorta.' },
            { q: '¿Qué nivel de picos es recomendable al grabar a 24 bits?', o: ['0 dBFS', 'Entre −12 y −6 dBFS', '−40 dBFS', '+6 dBFS'], c: 'B', e: 'Deja margen para los picos inesperados sin sumar ruido audible.' },
            { q: '¿Qué hace el conversor A/D?', o: ['Amplifica el micrófono', 'Pasa la señal analógica a digital', 'Agrega reverb', 'Alimenta el micrófono'], c: 'B', e: 'Convierte la señal eléctrica en números que entiende la computadora.' },
          ],
        },
      ],
    },
    {
      titulo: 'Micrófonos',
      clases: [
        {
          titulo: 'Dinámicos y de condensador',
          nota: {
            intro: 'No hay un micrófono mejor: hay micrófonos más adecuados para cada fuente y cada habitación.',
            puntos: [
              '<b>Dinámicos:</b> robustos, aguantan mucha presión sonora y captan menos la sala. Ideales para amplis, cajas y voces en cuartos sin tratar.',
              '<b>Condensador de diafragma grande:</b> detallados y sensibles. El clásico para voces en estudio.',
              '<b>Condensador de diafragma chico:</b> muy precisos en agudos. Para guitarras acústicas y overheads.',
              'Cuanto más sensible el micrófono, <b>más se escucha la habitación</b>.',
            ],
            practica: 'Si tenés dos micrófonos distintos, grabá la misma voz con los dos y anotá qué diferencias escuchás.',
          },
        },
        {
          titulo: 'Patrones polares y efecto de proximidad',
          nota: {
            intro: 'El patrón polar indica desde qué direcciones capta el micrófono. Elegirlo bien es una forma gratuita de controlar la sala.',
            puntos: [
              '<b>Cardioide:</b> capta de adelante y rechaza de atrás. El más usado.',
              '<b>Omnidireccional:</b> capta en todas direcciones; suena natural pero se escucha mucho la sala.',
              '<b>Figura 8:</b> capta adelante y atrás, rechaza los costados.',
              'El <b>efecto de proximidad</b>: al acercarse a un cardioide, los graves aumentan.',
            ],
            practica: 'Grabá una frase a 5 cm y a 25 cm del micrófono y compará la cantidad de graves.',
          },
        },
        {
          titulo: 'Evaluación: micrófonos',
          repaso: 'Los dinámicos son robustos y captan menos la sala; los condensadores son más detallados y sensibles. El cardioide rechaza lo de atrás, el omni capta todo y la figura 8 rechaza los costados. Acercarse a un cardioide aumenta los graves.',
          quiz: [
            { q: '¿Qué tipo de micrófono conviene en un cuarto sin tratar?', o: ['Condensador omnidireccional', 'Dinámico cardioide', 'Figura 8', 'Cualquiera da igual'], c: 'B', e: 'Un dinámico cardioide capta menos reflexiones de la habitación.' },
            { q: '¿Qué es el efecto de proximidad?', o: ['Más agudos al alejarse', 'Más graves al acercarse', 'Menos ruido al acercarse', 'Un tipo de reverb'], c: 'B', e: 'En micrófonos direccionales, acercarse realza los graves.' },
            { q: '¿Desde dónde rechaza el sonido un cardioide?', o: ['De adelante', 'De atrás', 'De los costados', 'De ningún lado'], c: 'B', e: 'El cardioide tiene su mayor rechazo en la parte trasera.' },
            { q: '¿Para qué se suele usar un condensador de diafragma chico?', o: ['Bombo', 'Guitarra acústica y overheads', 'Amplificador de bajo', 'Megáfono'], c: 'B', e: 'Su respuesta precisa en agudos es ideal para acústicas y platos.' },
          ],
        },
      ],
    },
    {
      titulo: 'Acústica de la habitación',
      clases: [
        {
          titulo: 'Reflexiones, ecos y modos',
          nota: {
            intro: 'La habitación suena tanto como el micrófono. Las paredes paralelas y vacías devuelven el sonido y ensucian la toma.',
            puntos: [
              'Las <b>reflexiones tempranas</b> llegan apenas después del sonido directo y lo colorean.',
              'El <b>flutter echo</b> es ese “zumbido” metálico entre dos paredes paralelas.',
              'Los <b>modos</b> son frecuencias graves que se acumulan en ciertos puntos del cuarto.',
              'Un aplauso en el medio del cuarto revela rápido si hay eco.',
            ],
            practica: 'Aplaudí en distintos puntos de tu cuarto y elegí el que suene más seco para grabar.',
          },
        },
        {
          titulo: 'Tratar el cuarto con poco presupuesto',
          nota: {
            intro: 'No hace falta una obra: con lo que tenés en casa podés mejorar mucho la toma.',
            puntos: [
              'Grabá <b>de frente a un placard abierto</b> con ropa: absorbe muy bien.',
              'Colgá <b>frazadas o acolchados</b> detrás del cantante, que es lo que capta el cardioide.',
              'Alejate de las paredes: ubicá el micrófono <b>lejos de las esquinas</b>.',
              'Los paneles de <b>lana de roca</b> de 5–10 cm son la mejor relación precio/resultado.',
            ],
            practica: 'Armá una “cabina” con frazadas y grabá la misma frase con y sin ella.',
          },
        },
        {
          titulo: 'Evaluación: acústica',
          repaso: 'Las reflexiones y el flutter echo ensucian la toma, y los modos acumulan graves. Con ropa, frazadas y ubicación (lejos de esquinas y paredes) se mejora mucho. La lana de roca es la opción más eficiente para paneles.',
          quiz: [
            { q: '¿Dónde conviene colgar una frazada al grabar voz con un cardioide?', o: ['Detrás del micrófono', 'Detrás del cantante', 'En el techo', 'No sirve'], c: 'B', e: 'El cardioide capta de adelante: lo que está detrás del cantante es lo que se graba.' },
            { q: '¿Qué es el flutter echo?', o: ['Un eco metálico entre paredes paralelas', 'Un ruido eléctrico', 'Un efecto de la interfaz', 'Un tipo de micrófono'], c: 'A', e: 'Aparece cuando el sonido rebota una y otra vez entre dos superficies paralelas.' },
            { q: '¿Por qué conviene evitar las esquinas?', o: ['Porque se acumulan graves', 'Porque hay menos señal', 'Porque se corta el cable', 'No importa'], c: 'A', e: 'En las esquinas se refuerzan los modos graves del cuarto.' },
            { q: '¿Qué material da mejor resultado para paneles caseros?', o: ['Telgopor', 'Lana de roca', 'Cartón', 'Vidrio'], c: 'B', e: 'La lana de roca absorbe un rango amplio de frecuencias a bajo costo.' },
          ],
        },
      ],
    },
    {
      titulo: 'Grabar voces',
      clases: [
        {
          titulo: 'Ubicación, antipop y distancia',
          nota: {
            intro: 'La mayoría de las voces se graba con un condensador cardioide. La ubicación correcta evita casi todos los problemas.',
            puntos: [
              'Empezá a <b>15–20 cm</b> del micrófono, con un <b>antipop</b> en el medio.',
              'Ubicá la cápsula a la altura de la <b>boca o la nariz</b>, levemente apuntada hacia abajo.',
              'Si hay muchas sibilantes, girá el micrófono unos grados <b>fuera del eje</b>.',
              'Marcá en el piso dónde se para el cantante para mantener la misma distancia en todas las tomas.',
            ],
            practica: 'Grabá una estrofa a 10, 20 y 30 cm y elegí la distancia que mejor suene en tu cuarto.',
          },
        },
        {
          titulo: 'Dirigir una sesión de voz',
          nota: {
            intro: 'La mejor técnica no salva una toma sin intención. Parte del trabajo es que el cantante esté cómodo y concentrado.',
            puntos: [
              'Armá una <b>mezcla de auriculares</b> clara, con la voz un poco más fuerte que en el tema.',
              'Grabá <b>varias tomas completas</b> antes de ir por frases.',
              'Hacé comentarios <b>concretos y positivos</b>: “más aire en el estribillo” en lugar de “eso estuvo mal”.',
              'Guardá todas las tomas en <b>playlists o lanes</b> para el comping.',
            ],
            practica: 'Grabá tres tomas completas de una canción y anotá qué frase salió mejor en cada una.',
          },
        },
        {
          titulo: 'Evaluación: voces',
          repaso: 'Para voz: condensador cardioide a 15–20 cm, antipop y la cápsula a la altura de la boca. Mantener la distancia, cuidar la mezcla de auriculares y grabar varias tomas completas hace más fácil el comping.',
          quiz: [
            { q: '¿Para qué sirve el antipop?', o: ['Para frenar las explosivas (p, b)', 'Para subir la ganancia', 'Para quitar sibilantes del todo', 'Para alimentar el micrófono'], c: 'A', e: 'Frena el golpe de aire de consonantes como la p y la b.' },
            { q: '¿A qué distancia conviene empezar con un condensador?', o: ['1 cm', '15–20 cm', '2 metros', 'Da igual'], c: 'B', e: 'Es un buen equilibrio entre presencia y control de proximidad.' },
            { q: 'Si hay muchas sibilantes, conviene…', o: ['Subir la ganancia', 'Girar el micrófono un poco fuera del eje', 'Acercarse más', 'Grabar en MP3'], c: 'B', e: 'Fuera del eje, la cápsula capta menos la “s” directa.' },
            { q: '¿Por qué grabar varias tomas completas?', o: ['Para tener material para el comping', 'Porque ocupa menos espacio', 'Para bajar la latencia', 'No conviene'], c: 'A', e: 'Después podés armar la mejor versión con las mejores frases de cada toma.' },
          ],
        },
      ],
    },
    {
      titulo: 'Guitarras y teclados',
      clases: [
        {
          titulo: 'Guitarra acústica',
          nota: {
            intro: 'La guitarra acústica es uno de los instrumentos más difíciles de grabar porque suena en todo el cuerpo, no solo en la boca.',
            puntos: [
              'Un buen punto de partida: micrófono apuntando al <b>traste 12–14</b>, a unos <b>20 cm</b>.',
              'Apuntar a la <b>boca</b> da muchos graves; alejarse hacia el mástil da más brillo.',
              'Con dos micrófonos, uno al traste 12 y otro cerca del puente, cuidá la <b>fase</b>.',
              'Afiná antes de <b>cada toma</b>: la acústica se desafina con el calor de las manos.',
            ],
            practica: 'Grabá un rasgueo con el micrófono en la boca y en el traste 12 y compará.',
          },
        },
        {
          titulo: 'Eléctrica y teclados por línea',
          nota: {
            intro: 'Muchos instrumentos pueden grabarse sin micrófono, directo a la interfaz. Es más silencioso y te da flexibilidad en la mezcla.',
            puntos: [
              'La guitarra eléctrica va a la entrada <b>Hi-Z o Instrument</b> de la interfaz.',
              'Grabá la señal <b>limpia (DI)</b> y usá un simulador de amplificador: podés cambiar el sonido después.',
              'Los teclados y sintes van por <b>línea</b>, idealmente en estéreo.',
              'Si tocás con MIDI, grabá también el <b>MIDI</b>: podés editar notas y cambiar el sonido.',
            ],
            practica: 'Grabá una guitarra por DI y probala con tres simuladores de amplificador distintos.',
          },
        },
        {
          titulo: 'Evaluación: instrumentos',
          repaso: 'Para acústica, el traste 12–14 a 20 cm es un buen inicio y la boca da más graves. La eléctrica entra por Hi-Z y conviene guardar la señal DI limpia. Teclados por línea en estéreo y, si se puede, también en MIDI.',
          quiz: [
            { q: '¿Dónde conviene apuntar el micrófono en una acústica para empezar?', o: ['Directo a la boca', 'Al traste 12–14', 'Al clavijero', 'Al piso'], c: 'B', e: 'Ahí se logra un balance entre cuerpo y brillo.' },
            { q: '¿A qué entrada va una guitarra eléctrica sin amplificador?', o: ['Entrada de micrófono con +48 V', 'Entrada Hi-Z / Instrument', 'Salida de auriculares', 'USB'], c: 'B', e: 'La entrada Hi-Z tiene la impedancia adecuada para pastillas de guitarra.' },
            { q: '¿Qué ventaja tiene grabar la señal DI?', o: ['Poder cambiar el sonido del amplificador después', 'Suena más fuerte', 'No necesita afinación', 'Ninguna'], c: 'A', e: 'La señal limpia se puede reamplificar o procesar como quieras en la mezcla.' },
            { q: 'Si grabás un teclado por MIDI, podés…', o: ['Editar las notas y cambiar el sonido después', 'Solo escucharlo', 'Grabar voz', 'Nada'], c: 'A', e: 'El MIDI guarda qué notas tocaste, no el audio.' },
          ],
        },
      ],
    },
    {
      titulo: 'Edición de las tomas',
      clases: [
        {
          titulo: 'Comping: armar la mejor toma',
          nota: {
            intro: 'Hacer comping es combinar las mejores partes de varias tomas en una sola pista. Es lo que hacen casi todas las producciones profesionales.',
            puntos: [
              'Escuchá cada frase en <b>todas las tomas</b> y marcá la mejor.',
              'Cortá en <b>silencios o consonantes</b>, nunca en el medio de una vocal.',
              'Aplicá <b>crossfades</b> cortos en cada corte para evitar clics.',
              'Priorizá la <b>emoción</b> sobre la afinación perfecta: lo técnico se puede corregir.',
            ],
            practica: 'Armá un comp de voz con tus tres tomas y consolidalo en una sola pista.',
          },
        },
        {
          titulo: 'Timing, respiraciones y ruidos',
          nota: {
            intro: 'Una vez elegida la toma, la edición fina deja todo prolijo sin que se note.',
            puntos: [
              'Alineá las <b>entradas importantes</b> al tiempo, no cada sílaba: demasiada edición suena robótica.',
              'Bajá las <b>respiraciones</b> entre 6 y 10 dB en lugar de borrarlas.',
              'Eliminá los ruidos en los silencios (sillas, papeles) con <b>cortes y fades</b>.',
              'Revisá la edición en <b>solo y en contexto</b> con toda la mezcla.',
            ],
            practica: 'Recorré tu comp y bajá todas las respiraciones con automatización de volumen o clip gain.',
          },
        },
        {
          titulo: 'Evaluación: edición',
          repaso: 'El comping arma una toma con las mejores frases, cortando en silencios o consonantes y con crossfades. En la edición fina se alinean las entradas importantes, se atenúan las respiraciones y se limpian los ruidos sin perder naturalidad.',
          quiz: [
            { q: '¿Dónde conviene cortar al hacer comping?', o: ['En el medio de una vocal', 'En silencios o consonantes', 'En cualquier lugar', 'Solo al principio'], c: 'B', e: 'Los cortes en silencios o consonantes no se notan.' },
            { q: '¿Para qué sirven los crossfades?', o: ['Para evitar clics en los cortes', 'Para subir el volumen', 'Para afinar', 'Para agregar reverb'], c: 'A', e: 'Suavizan la unión entre dos fragmentos de audio.' },
            { q: '¿Qué conviene hacer con las respiraciones?', o: ['Borrarlas todas', 'Bajarlas unos dB', 'Subirlas', 'Duplicarlas'], c: 'B', e: 'Borrarlas suena artificial; bajarlas mantiene la naturalidad.' },
            { q: 'Al corregir el timing de una voz, conviene…', o: ['Alinear cada sílaba exacta', 'Alinear solo las entradas importantes', 'No escuchar en contexto', 'Cuantizar al 100 %'], c: 'B', e: 'Demasiada edición hace que la voz suene robótica.' },
          ],
        },
      ],
    },
    {
      titulo: 'De la toma a la mezcla',
      clases: [
        {
          titulo: 'Organizar la sesión',
          nota: {
            intro: 'Una sesión ordenada ahorra horas en la mezcla y es lo primero que nota cualquier ingeniero que la recibe.',
            puntos: [
              '<b>Nombrá</b> cada pista con claridad: “Voz principal”, “Guitarra acústica L”.',
              'Usá <b>colores</b> por familia: baterías, bajos, guitarras, voces.',
              'Agrupá en <b>carpetas o buses</b> las pistas que van juntas.',
              'Borrá las tomas descartadas y <b>consolidá</b> las ediciones.',
            ],
            practica: 'Ordená tu sesión con nombres, colores y carpetas, como si se la fueras a mandar a otra persona.',
          },
        },
        {
          titulo: 'Gain staging y entrega de stems',
          nota: {
            intro: 'Antes de mezclar, cada pista tiene que llegar con un nivel razonable. Y si vas a mandar el proyecto a otra persona, la entrega tiene que ser a prueba de errores.',
            puntos: [
              'Llevá cada pista a un promedio cercano a <b>−18 dBFS</b> con clip gain: los plugins trabajan mejor.',
              'Exportá los <b>stems</b> desde el mismo punto de inicio (compás 1) para que se alineen solos.',
              'Entregá en <b>WAV 24 bits</b>, a la misma frecuencia de muestreo del proyecto.',
              'Sumá un archivo con el <b>tempo</b>, la tonalidad y notas de la sesión.',
            ],
            practica: 'Exportá los stems de tu sesión y armá una carpeta lista para mandar a mezclar.',
          },
        },
        {
          titulo: 'Evaluación final',
          repaso: 'Una sesión ordenada tiene nombres claros, colores y carpetas, y las ediciones consolidadas. Para mezclar o entregar, cada pista llega cerca de −18 dBFS, y los stems se exportan desde el compás 1 en WAV 24 bits con el tempo y la tonalidad anotados.',
          quiz: [
            { q: '¿Desde dónde conviene exportar todos los stems?', o: ['Cada uno desde donde empieza a sonar', 'Todos desde el mismo punto (compás 1)', 'Desde el estribillo', 'No importa'], c: 'B', e: 'Si todos empiezan en el mismo punto, quien los recibe los alinea al instante.' },
            { q: '¿A qué nivel promedio conviene llevar cada pista antes de mezclar?', o: ['0 dBFS', 'Cerca de −18 dBFS', '−60 dBFS', '+6 dBFS'], c: 'B', e: 'Es el nivel para el que están pensados muchos plugins.' },
            { q: '¿Qué formato se usa para entregar stems?', o: ['MP3 128 kbps', 'WAV 24 bits', 'MIDI', 'Video'], c: 'B', e: 'Se entrega sin pérdida de calidad.' },
            { q: '¿Qué conviene incluir junto con los stems?', o: ['El tempo y la tonalidad', 'Las contraseñas del DAW', 'Nada más', 'Un video'], c: 'A', e: 'Con el tempo y la tonalidad, quien mezcla arma la sesión sin adivinar.' },
            { q: '¿Para qué sirve usar colores por familia de instrumentos?', o: ['Para ubicar las pistas rápido', 'Para mejorar el sonido', 'Para bajar la latencia', 'No sirve'], c: 'A', e: 'Ayuda a navegar la sesión de un vistazo.' },
          ],
        },
      ],
    },
  ],
};
