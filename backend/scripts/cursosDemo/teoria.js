// Curso demo 2: Teoría musical
module.exports = {
  titulo: 'Teoría musical aplicada',
  categoria: 'Teoría',
  nivel: 'Principiante',
  precio: 38000,
  precioOriginal: null,
  etiquetaInstructor: 'Docente de música',
  descripcion: 'La teoría que de verdad usás al tocar y producir: notas, ritmo, intervalos, escalas, acordes y armonía funcional, explicada con ejemplos en el teclado y ejercicios cortos al final de cada módulo.',
  incluye: ['Acceso de por vida', 'Ejercicios en cada módulo', 'Certificado de finalización'],
  estadisticas: [
    { icono: 'duracion', titulo: '7 módulos', subtitulo: 'de cero a armonía' },
    { icono: 'practicas', titulo: '7 evaluaciones', subtitulo: 'con corrección al instante' },
    { icono: 'software', titulo: 'Solo un teclado', subtitulo: 'o una app de piano' },
    { icono: 'certificacion', titulo: 'Certificado', subtitulo: 'al terminar' },
  ],
  modulos: [
    {
      titulo: 'Las notas y el teclado',
      clases: [
        {
          titulo: 'Las 12 notas de la música occidental',
          nota: {
            intro: 'La música occidental usa 12 sonidos que se repiten en distintas alturas. Siete tienen nombre propio y los otros cinco se nombran con alteraciones.',
            puntos: [
              'Las notas naturales son <b>Do, Re, Mi, Fa, Sol, La y Si</b> (en cifrado americano: C, D, E, F, G, A, B).',
              'El <b>sostenido (♯)</b> sube medio tono y el <b>bemol (♭)</b> lo baja.',
              'Do♯ y Re♭ son el mismo sonido con dos nombres: se llaman <b>enarmónicos</b>.',
              'Después de Si vuelve a empezar Do, una <b>octava</b> más arriba.',
            ],
            practica: 'Nombrá en voz alta las 12 notas subiendo desde Do, primero con sostenidos y después con bemoles.',
          },
        },
        {
          titulo: 'Tonos y semitonos en el teclado',
          nota: {
            intro: 'El semitono es la distancia más chica entre dos notas: de una tecla a la siguiente, sea blanca o negra. Dos semitonos forman un tono.',
            puntos: [
              'Entre la mayoría de las teclas blancas hay una negra: la distancia es de <b>un tono</b>.',
              'Entre <b>Mi y Fa</b> y entre <b>Si y Do</b> no hay tecla negra: hay solo un semitono.',
              'Las teclas negras forman grupos de <b>dos y tres</b>: Do está justo a la izquierda del grupo de dos.',
              'Ubicar Do en cualquier parte del teclado te permite encontrar todas las demás notas.',
            ],
            practica: 'Encontrá todos los Do de tu teclado y después todos los Fa (a la izquierda del grupo de tres teclas negras).',
          },
        },
        {
          titulo: 'Evaluación: notas y teclado',
          repaso: 'Hay 12 sonidos; siete naturales (Do a Si) y cinco con alteraciones. Un semitono es la distancia entre dos teclas vecinas y un tono son dos semitonos. Entre Mi–Fa y Si–Do hay solo un semitono.',
          quiz: [
            { q: '¿Entre qué notas naturales hay solo un semitono?', o: ['Do–Re y Fa–Sol', 'Mi–Fa y Si–Do', 'Sol–La y La–Si', 'Re–Mi y Do–Re'], c: 'B', e: 'Son los dos lugares del teclado donde no hay tecla negra entre las blancas.' },
            { q: '¿Cómo se llama la nota La en cifrado americano?', o: ['L', 'A', 'G', 'E'], c: 'B', e: 'A=La, B=Si, C=Do, D=Re, E=Mi, F=Fa, G=Sol.' },
            { q: 'Do♯ y Re♭ son…', o: ['Notas distintas', 'Enarmónicos (el mismo sonido)', 'Una octava de distancia', 'Un tono de distancia'], c: 'B', e: 'Suenan igual; cambia el nombre según el contexto.' },
            { q: '¿Cuántos semitonos tiene un tono?', o: ['1', '2', '3', '4'], c: 'B', e: 'Un tono equivale a dos semitonos.' },
          ],
        },
      ],
    },
    {
      titulo: 'Ritmo: figuras y compases',
      clases: [
        {
          titulo: 'Figuras y silencios',
          nota: {
            intro: 'Las figuras indican cuánto dura cada nota. Cada una vale la mitad que la anterior.',
            puntos: [
              '<b>Redonda</b> = 4 tiempos, <b>blanca</b> = 2, <b>negra</b> = 1, <b>corchea</b> = ½, <b>semicorchea</b> = ¼.',
              'Cada figura tiene su <b>silencio</b> equivalente, que dura lo mismo.',
              'El <b>puntillo</b> agrega la mitad del valor: una negra con puntillo dura 1½ tiempos.',
              'La <b>ligadura</b> une dos figuras de la misma nota y suma sus duraciones.',
            ],
            practica: 'Marcá el pulso con el pie y aplaudí negras, corcheas y semicorcheas sobre ese mismo pulso.',
          },
        },
        {
          titulo: 'Compases simples y compuestos',
          nota: {
            intro: 'El compás agrupa los tiempos y nos dice dónde está el acento. Se escribe como una fracción al principio de la partitura.',
            puntos: [
              'El número de arriba indica <b>cuántos tiempos</b> hay; el de abajo, <b>qué figura</b> vale un tiempo.',
              '<b>4/4:</b> cuatro negras por compás. Es el compás de casi todo el pop, el rock y la música electrónica.',
              '<b>3/4:</b> tres negras: el compás del vals.',
              '<b>6/8:</b> compás compuesto, se siente en dos pulsos divididos en tres (como en muchas chacareras y baladas).',
            ],
            practica: 'Contá en voz alta “1-2-3-4” sobre un tema pop y “1-2-3” sobre un vals, acentuando el primer tiempo.',
          },
        },
        {
          titulo: 'Evaluación: ritmo',
          repaso: 'Cada figura vale la mitad de la anterior: redonda 4, blanca 2, negra 1, corchea ½. El puntillo suma la mitad del valor. En el compás, el número de arriba indica cuántos tiempos hay y el de abajo qué figura los marca.',
          quiz: [
            { q: '¿Cuántos tiempos dura una blanca en 4/4?', o: ['1', '2', '3', '4'], c: 'B', e: 'La blanca vale dos negras, es decir, dos tiempos.' },
            { q: '¿Cuánto dura una negra con puntillo?', o: ['1 tiempo', '1½ tiempos', '2 tiempos', '½ tiempo'], c: 'B', e: 'El puntillo suma la mitad: 1 + ½ = 1½.' },
            { q: '¿Qué compás es típico del vals?', o: ['4/4', '3/4', '2/4', '6/8'], c: 'B', e: 'El vals se cuenta en tres: uno-dos-tres.' },
            { q: 'En 4/4, ¿qué indica el 4 de abajo?', o: ['Que hay cuatro compases', 'Que la negra vale un tiempo', 'El tempo', 'La tonalidad'], c: 'B', e: 'El número de abajo indica la figura que vale un tiempo; 4 corresponde a la negra.' },
          ],
        },
      ],
    },
    {
      titulo: 'Intervalos',
      clases: [
        {
          titulo: 'Qué es un intervalo y cómo se nombra',
          nota: {
            intro: 'Un intervalo es la distancia entre dos notas. Se nombra con un número (cuántas notas abarca) y una calidad (mayor, menor, justa…).',
            puntos: [
              'De Do a Mi hay una <b>tercera</b>: Do, Re, Mi son tres notas.',
              'La <b>tercera mayor</b> tiene 4 semitonos (Do–Mi) y la <b>menor</b> 3 (Do–Mi♭).',
              'La <b>quinta justa</b> tiene 7 semitonos (Do–Sol) y es la base de los power chords.',
              'La <b>octava</b> tiene 12 semitonos: es la misma nota más aguda.',
            ],
            practica: 'Desde Do, tocá una tercera mayor, una tercera menor, una quinta justa y una octava, y contá los semitonos.',
          },
        },
        {
          titulo: 'Consonancia y disonancia',
          nota: {
            intro: 'Algunos intervalos suenan estables y otros generan tensión. Esa tensión no es mala: es lo que hace avanzar la música.',
            puntos: [
              '<b>Consonantes:</b> unísono, octava, quinta justa, terceras y sextas.',
              '<b>Disonantes:</b> segundas, séptimas y el tritono (6 semitonos).',
              'El <b>tritono</b> (por ejemplo Fa–Si) es la tensión que resuelve en el acorde de tónica.',
              'Las disonancias suelen <b>resolver</b> moviéndose por grado a una consonancia.',
            ],
            practica: 'Tocá Fa y Si juntos y después resolvé a Mi y Do. Escuchá cómo se “relaja” la tensión.',
          },
        },
        {
          titulo: 'Evaluación: intervalos',
          repaso: 'Un intervalo se nombra por la cantidad de notas que abarca y por su calidad. Tercera mayor = 4 semitonos, tercera menor = 3, quinta justa = 7, octava = 12. El tritono (6 semitonos) es la gran disonancia que pide resolver.',
          quiz: [
            { q: '¿Cuántos semitonos tiene una tercera mayor?', o: ['3', '4', '5', '7'], c: 'B', e: 'Do–Mi: Do♯, Re, Re♯, Mi → 4 semitonos.' },
            { q: '¿Qué intervalo hay entre Do y Sol?', o: ['Cuarta justa', 'Quinta justa', 'Sexta mayor', 'Tercera menor'], c: 'B', e: 'Do, Re, Mi, Fa, Sol: cinco notas, 7 semitonos → quinta justa.' },
            { q: '¿Cuántos semitonos tiene el tritono?', o: ['5', '6', '7', '8'], c: 'B', e: 'El tritono son tres tonos enteros: 6 semitonos.' },
            { q: '¿Cuál de estos intervalos es disonante?', o: ['Octava', 'Quinta justa', 'Séptima mayor', 'Tercera mayor'], c: 'C', e: 'Las séptimas y las segundas son los intervalos disonantes más comunes.' },
          ],
        },
      ],
    },
    {
      titulo: 'La escala mayor y las tonalidades',
      clases: [
        {
          titulo: 'La fórmula de la escala mayor',
          nota: {
            intro: 'Todas las escalas mayores siguen la misma fórmula de tonos (T) y semitonos (S). Si la sabés, podés armar la escala desde cualquier nota.',
            puntos: [
              'La fórmula es <b>T – T – S – T – T – T – S</b>.',
              'Do mayor no tiene alteraciones: <b>Do Re Mi Fa Sol La Si Do</b>.',
              'Sol mayor necesita un <b>Fa♯</b> para cumplir la fórmula.',
              'Fa mayor necesita un <b>Si♭</b>.',
            ],
            practica: 'Armá la escala de Re mayor aplicando la fórmula. Pista: tiene dos sostenidos.',
          },
        },
        {
          titulo: 'Armadura y círculo de quintas',
          nota: {
            intro: 'La armadura es el grupo de alteraciones que se escribe al principio del pentagrama para no repetirlas en cada nota. El círculo de quintas ordena todas las tonalidades.',
            puntos: [
              'Subiendo por quintas desde Do se agrega <b>un sostenido</b> por vez: Sol (1♯), Re (2♯), La (3♯)…',
              'Bajando por quintas (o subiendo por cuartas) se agrega <b>un bemol</b>: Fa (1♭), Si♭ (2♭), Mi♭ (3♭)…',
              'El orden de los sostenidos es <b>Fa Do Sol Re La Mi Si</b>.',
              'Las tonalidades vecinas en el círculo comparten casi todas sus notas.',
            ],
            practica: 'Escribí las armaduras de Sol, Re y La mayor y de Fa y Si♭ mayor.',
          },
        },
        {
          titulo: 'Evaluación: escala mayor',
          repaso: 'La escala mayor sigue la fórmula T–T–S–T–T–T–S. La armadura agrupa las alteraciones de la tonalidad, y el círculo de quintas ordena las tonalidades sumando un sostenido o un bemol por paso.',
          quiz: [
            { q: '¿Cuál es la fórmula de la escala mayor?', o: ['T–S–T–T–S–T–T', 'T–T–S–T–T–T–S', 'S–T–T–T–S–T–T', 'T–T–T–S–T–T–S'], c: 'B', e: 'Tono, tono, semitono, tono, tono, tono, semitono.' },
            { q: '¿Qué alteración tiene Sol mayor?', o: ['Si♭', 'Fa♯', 'Do♯', 'Ninguna'], c: 'B', e: 'Para respetar la fórmula, el séptimo grado de Sol es Fa♯.' },
            { q: '¿Cuántos sostenidos tiene Re mayor?', o: ['1', '2', '3', '0'], c: 'B', e: 'Re mayor tiene Fa♯ y Do♯.' },
            { q: '¿Qué tonalidad mayor tiene un bemol?', o: ['Sol', 'Fa', 'Re', 'La'], c: 'B', e: 'Fa mayor tiene Si♭.' },
          ],
        },
      ],
    },
    {
      titulo: 'Acordes: tríadas y séptimas',
      clases: [
        {
          titulo: 'Tríadas mayores, menores y disminuidas',
          nota: {
            intro: 'Una tríada se arma con una nota (la fundamental), su tercera y su quinta. Según el tamaño de esas terceras, el acorde cambia de color.',
            puntos: [
              '<b>Mayor:</b> tercera mayor + tercera menor. Do mayor = Do–Mi–Sol.',
              '<b>Menor:</b> tercera menor + tercera mayor. Do menor = Do–Mi♭–Sol.',
              '<b>Disminuida:</b> dos terceras menores. Si disminuido = Si–Re–Fa.',
              '<b>Aumentada:</b> dos terceras mayores. Do aumentado = Do–Mi–Sol♯.',
            ],
            practica: 'Armá tríadas mayores y menores desde Re, Mi y La, y escuchá la diferencia entre las dos.',
          },
        },
        {
          titulo: 'Acordes de séptima',
          nota: {
            intro: 'Si a una tríada le sumás otra tercera arriba, obtenés un acorde de séptima. Es el sonido típico del jazz, el soul y el neo soul.',
            puntos: [
              '<b>Maj7:</b> tríada mayor + séptima mayor. Cmaj7 = Do–Mi–Sol–Si.',
              '<b>7 (dominante):</b> tríada mayor + séptima menor. G7 = Sol–Si–Re–Fa.',
              '<b>m7:</b> tríada menor + séptima menor. Am7 = La–Do–Mi–Sol.',
              'El acorde <b>dominante</b> contiene un tritono y por eso pide resolver.',
            ],
            practica: 'Tocá Cmaj7, Am7, Dm7 y G7 en ese orden y escuchá cómo G7 te lleva de vuelta a Cmaj7.',
          },
        },
        {
          titulo: 'Evaluación: acordes',
          repaso: 'Las tríadas se arman con fundamental, tercera y quinta; su calidad depende de las terceras. Sumando una séptima aparecen Maj7, 7 (dominante) y m7. El dominante tiene un tritono y tiende a resolver.',
          quiz: [
            { q: '¿Qué notas forman Do mayor?', o: ['Do–Mi♭–Sol', 'Do–Mi–Sol', 'Do–Fa–La', 'Do–Mi–Sol♯'], c: 'B', e: 'Fundamental Do, tercera mayor Mi y quinta justa Sol.' },
            { q: '¿Qué diferencia a una tríada menor de una mayor?', o: ['La quinta', 'La tercera', 'La fundamental', 'La octava'], c: 'B', e: 'En la menor la tercera está medio tono más abajo.' },
            { q: '¿Qué notas forman G7?', o: ['Sol–Si–Re–Fa', 'Sol–Si–Re–Fa♯', 'Sol–Si♭–Re–Fa', 'Sol–Do–Re–Fa'], c: 'A', e: 'G7 es tríada mayor de Sol más séptima menor (Fa).' },
            { q: '¿Cómo es la tríada de Si en Do mayor?', o: ['Mayor', 'Menor', 'Disminuida', 'Aumentada'], c: 'C', e: 'Si–Re–Fa son dos terceras menores: acorde disminuido.' },
          ],
        },
      ],
    },
    {
      titulo: 'Armonía funcional',
      clases: [
        {
          titulo: 'Grados y funciones',
          nota: {
            intro: 'Cada acorde de una tonalidad cumple un rol. Pensar en funciones te permite entender por qué una progresión funciona y reemplazar acordes con criterio.',
            puntos: [
              '<b>Tónica (I, vi, iii):</b> reposo, la sensación de “llegar a casa”.',
              '<b>Subdominante (IV, ii):</b> alejamiento, prepara el movimiento.',
              '<b>Dominante (V, vii°):</b> tensión que pide volver a la tónica.',
              'En Do mayor: C es tónica, F y Dm son subdominantes, G y Bdim son dominantes.',
            ],
            practica: 'Escribí una progresión que siga el camino tónica → subdominante → dominante → tónica.',
          },
        },
        {
          titulo: 'Cadencias',
          nota: {
            intro: 'Una cadencia es la forma en que termina una frase musical. Igual que la puntuación en un texto, puede cerrar o dejar en suspenso.',
            puntos: [
              '<b>Auténtica (V–I):</b> el cierre más fuerte, como un punto final.',
              '<b>Plagal (IV–I):</b> un cierre suave, el “amén” de los himnos.',
              '<b>Semicadencia (termina en V):</b> deja la frase en suspenso, como una coma.',
              '<b>Rota (V–vi):</b> el oído espera la tónica y aparece el vi: sorpresa.',
            ],
            practica: 'Tocá las cuatro cadencias en Do mayor y describí con una palabra qué sensación te deja cada una.',
          },
        },
        {
          titulo: 'Evaluación: armonía funcional',
          repaso: 'Los acordes se agrupan en tres funciones: tónica (reposo), subdominante (preparación) y dominante (tensión). Las cadencias auténtica, plagal, semicadencia y rota definen cómo cierra cada frase.',
          quiz: [
            { q: '¿Qué función cumple el V grado?', o: ['Tónica', 'Subdominante', 'Dominante', 'Ninguna'], c: 'C', e: 'El V genera la tensión que resuelve en el I.' },
            { q: '¿Qué cadencia es IV–I?', o: ['Auténtica', 'Plagal', 'Rota', 'Semicadencia'], c: 'B', e: 'La plagal va de la subdominante a la tónica.' },
            { q: 'En la cadencia rota, el V va a…', o: ['I', 'IV', 'vi', 'ii'], c: 'C', e: 'En lugar de resolver a I, resuelve al vi y sorprende.' },
            { q: '¿Qué acorde es la tónica en Do mayor?', o: ['G', 'F', 'C', 'Am'], c: 'C', e: 'El I grado de Do mayor es C.' },
          ],
        },
      ],
    },
    {
      titulo: 'Escalas menores y modos',
      clases: [
        {
          titulo: 'Menor natural, armónica y melódica',
          nota: {
            intro: 'Cada tonalidad mayor tiene una relativa menor que comparte sus mismas notas. A partir de ella aparecen tres versiones de la escala menor.',
            puntos: [
              'La relativa menor empieza en el <b>sexto grado</b>: la relativa de Do mayor es La menor.',
              '<b>Menor natural:</b> La Si Do Re Mi Fa Sol La.',
              '<b>Menor armónica:</b> sube el séptimo grado (Sol♯) para tener un dominante mayor (E).',
              '<b>Menor melódica:</b> sube el sexto y el séptimo al subir (Fa♯ y Sol♯).',
            ],
            practica: 'Tocá las tres escalas menores desde La y prestá atención al cambio que produce el Sol♯.',
          },
        },
        {
          titulo: 'Introducción a los modos',
          nota: {
            intro: 'Los modos son escalas que salen de tocar la escala mayor empezando desde cada uno de sus grados. Cada uno tiene un color propio.',
            puntos: [
              '<b>Jónico</b> (desde el I): la escala mayor.',
              '<b>Dórico</b> (desde el II): menor con la sexta mayor, muy usado en funk y jazz.',
              '<b>Mixolidio</b> (desde el V): mayor con la séptima menor, típico del rock y el blues.',
              '<b>Eólico</b> (desde el VI): la escala menor natural.',
            ],
            practica: 'Tocá las notas blancas desde Re hasta Re (dórico) y desde Sol hasta Sol (mixolidio) y comparalas con Do mayor.',
          },
        },
        {
          titulo: 'Evaluación final',
          repaso: 'La relativa menor está en el VI grado de la mayor. La menor armónica sube el séptimo grado y la melódica sube el sexto y el séptimo. Los modos son la escala mayor vista desde cada grado: dórico, mixolidio y eólico son los más usados.',
          quiz: [
            { q: '¿Cuál es la relativa menor de Do mayor?', o: ['Mi menor', 'La menor', 'Re menor', 'Do menor'], c: 'B', e: 'La relativa menor empieza en el sexto grado: La.' },
            { q: '¿Qué nota cambia en La menor armónica?', o: ['Fa♯', 'Sol♯', 'Do♯', 'Si♭'], c: 'B', e: 'Se sube el séptimo grado: Sol pasa a Sol♯.' },
            { q: '¿Desde qué grado de la escala mayor se forma el modo dórico?', o: ['I', 'II', 'V', 'VI'], c: 'B', e: 'Dórico es la escala mayor tocada desde el segundo grado.' },
            { q: 'El modo mixolidio es como la escala mayor pero con…', o: ['La tercera menor', 'La séptima menor', 'La sexta menor', 'La cuarta aumentada'], c: 'B', e: 'Mixolidio tiene la séptima menor, por eso suena a rock y blues.' },
            { q: '¿Qué otro nombre tiene la escala menor natural?', o: ['Dórico', 'Eólico', 'Lidio', 'Frigio'], c: 'B', e: 'El eólico, desde el sexto grado, es la menor natural.' },
          ],
        },
      ],
    },
  ],
};
