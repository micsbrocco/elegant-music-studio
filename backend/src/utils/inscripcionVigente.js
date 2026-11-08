// Una inscripción deja de dar acceso si su pago se reembolsó o tuvo un
// contracargo. Se suma a los "where" que buscan la inscripción de un alumno:
//   prisma.inscripcion.findFirst({ where: { idUsuario, idCurso, ...INSCRIPCION_VIGENTE } })
const ESTADOS_PAGO_REVERTIDO = ['reembolsado', 'contracargo'];

const INSCRIPCION_VIGENTE = {
  NOT: { pago: { is: { estado: { in: ESTADOS_PAGO_REVERTIDO } } } },
};

module.exports = { INSCRIPCION_VIGENTE, ESTADOS_PAGO_REVERTIDO };
