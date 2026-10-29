import { useState } from 'react';
import { api } from '../api.js';
import { Modal } from './ui.jsx';

/** Formulario para crear personal (dueñas y empleados) */
export default function FormUsuario({ cafeterias, rolFijo, onCerrar, onCreado }) {
  const [f, setF] = useState({ nombre: '', email: '', password: '', rol: rolFijo || 'empleado', cafeteriaId: cafeterias?.[0]?.id || '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await api('/usuarios', { metodo: 'POST', cuerpo: f });
      onCreado(u);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={rolFijo === 'empleado' ? 'Agregar empleado' : 'Agregar personal'} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        {error && <div className="aviso aviso-error" role="alert">{error}</div>}
        <div className="campo"><label htmlFor="fn">Nombre completo</label><input id="fn" className="input" value={f.nombre} onChange={set('nombre')} autoFocus /></div>
        <div className="campo"><label htmlFor="fe">Correo institucional</label><input id="fe" className="input" type="email" value={f.email} onChange={set('email')} placeholder="nombre@udb.edu.sv" /></div>
        <div className="campo"><label htmlFor="fp">Contraseña inicial</label><input id="fp" className="input" value={f.password} onChange={set('password')} /><span className="ayuda">Mínimo 8 caracteres, con letras y números. La persona puede cambiarla en “Mi cuenta”.</span></div>
        {!rolFijo && (
          <div className="campo">
            <label htmlFor="fr">Rol</label>
            <select id="fr" className="input" value={f.rol} onChange={set('rol')}>
              <option value="empleado">Empleado de cafetería</option>
              <option value="duena">Dueña de cafetería</option>
            </select>
          </div>
        )}
        {cafeterias && cafeterias.length > 0 && !rolFijo && (
          <div className="campo">
            <label htmlFor="fc">Cafetería</label>
            <select id="fc" className="input" value={f.cafeteriaId} onChange={set('cafeteriaId')}>
              {cafeterias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button className="btn" disabled={enviando}>{enviando ? 'Creando…' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
}
