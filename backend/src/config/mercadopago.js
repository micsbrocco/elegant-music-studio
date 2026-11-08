const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const cliente = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
module.exports = { cliente, Preference, Payment };