import { useState } from 'react';
import { api } from '../api.js';
import { Modal } from './ui.jsx';

/**
 * Formulario para crear o editar usuarios.
 * - Sin `inicial`: crea personal (dueñas, empleados o administración).
 * - Con `inicial`: edita a ese usuario. La contraseña es opcional (solo si se quiere cambiar).
 */
export default function FormUsuario({ cafeterias, rolFijo, inicial, onCerrar, onCreado, onGuardado }) {
  const editando = Boolean(inicial);
  const esCliente = inicial?.rol === 'cliente';
  const [f, setF] = useState({
    nombre: inicial?.nombre || '',
    email: inicial?.email || '',
    carnet: inicial?.carnet || '',
    password: '',
    rol: inicial?.rol || rolFijo || 'empleado',
    cafeteriaId: inicial?.cafeteriaId || cafeterias?.[0]?.id || '',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'carnet' ? e.target.value.toUpperCase() : e.target.value });

  const mostrarRol = !rolFijo && !esCliente;
  const mostrarCafeteria = mostrarRol && cafeterias && cafeterias.length > 0 && f.rol !== 'admin';

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (editando) {
        const cuerpo = { nombre: f.nombre, email: f.email };
        if (f.password) cuerpo.password = f.password;
        if (esCliente) cuerpo.carnet = f.carnet;
        if (mostrarRol) { cuerpo.rol = f.rol; cuerpo.cafeteriaId = f.cafeteriaId; }
        const u = await api(`/usuarios/${inicial.id}`, { metodo: 'PUT', cuerpo });
        onGuardado?.(u);
      } else {
        const u = await api('/usuarios', { metodo: 'POST', cuerpo: f });
        onCreado?.(u);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const titulo = editando ? `Editar a ${inicial.nombre.split(' ')[0]}` : rolFijo === 'empleado' ? 'Agregar empleado' : 'Agregar personal';

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        {error && <div className="aviso aviso-error" role="alert">{error}</div>}
        <div className="campo"><label htmlFor="fn">Nombre completo</label><input id="fn" className="input" value={f.nombre} onChange={set('nombre')} autoFocus /></div>
        <div className="campo"><label htmlFor="fe">Correo institucional</label><input id="fe" className="input" type="email" value={f.email} onChange={set('email')} placeholder="nombre@udb.edu.sv" /></div>
        {esCliente && (
          <div className="campo"><label htmlFor="fk">Número de carné</label><input id="fk" className="input" value={f.carnet} onChange={set('carnet')} maxLength={8} /><span className="ayuda">2 letras y 6 números. Cambiarlo cambia el código QR del carné virtual.</span></div>
        )}
        <div className="campo">
          <label htmlFor="fp">{editando ? 'Nueva contraseña' : 'Contraseña inicial'}</label>
          <input id="fp" className="input" value={f.password} onChange={set('password')} placeholder={editando ? 'Déjala vacía para no cambiarla' : ''} />
          <span className="ayuda">Mínimo 8 caracteres, con letras y números. La persona puede cambiarla en “Mi cuenta”.</span>
        </div>
        {mostrarRol && (
          <div className="campo">
            <label htmlFor="fr">Rol</label>
            <select id="fr" className="input" value={f.rol} onChange={set('rol')}>
              <option value="empleado">Empleado de cafetería</option>
              <option value="duena">Dueña de cafetería</option>
              <option value="admin">Administración UDB</option>
            </select>
          </div>
        )}
        {mostrarCafeteria && (
          <div className="campo">
            <label htmlFor="fc">Cafetería</label>
            <select id="fc" className="input" value={f.cafeteriaId} onChange={set('cafeteriaId')}>
              {cafeterias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        )}
        <div className="acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button className="btn" disabled={enviando}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
