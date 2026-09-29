import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // evita que el formulario recargue la página
    setError('');
    setCargando(true);

    try {
      const data = await loginRequest(email, password);
      login(data.usuario, data.token); // guarda la sesión en el Context
      navigate('/'); // redirige al home (lo armamos después)
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al iniciar sesión';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h2>Iniciar sesión</h2>
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
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p>
        <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
      </p>

      <p>
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  );
}

export default Login;