import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo } from '../components/ui.jsx';
import { RUTA_INICIO } from '../util.js';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const loc = useLocation();
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await entrar(id, pass);
      const desde = loc.state?.desde;
      navegar(desde && desde.startsWith(RUTA_INICIO[u.rol]) ? desde : RUTA_INICIO[u.rol], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-caja">
        <Link to="/" className="marca"><Logo /><div><strong>Trae tu Tupper</strong><span>Universidad Don Bosco</span></div></Link>
        <form className="panel" onSubmit={enviar} noValidate>
          <h1 style={{ fontSize: '1.5rem' }}>Iniciar sesión</h1>
          <p className="texto-suave pequeno">Estudiantes, docentes y personal de cafeterías.</p>
          {error && <div className="aviso aviso-error" role="alert">{error}</div>}
          <div className="campo">
            <label htmlFor="id">Correo institucional o número de carné</label>
            <input id="id" className="input" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} required autoFocus />
          </div>
          <div className="campo">
            <label htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" className="input" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
          </div>
          <button className="btn btn-bloque" disabled={enviando || !id || !pass}>{enviando ? 'Verificando…' : 'Iniciar sesión'}</button>
          <p className="pequeno texto-suave" style={{ marginTop: '1rem', marginBottom: 0 }}>
            ¿Aún no tienes cuenta? <Link to="/registro">Crea tu cuenta con tu carné</Link>.<br />
            ¿Vienes a evaluar? Las cuentas de prueba están en la <a href="/#guia">guía de evaluación</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
