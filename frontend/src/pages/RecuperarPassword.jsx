import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacionRequest } from '../services/authService';

function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    try {
      const data = await solicitarRecuperacionRequest(email);
      setMensaje(data.mensaje);
      // Esto es solo para el MVP, mientras el envío de email es simulado:
      if (data.linkSimulado) {
        console.log('Link de recuperación (simulado):', data.linkSimulado);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h2>Recuperar contraseña</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
        </button>
      </form>

      <p>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}

export default RecuperarPassword;