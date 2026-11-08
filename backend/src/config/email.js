const nodemailer = require('nodemailer');

// "service: 'gmail'" le dice a Nodemailer que use la configuración SMTP de Gmail
// automáticamente (servidor, puerto, seguridad), sin tener que especificarla a mano.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Función genérica: la van a usar tanto la recuperación de contraseña como la
// confirmación de registro, cada una armando su propio asunto y HTML.
async function enviarEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// Arma el HTML de un email con el estilo de la marca (fondo oscuro, acento dorado)
// y un botón real en vez de un link pelado. La usan tanto la confirmación de
// cuenta como la recuperación de contraseña, cada una con su propio texto.
function plantillaEmail({ titulo, parrafos, textoBoton, urlBoton, notaFinal }) {
  const parrafosHtml = parrafos
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; color: #d4d4d4; font-size: 15px; line-height: 1.6;">${p}</p>`
    )
    .join('');

  // El botón es opcional (ej: el comprobante del Botón de arrepentimiento no lo lleva)
  const bloqueBoton = urlBoton ? `          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
            <tr>
              <td style="border-radius: 6px; background-color: #d4af37;">
                <a href="${urlBoton}" target="_blank"
                   style="display: inline-block; padding: 14px 32px; color: #0d0d0d; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; font-family: Arial, Helvetica, sans-serif;">
                  ${textoBoton}
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 8px; color: #777777; font-size: 12px; line-height: 1.5;">
            Si el botón no funciona, copiá y pegá este link en tu navegador:
          </p>
          <p style="margin: 0 0 24px; word-break: break-all;">
            <a href="${urlBoton}" style="color: #d4af37; font-size: 12px;">${urlBoton}</a>
          </p>
  ` : '';

  return `
  <div style="background-color: #0d0d0d; padding: 40px 20px; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background-color: #161616; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
      <tr>
        <td style="height: 4px; background-color: #d4af37; line-height: 4px; font-size: 0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 40px 32px;">
          <p style="margin: 0 0 28px; color: #d4af37; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
            Elegant Music Studio
          </p>

          <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 22px; font-weight: 600;">
            ${titulo}
          </h1>

          ${parrafosHtml}

          ${bloqueBoton}

          ${notaFinal ? `<p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">${notaFinal}</p>` : ''}
        </td>
      </tr>
    </table>
  </div>
  `;
}

module.exports = { enviarEmail, plantillaEmail };