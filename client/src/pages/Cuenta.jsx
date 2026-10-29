import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { ROL_NOMBRE } from '../util.js';

export default function Cuenta() {
  const { usuario, cafeteria } = useAuth();
  const [f, setF] = useState({ actual: '', nueva: '', confirmar: '' });
  const [estado, setEstado] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    if (f.nueva !== f.confirmar) return setEstado({ error: 'Las contraseñas nuevas no coinciden.' });
    try {
      await api('/auth/password', { metodo: 'PUT', cuerpo: { actual: f.actual, nueva: f.nueva } });
      setEstado({ ok: 'Contraseña actualizada.' });
      setF({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setEstado({ error: err.message });
    }
  };

  return (
    <div className="contenido-angosto">
      <div className="encabezado"><div><h1>Mi cuenta</h1></div></div>
      <div className="panel">
        <ul className="lista">
          <li><span className="secundario">Nombre</span><span className="principal">{usuario.nombre}</span></li>
          <li><span className="secundario">Correo</span><span className="principal">{usuario.email}</span></li>
          {usuario.carnet && <li><span className="secundario">Carné</span><span className="principal">{usuario.carnet}</span></li>}
          <li><span className="secundario">Rol</span><span className="principal">{ROL_NOMBRE[usuario.rol]}</span></li>
          {cafeteria && <li><span className="secundario">Cafetería</span><span className="principal">{cafeteria.nombre}</span></li>}
        </ul>
      </div>
      <form className="panel" onSubmit={enviar}>
        <h2>Cambiar contraseña</h2>
        {estado?.error && <div className="aviso aviso-error" role="alert">{estado.error}</div>}
        {estado?.ok && <div className="aviso aviso-ok" role="status">{estado.ok}</div>}
        <div className="campo"><label htmlFor="a">Contraseña actual</label><input id="a" type="password" className="input" autoComplete="current-password" value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} /></div>
        <div className="campo"><label htmlFor="n">Nueva contraseña</label><input id="n" type="password" className="input" autoComplete="new-password" value={f.nueva} onChange={(e) => setF({ ...f, nueva: e.target.value })} /><span className="ayuda">Mínimo 8 caracteres, con letras y números.</span></div>
        <div className="campo"><label htmlFor="c">Confirma la nueva contraseña</label><input id="c" type="password" className="input" autoComplete="new-password" value={f.confirmar} onChange={(e) => setF({ ...f, confirmar: e.target.value })} /></div>
        <button className="btn" disabled={!f.actual || !f.nueva}>Cambiar contraseña</button>
      </form>
    </div>
  );
}
