import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo } from '../components/ui.jsx';
import { RUTA_INICIO } from '../util.js';

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const navegar = useNavigate();
  const [f, setF] = useState({ nombre: '', carnet: '', email: '', password: '', confirmar: '', tipoCliente: 'estudiante' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: k === 'carnet' ? e.target.value.toUpperCase() : e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (f.password !== f.confirmar) return setError('Las contraseñas no coinciden.');
    setEnviando(true);
    try {
      await registrarse({ nombre: f.nombre, carnet: f.carnet, email: f.email, password: f.password, tipoCliente: f.tipoCliente });
      navegar('/cliente', { replace: true, state: { nuevo: true } });
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
          <h1 style={{ fontSize: '1.5rem' }}>Crear tu cuenta</h1>
          <p className="texto-suave pequeno">Al terminar tendrás tu carné virtual listo para usar en cualquier chalet.</p>
          {error && <div className="aviso aviso-error" role="alert">{error}</div>}
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input id="nombre" className="input" autoComplete="name" value={f.nombre} onChange={set('nombre')} required />
          </div>
          <div className="campo">
            <label htmlFor="carnet">Número de carné</label>
            <input id="carnet" className="input" value={f.carnet} onChange={set('carnet')} maxLength={8} placeholder="HM250117" autoCapitalize="characters" required />
            <span className="ayuda">2 letras y 6 números, como aparece en tu carné.</span>
          </div>
          <div className="campo">
            <label htmlFor="email">Correo institucional</label>
            <input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={set('email')} placeholder="tucarne@alumno.udb.edu.sv" required />
          </div>
          <div className="campo">
            <label htmlFor="tipo">Soy</label>
            <select id="tipo" className="input" value={f.tipoCliente} onChange={set('tipoCliente')}>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrativo">Personal administrativo</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" className="input" autoComplete="new-password" value={f.password} onChange={set('password')} required />
            <span className="ayuda">Mínimo 8 caracteres, con letras y números.</span>
          </div>
          <div className="campo">
            <label htmlFor="conf">Confirma la contraseña</label>
            <input id="conf" type="password" className="input" autoComplete="new-password" value={f.confirmar} onChange={set('confirmar')} required />
          </div>
          <button className="btn btn-hoja btn-bloque" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Crear cuenta'}</button>
          <p className="pequeno texto-suave" style={{ marginTop: '1rem', marginBottom: 0 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
