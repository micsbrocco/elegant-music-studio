import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrarRequest } from '../services/authService';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await registrarRequest(nombre, apellido, email, password);
      setRegistroExitoso(true);
      // Redirige a login después de un momento, para que el mensaje se alcance a leer
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al registrarse';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  if (registroExitoso) {
    return (
      <div>
        <h2>¡Cuenta creada!</h2>
        <p>Ya podés iniciar sesión con tu email y contraseña.</p>
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
        </div>
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
            minLength={6}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}

export default Registro;