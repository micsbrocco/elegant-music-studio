// Curso demo 1: Producción musical
module.exports = {
  titulo: 'Producción musical: de la idea al tema terminado',
  categoria: 'Producción',
  nivel: 'Principiante',
  precio: 48000,
  precioOriginal: 64000,
  etiquetaInstructor: 'Productor musical',
  descripcion: 'Un recorrido completo por la producción de un tema: armar tu estudio y tu DAW, programar baterías con groove, escribir armonías y melodías, construir un low end sólido, arreglar la canción y dejarla mezclada y exportada para compartir.',
  incluye: ['Acceso de por vida', 'Proyecto de ejemplo para descargar', 'Evaluación en cada módulo', 'Certificado de finalización'],
  estadisticas: [
    { icono: 'duracion', titulo: '7 módulos', subtitulo: 'de la idea al bounce' },
    { icono: 'software', titulo: 'Cualquier DAW', subtitulo: 'Ableton, FL, Logic o Reaper' },
    { icono: 'practicas', titulo: '14 prácticas', subtitulo: 'guiadas' },
    { icono: 'certificacion', titulo: 'Certificado', subtitulo: 'al terminar' },
  ],
  modulos: [
    {
      titulo: 'Tu estudio y tu DAW',
      clases: [
        {
          titulo: 'El flujo de trabajo de una producción',
          nota: {
            intro: 'Producir es llevar una idea musical hasta un archivo terminado. Aunque cada productor tiene sus mañas, casi todos los temas pasan por las mismas etapas, y conocerlas te ayuda a no quedarte trabado en un loop de 8 compases.',
            puntos: [
              '<b>Idea:</b> un ritmo, una progresión o una melodía que te guste. Guardala apenas aparece.',
              '<b>Producción y arreglo:</b> elegir sonidos y ordenar la canción en secciones.',
              '<b>Mezcla:</b> equilibrar todos los elementos para que se escuchen claros.',
              '<b>Master y exportación:</b> el último ajuste de volumen y el archivo final.',
            ],
            practica: 'Escuchá un tema que te guste y anotá en qué segundo cambia cada sección (intro, estrofa, estribillo). Lo vas a usar como referencia durante el curso.',
          },
        },
        {
          titulo: 'Configurar el DAW: audio, latencia y plantilla',
          nota: {
            intro: 'Antes de crear conviene dejar el DAW bien configurado. Dos datos importan desde el primer día: la frecuencia de muestreo y el tamaño del buffer.',
            puntos: [
              'Trabajá a <b>48 kHz y 24 bits</b>: buena calidad sin archivos enormes.',
              'Con un <b>buffer chico</b> (64–128 muestras) hay menos latencia: ideal para grabar o tocar con el teclado.',
              'Con un <b>buffer grande</b> (512–1024) la compu aguanta más plugins: ideal para mezclar.',
              'Armá una <b>plantilla</b> con tus pistas de siempre (batería, bajo, acordes, voz) y los buses ya ruteados.',
            ],
            practica: 'Creá tu plantilla de inicio con 6 pistas nombradas y con colores, y guardala como proyecto por defecto.',
          },
        },
        {
          titulo: 'Repaso: estudio y DAW',
          repaso: 'Las etapas de un tema son idea, producción/arreglo, mezcla y master. Configurar bien el DAW (48 kHz, 24 bits, buffer según la tarea) y tener una plantilla te ahorra tiempo cada vez que arrancás.',
          quiz: [
            { q: '¿Qué conviene hacer con el buffer cuando vas a grabar o tocar en vivo?', o: ['Subirlo a 1024 muestras', 'Bajarlo a 64–128 muestras', 'Dejarlo en automático siempre', 'No tiene efecto al grabar'], c: 'B', e: 'Un buffer chico reduce la latencia, así lo que tocás suena en el momento.' },
            { q: '¿Qué formato es recomendable para trabajar dentro del proyecto?', o: ['MP3 a 128 kbps', 'WAV a 24 bits', 'OGG a 96 kbps', 'AAC'], c: 'B', e: 'El WAV no pierde calidad; el MP3 queda para compartir el resultado final.' },
            { q: '¿En qué etapa se equilibran los volúmenes de todos los elementos?', o: ['Idea', 'Arreglo', 'Mezcla', 'Composición'], c: 'C', e: 'La mezcla es la etapa en la que se balancean y se hacen convivir todos los sonidos.' },
            { q: '¿Para qué sirve una plantilla de proyecto?', o: ['Para mejorar la calidad del audio', 'Para empezar cada tema con pistas y ruteo ya armados', 'Para reemplazar al master', 'Para bajar la latencia'], c: 'B', e: 'Una plantilla te deja directo en la parte creativa, sin rearmar todo cada vez.' },
          ],
        },
      ],
    },
    {
      titulo: 'Ritmo y batería',
      clases: [
        {
          titulo: 'Anatomía de un groove: bombo, caja y hi-hat',
          nota: {
            intro: 'La mayoría de los ritmos de música popular se construyen con tres piezas. En un compás de 4/4, cada una cumple un rol muy claro.',
            puntos: [
              '<b>Bombo:</b> marca el pulso y el peso. En el four-on-the-floor va en los cuatro tiempos.',
              '<b>Caja o clap:</b> suele ir en los tiempos 2 y 4, el famoso “backbeat”.',
              '<b>Hi-hat:</b> llena el espacio con corcheas o semicorcheas y define la velocidad que se siente.',
              'Los <b>ghost notes</b> (golpes muy suaves de caja) le dan movimiento sin ensuciar.',
            ],
            practica: 'Programá tres variantes del mismo compás: una de house (bombo en negras), una de hip hop (bombo sincopado) y una de pop rock.',
          },
        },
        {
          titulo: 'Cuantización, swing y humanización',
          nota: {
            intro: 'Una batería perfectamente alineada a la grilla puede sonar rígida. El groove aparece cuando algunos golpes se corren apenas y cambian de intensidad.',
            puntos: [
              '<b>Cuantizar</b> es acomodar las notas a la grilla. Usala al 70–90 % si querés que conserve algo de lo tocado.',
              'El <b>swing</b> atrasa las semicorcheas o corcheas pares: es lo que hace “bailar” al hi-hat.',
              'Variá la <b>velocity</b>: no todos los golpes de hi-hat suenan igual en una batería real.',
              'Mover la caja unos milisegundos <b>atrás del tiempo</b> da una sensación más relajada.',
            ],
            practica: 'Tomá el groove de la clase anterior, aplicale un 55–60 % de swing al hi-hat y variá su velocity entre 70 y 110.',
          },
        },
        {
          titulo: 'Repaso: ritmo y batería',
          repaso: 'El bombo da el pulso, la caja marca el backbeat en 2 y 4 y el hi-hat define la subdivisión. El swing, la velocity y pequeños corrimientos de tiempo transforman una grilla rígida en un groove.',
          quiz: [
            { q: 'En un compás de 4/4 típico, ¿en qué tiempos suele ir la caja?', o: ['1 y 3', '2 y 4', 'Solo en el 1', 'En todos'], c: 'B', e: 'La caja en 2 y 4 es el backbeat que sostiene casi toda la música popular.' },
            { q: '¿Qué hace el swing?', o: ['Sube el volumen del bombo', 'Atrasa las subdivisiones pares', 'Cuantiza todo al 100 %', 'Agrega reverb'], c: 'B', e: 'El swing corre las notas pares de la subdivisión y genera ese balanceo.' },
            { q: '¿Qué patrón de bombo caracteriza al house?', o: ['Bombo en los cuatro tiempos', 'Bombo solo en el 1', 'Bombo en contratiempos', 'Sin bombo'], c: 'A', e: 'El four-on-the-floor pone el bombo en cada negra del compás.' },
            { q: '¿Para qué sirve variar la velocity del hi-hat?', o: ['Para que ocupe menos CPU', 'Para que suene más humano', 'Para afinarlo', 'Para cambiar el tempo'], c: 'B', e: 'Un baterista nunca pega igual dos veces: variar la intensidad lo hace más natural.' },
          ],
        },
      ],
    },
    {
      titulo: 'Armonía para productores',
      clases: [
        {
          titulo: 'Progresiones que funcionan',
          nota: {
            intro: 'No hace falta saber mucha teoría para escribir buenos acordes. Con los acordes de una sola tonalidad ya tenés miles de combinaciones.',
            puntos: [
              'En Do mayor, los acordes naturales son: <b>C, Dm, Em, F, G, Am y Bdim</b>.',
              'La progresión <b>I–V–vi–IV</b> (C–G–Am–F) está detrás de cientos de hits.',
              '<b>vi–IV–I–V</b> (Am–F–C–G) usa los mismos acordes pero suena más melancólica.',
              'Cambiar de acorde en el <b>tiempo 1</b> de cada compás hace que la progresión se sienta firme.',
            ],
            practica: 'Escribí una progresión de 4 compases con acordes de Do mayor y probala en dos órdenes distintos.',
          },
        },
        {
          titulo: 'Voicings y pads',
          nota: {
            intro: 'El mismo acorde puede sonar pobre o enorme según cómo distribuyas sus notas. A eso se le llama voicing.',
            puntos: [
              'Usá <b>inversiones</b> para que las notas se muevan lo menos posible entre acordes.',
              'Dejá el registro grave para el bajo: los acordes suenan más limpios <b>desde el Do central hacia arriba</b>.',
              'Agregar la <b>novena</b> o la <b>séptima</b> le da color sin cambiar la función del acorde.',
              'Un pad con <b>ataque lento</b> y release largo rellena sin tapar a la voz.',
            ],
            practica: 'Tomá tu progresión y reescribila con inversiones para que cada voz se mueva como máximo dos semitonos.',
          },
        },
        {
          titulo: 'Repaso: armonía',
          repaso: 'Con los siete acordes de una tonalidad se arma casi cualquier progresión. Las inversiones y las extensiones (séptimas, novenas) cambian el color, y el registro grave queda libre para el bajo.',
          quiz: [
            { q: 'En Do mayor, ¿qué acorde es el grado vi?', o: ['F', 'G', 'Am', 'Em'], c: 'C', e: 'Contando desde Do: C (I), Dm (ii), Em (iii), F (IV), G (V), Am (vi).' },
            { q: '¿Qué es una inversión?', o: ['Tocar el acorde al revés en el tiempo', 'Poner otra nota del acorde en el bajo', 'Cambiar de tonalidad', 'Bajar una octava todo'], c: 'B', e: 'En una inversión la nota más grave deja de ser la fundamental.' },
            { q: '¿Qué progresión usa C–G–Am–F?', o: ['I–V–vi–IV', 'ii–V–I', 'I–IV–V', 'vi–ii–V'], c: 'A', e: 'C es I, G es V, Am es vi y F es IV.' },
            { q: '¿Qué ajuste hace que un pad entre suave?', o: ['Ataque rápido', 'Ataque lento', 'Más distorsión', 'Menos release'], c: 'B', e: 'Con un ataque lento el sonido crece de a poco y no compite con el golpe de los otros instrumentos.' },
          ],
        },
      ],
    },
    {
      titulo: 'Bajo y low end',
      clases: [
        {
          titulo: 'El bajo y el bombo: que no se pisen',
          nota: {
            intro: 'Bombo y bajo comparten las frecuencias graves. Si los dos suenan fuerte al mismo tiempo, el tema pierde definición y pega menos.',
            puntos: [
              'Decidí quién manda en el <b>sub (40–60 Hz)</b>: el bombo o el bajo.',
              'Hacé que el bajo toque <b>entre los golpes</b> del bombo, o que sus notas empiecen juntas y sean cortas.',
              'Afiná el bombo a la <b>tonalidad del tema</b> para que no choque con el bajo.',
              'Escuchá el low end en <b>mono</b>: los graves deben estar centrados.',
            ],
            practica: 'Programá una línea de bajo que esquive el bombo y comparala con una que toque encima.',
          },
        },
        {
          titulo: 'Sub, octavas y sidechain',
          nota: {
            intro: 'Hay técnicas simples que hacen que el grave suene grande incluso en parlantes chicos.',
            puntos: [
              'Una <b>senoidal</b> una octava abajo del bajo refuerza el sub sin ensuciar.',
              'Un poco de <b>saturación</b> genera armónicos que se escuchan en celulares.',
              'El <b>sidechain</b> baja el volumen del bajo cada vez que suena el bombo.',
              'Usá tiempos de release cortos (<b>50–150 ms</b>) para que el bajo vuelva rápido.',
            ],
            practica: 'Agregá un compresor al bajo con sidechain desde el bombo y ajustá el release al tempo.',
          },
        },
        {
          titulo: 'Repaso: low end',
          repaso: 'El bombo y el bajo tienen que repartirse los graves: por tiempo (no tocar juntos), por frecuencia (quién manda en el sub) o con sidechain. Los graves van en mono y algo de saturación los hace audibles en parlantes chicos.',
          quiz: [
            { q: '¿Qué hace el sidechain en el bajo?', o: ['Lo baja cada vez que suena el bombo', 'Le agrega reverb', 'Lo afina', 'Lo pasa a estéreo'], c: 'A', e: 'El compresor del bajo escucha al bombo y lo atenúa en cada golpe.' },
            { q: '¿Por qué conviene escuchar los graves en mono?', o: ['Porque suenan más fuertes', 'Porque deben estar centrados y no cancelarse', 'Porque el mono no tiene graves', 'No hace falta'], c: 'B', e: 'Los graves abiertos en estéreo pueden cancelarse y perder fuerza en sistemas mono.' },
            { q: '¿Para qué sirve saturar levemente el bajo?', o: ['Para que tenga armónicos audibles en parlantes chicos', 'Para bajar la latencia', 'Para que sea más grave', 'Para eliminar el sub'], c: 'A', e: 'La saturación agrega armónicos más agudos que los parlantes chicos sí reproducen.' },
            { q: '¿Dónde está aproximadamente el sub?', o: ['2–5 kHz', '40–60 Hz', '500 Hz', '10 kHz'], c: 'B', e: 'El sub son las frecuencias más graves, por debajo de unos 60 Hz.' },
          ],
        },
      ],
    },
    {
      titulo: 'Melodía y sonido',
      clases: [
        {
          titulo: 'Escribir un hook',
          nota: {
            intro: 'El hook es la parte que la gente tararea al salir. Suele ser corto, repetitivo y fácil de cantar.',
            puntos: [
              'Usá pocas notas: muchos hooks viven en un rango de <b>5 o 6 notas</b>.',
              'La <b>repetición con una pequeña variación</b> al final es una fórmula probada.',
              'Combiná notas largas con <b>ritmos cortos y marcados</b>.',
              'Las notas del acorde en los <b>tiempos fuertes</b> suenan estables; las de paso, en los débiles.',
            ],
            practica: 'Escribí un motivo de 2 compases, repetilo y cambiá solo las últimas dos notas en la repetición.',
          },
        },
        {
          titulo: 'Síntesis sustractiva básica',
          nota: {
            intro: 'Casi todos los sintetizadores funcionan igual: un oscilador genera el sonido, un filtro le saca frecuencias y unas envolventes le dan forma en el tiempo.',
            puntos: [
              '<b>Oscilador:</b> la onda de sierra es brillante, la cuadrada es hueca y la senoidal es pura.',
              '<b>Filtro pasa bajos:</b> bajar el cutoff oscurece el sonido; la resonancia resalta esa zona.',
              '<b>Envolvente ADSR:</b> ataque, decaimiento, sostenimiento y liberación.',
              'Un <b>LFO</b> moviendo el filtro genera sonidos que “respiran”.',
            ],
            practica: 'Partí de una onda de sierra y armá tres sonidos: un bajo, un pad y un pluck, cambiando solo filtro y envolvente.',
          },
        },
        {
          titulo: 'Repaso: melodía y síntesis',
          repaso: 'Un buen hook es corto, repetitivo y con una variación al final. En síntesis sustractiva, el oscilador genera, el filtro recorta y la envolvente ADSR da forma al sonido en el tiempo.',
          quiz: [
            { q: '¿Qué hace un filtro pasa bajos al bajar el cutoff?', o: ['Hace el sonido más brillante', 'Hace el sonido más oscuro', 'Sube el volumen', 'Cambia la nota'], c: 'B', e: 'El pasa bajos deja pasar los graves y recorta los agudos.' },
            { q: '¿Qué significa la “A” de ADSR?', o: ['Amplitud', 'Ataque', 'Armonía', 'Audio'], c: 'B', e: 'ADSR: Attack, Decay, Sustain, Release.' },
            { q: '¿Qué forma de onda es la más brillante de estas?', o: ['Senoidal', 'Sierra', 'Triangular', 'Ninguna'], c: 'B', e: 'La sierra tiene todos los armónicos y por eso suena muy brillante.' },
            { q: 'Una fórmula común para un hook es…', o: ['No repetir nunca una nota', 'Repetir un motivo con una variación al final', 'Usar dos octavas de rango', 'Evitar el ritmo'], c: 'B', e: 'La repetición lo hace recordable y la variación evita que aburra.' },
          ],
        },
      ],
    },
    {
      titulo: 'Arreglo y estructura',
      clases: [
        {
          titulo: 'Secciones y energía',
          nota: {
            intro: 'Un buen arreglo es una curva de energía: el tema crece, respira y vuelve a crecer. La forma más simple de manejarla es sumar y restar elementos.',
            puntos: [
              'Una estructura clásica: <b>intro – estrofa – pre – estribillo – estrofa – estribillo – puente – estribillo</b>.',
              'El estribillo debe tener <b>más elementos</b> o más brillo que la estrofa.',
              'Sacar el bombo o el bajo unos compases antes del estribillo genera <b>tensión</b>.',
              'Las secciones suelen durar <b>8 o 16 compases</b>.',
            ],
            practica: 'Pasá tu loop a una estructura de 2 minutos: marcá las secciones y decidí qué instrumentos suenan en cada una.',
          },
        },
        {
          titulo: 'Transiciones: risers, cortes y fills',
          nota: {
            intro: 'Las transiciones le avisan al oyente que viene algo nuevo. Bien usadas, hacen que el cambio de sección se sienta inevitable.',
            puntos: [
              '<b>Riser:</b> un sonido que sube en tono o en filtro durante 4–8 compases.',
              '<b>Corte:</b> silencio total durante un tiempo justo antes del estribillo.',
              '<b>Fill de batería:</b> un redoble o variación en el último compás de la sección.',
              '<b>Impacto:</b> un golpe con reverb en el primer tiempo de la sección nueva.',
            ],
            practica: 'Agregá a tu arreglo un riser antes del primer estribillo y un corte de un tiempo antes del último.',
          },
        },
        {
          titulo: 'Repaso: arreglo',
          repaso: 'El arreglo maneja la energía sumando y restando elementos por sección. Las transiciones (risers, cortes, fills e impactos) preparan al oyente para cada cambio.',
          quiz: [
            { q: '¿Cuánto suele durar una sección en música popular?', o: ['3 compases', '8 o 16 compases', '50 compases', 'Siempre 1 compás'], c: 'B', e: 'Las secciones de 8 o 16 compases son las más comunes.' },
            { q: '¿Qué es un riser?', o: ['Un sonido que sube en tono o filtro antes de un cambio', 'Un tipo de compresor', 'Un acorde disminuido', 'Un bombo grave'], c: 'A', e: 'El riser genera expectativa antes de la sección siguiente.' },
            { q: '¿Qué conviene que tenga el estribillo respecto de la estrofa?', o: ['Menos elementos', 'Más energía o más elementos', 'Otro tempo', 'Nada distinto'], c: 'B', e: 'El estribillo es el punto más alto de energía de la canción.' },
            { q: 'Sacar el bombo unos compases antes del estribillo…', o: ['Genera tensión', 'Rompe el tema', 'Baja la calidad', 'Cambia la tonalidad'], c: 'A', e: 'Al volver el bombo con el estribillo, el impacto se siente mucho más.' },
          ],
        },
      ],
    },
    {
      titulo: 'Mezcla y exportación',
      clases: [
        {
          titulo: 'Balance, paneo y EQ',
          nota: {
            intro: 'El 80 % de una buena mezcla es el balance de volúmenes. Antes de abrir un plugin, hacé que todo se escuche en su lugar con los faders.',
            puntos: [
              'Empezá con el <b>bombo y la voz</b> y construí el resto alrededor.',
              'Paneá elementos que se repiten en pares (guitarras dobladas, hi-hats) y dejá al <b>centro</b> bombo, caja, bajo y voz.',
              'Usá el EQ primero para <b>recortar</b>: un pasa altos en todo lo que no necesita graves.',
              'Comparás mejor si <b>igualás el volumen</b> al activar y desactivar un plugin.',
            ],
            practica: 'Hacé una mezcla solo con faders y paneo, sin plugins, y guardala como referencia.',
          },
        },
        {
          titulo: 'Compresión, espacio y exportar',
          nota: {
            intro: 'Con el balance armado, la compresión controla los picos y los efectos de espacio ubican cada sonido en un ambiente.',
            puntos: [
              'Un compresor con <b>ratio 3:1 a 4:1</b> y 3–6 dB de reducción alcanza para la mayoría de las voces.',
              'Mandá la reverb y el delay por <b>envíos</b> (buses), no como insert en cada pista.',
              'Dejá <b>margen</b> en el master: picos alrededor de −6 dBFS antes de masterizar.',
              'Exportá en <b>WAV 24 bits</b> para el master y en MP3 320 kbps para compartir.',
            ],
            practica: 'Comprimí la voz, creá un bus de reverb compartido y exportá tu tema en WAV y MP3.',
          },
        },
        {
          titulo: 'Evaluación final',
          repaso: 'Una mezcla se construye primero con balance y paneo, después con EQ que recorta, compresión que controla y efectos de espacio por envíos. Se exporta dejando margen y en el formato adecuado para cada uso.',
          quiz: [
            { q: '¿Qué elementos se suelen dejar al centro?', o: ['Hi-hats y pads', 'Bombo, caja, bajo y voz', 'Solo las guitarras', 'Ninguno'], c: 'B', e: 'Los elementos principales y los graves van al centro para dar estabilidad.' },
            { q: '¿Por qué conviene usar la reverb en un envío?', o: ['Usa menos CPU y une los sonidos en un mismo espacio', 'Suena más fuerte', 'Es obligatorio', 'Mejora la latencia'], c: 'A', e: 'Una reverb compartida ahorra recursos y da coherencia al ambiente.' },
            { q: '¿Qué ratio de compresión es un buen punto de partida para voz?', o: ['1:1', '3:1 a 4:1', '20:1', '∞:1'], c: 'B', e: 'Un ratio moderado controla la voz sin aplastarla.' },
            { q: '¿Qué margen conviene dejar en el master antes de masterizar?', o: ['Picos en 0 dBFS', 'Picos alrededor de −6 dBFS', 'Picos en +3 dBFS', 'No importa'], c: 'B', e: 'El margen deja lugar para el procesamiento del master sin saturar.' },
            { q: '¿Qué formato se usa para el archivo de máxima calidad?', o: ['MP3 128 kbps', 'WAV 24 bits', 'MIDI', 'PDF'], c: 'B', e: 'El WAV conserva toda la información del audio.' },
          ],
        },
      ],
    },
  ],
};
