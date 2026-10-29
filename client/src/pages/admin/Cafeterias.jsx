import { useState } from 'react';
import { api } from '../../api.js';
import { Cargando, Error, Interruptor, Modal, useDatos, useToast } from '../../components/ui.jsx';
import { describirRegla, numero, ROL_NOMBRE } from '../../util.js';

function FormCafeteria({ inicial, onCerrar, onGuardado }) {
  const [f, setF] = useState({ nombre: inicial?.nombre || '', ubicacion: inicial?.ubicacion || '' });
  const [error, setError] = useState(null);
  const enviar = async (e) => {
    e.preventDefault();
    try {
      const c = inicial
        ? await api(`/cafeterias/${inicial.id}`, { metodo: 'PUT', cuerpo: f })
        : await api('/cafeterias', { metodo: 'POST', cuerpo: f });
      onGuardado(c);
    } catch (err) { setError(err.message); }
  };
  return (
    <Modal titulo={inicial ? 'Editar cafetería' : 'Nueva cafetería'} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        {error && <div className="aviso aviso-error" role="alert">{error}</div>}
        <div className="campo"><label htmlFor="cn">Nombre</label><input id="cn" className="input" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoFocus /></div>
        <div className="campo"><label htmlFor="cu">Ubicación</label><input id="cu" className="input" value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })} /></div>
        {!inicial && <p className="pequeno texto-suave">Empieza con un 10 % de descuento, hasta 2 veces al día. La dueña puede cambiarlo.</p>}
        <div className="acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button className="btn">{inicial ? 'Guardar cambios' : 'Crear cafetería'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Cafeterias() {
  const { datos, error, recargar } = useDatos('/cafeterias');
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [toast, avisar] = useToast();

  const cambiarActiva = async (c, activa) => {
    try {
      await api(`/cafeterias/${c.id}`, { metodo: 'PUT', cuerpo: { activa } });
      avisar(activa ? `${c.nombre} vuelve a registrar tuppers` : `${c.nombre} quedó desactivada`);
      recargar();
    } catch (e) { avisar(e.message); }
  };
  const eliminar = async () => {
    try {
      await api(`/cafeterias/${borrando.id}`, { metodo: 'DELETE' });
      avisar('Cafetería eliminada');
      recargar();
    } catch (e) { avisar(e.message); }
    setBorrando(null);
  };

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!datos) return <Cargando />;

  return (
    <>
      <div className="encabezado">
        <div><h1>Cafeterías</h1><p>Desactiva una cafetería para pausar sus registros sin perder su historial.</p></div>
        <button className="btn" onClick={() => setEditando('nueva')}>Nueva cafetería</button>
      </div>
      <div className="rejilla rejilla-2">
        {datos.map((c) => (
          <div className="panel" key={c.id} style={{ marginTop: 0 }}>
            <div className="panel-titulo">
              <div>
                <h2>{c.nombre}</h2>
                <div className="pequeno texto-suave">{c.ubicacion || 'Sin ubicación'}</div>
              </div>
              <Interruptor checked={c.activa} onChange={(v) => cambiarActiva(c, v)}><span className="pequeno">{c.activa ? 'Activa' : 'Inactiva'}</span></Interruptor>
            </div>
            <p className="pequeno" style={{ marginBottom: '0.5rem' }}>
              <b>Descuento:</b> {c.regla.activo ? describirRegla(c.regla) : 'pausado por la dueña'}.<br />
              <b>Registros históricos:</b> {numero(c.totalRegistros)}
            </p>
            <ul className="lista">
              {c.personal.length === 0 && <li className="secundario">Sin personal asignado.</li>}
              {c.personal.map((u) => (
                <li key={u.id}>
                  <span>{u.nombre}</span>
                  <span className={`chip ${u.activo ? '' : 'chip-ambar'}`}>{ROL_NOMBRE[u.rol]}{u.activo ? '' : ', inactivo'}</span>
                </li>
              ))}
            </ul>
            <div className="acciones">
              <button className="btn btn-texto" onClick={() => setEditando(c)}>Editar</button>
              <button className="btn btn-texto" style={{ color: 'var(--rojo)' }} onClick={() => setBorrando(c)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <FormCafeteria inicial={editando === 'nueva' ? null : editando} onCerrar={() => setEditando(null)}
          onGuardado={(c) => { setEditando(null); avisar(`${c.nombre} guardada`); recargar(); }} />
      )}
      {borrando && (
        <Modal titulo={`¿Eliminar ${borrando.nombre}?`} onCerrar={() => setBorrando(null)}>
          <p>{borrando.totalRegistros > 0
            ? 'Esta cafetería tiene historial de registros, así que no se puede eliminar. Desactívala para pausarla y conservar sus métricas.'
            : 'Se eliminará la cafetería y su personal quedará desactivado.'}</p>
          <div className="acciones">
            <button className="btn btn-secundario" onClick={() => setBorrando(null)}>Cancelar</button>
            {borrando.totalRegistros === 0 && <button className="btn btn-peligro" onClick={eliminar}>Eliminar cafetería</button>}
          </div>
        </Modal>
      )}
      {toast}
    </>
  );
}
