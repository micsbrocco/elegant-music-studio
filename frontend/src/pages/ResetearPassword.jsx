import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetearPasswordRequest } from '../services/authService';

function ResetearPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // lee el ?token=... de la URL

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await resetearPasswordRequest(token, nuevaPassword);
      setMensaje('Contraseña actualizada. Ya podés iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000); // espera 2seg y redirige
    } catch (err) {
      setError(err.response?.data?.error || 'Error al resetear la contraseña');
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return <p>Link inválido: falta el token de recuperación.</p>;
  }

  return (
    <div>
      <h2>Restablecer contraseña</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      <p>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}

export default ResetearPassword;