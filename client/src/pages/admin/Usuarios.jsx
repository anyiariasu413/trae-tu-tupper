import { useState } from 'react';
import { api } from '../../api.js';
import FormUsuario from '../../components/FormUsuario.jsx';
import { Cargando, Error, Interruptor, useDatos, useToast } from '../../components/ui.jsx';
import { ROL_NOMBRE, fecha, numero } from '../../util.js';

const FILTROS = [
  { v: 'personal', t: 'Personal' },
  { v: 'cliente', t: 'Clientes' },
];

export default function Usuarios() {
  const [filtro, setFiltro] = useState('personal');
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const ruta = filtro === 'cliente' ? `/usuarios?rol=cliente&q=${encodeURIComponent(busqueda)}` : `/usuarios?rol=personal&q=${encodeURIComponent(busqueda)}`;
  const { datos, error, recargar } = useDatos(ruta);
  const { datos: cafeterias } = useDatos('/cafeterias');
  const [creando, setCreando] = useState(false);
  const [toast, avisar] = useToast();

  const cambiarEstado = async (u, activo) => {
    try {
      await api(`/usuarios/${u.id}/estado`, { metodo: 'PATCH', cuerpo: { activo } });
      avisar(activo ? `${u.nombre} reactivado` : `${u.nombre} desactivado`);
      recargar();
    } catch (e) { avisar(e.message); }
  };

  const nombreCafe = Object.fromEntries((cafeterias || []).map((c) => [c.id, c.nombre]));
  const lista = (datos?.usuarios || []).filter((u) => (filtro === 'personal' ? u.rol !== 'cliente' : true));

  return (
    <>
      <div className="encabezado">
        <div><h1>Usuarios</h1><p>Crea cuentas para dueñas y empleados, y consulta a los participantes.</p></div>
        <button className="btn" onClick={() => setCreando(true)}>Agregar personal</button>
      </div>
      <div className="panel">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div className="pestanas" role="tablist" style={{ marginBottom: 0, minWidth: 240 }}>
            {FILTROS.map((x) => <button key={x.v} role="tab" aria-selected={filtro === x.v} onClick={() => setFiltro(x.v)}>{x.t}</button>)}
          </div>
          <form style={{ flex: 1, minWidth: 220, display: 'flex', gap: '0.5rem' }} onSubmit={(e) => { e.preventDefault(); setBusqueda(q); }}>
            <label htmlFor="bq" className="sr">Buscar</label>
            <input id="bq" className="input" placeholder="Buscar por nombre, correo o carné" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-secundario">Buscar</button>
          </form>
        </div>
        {error && <Error mensaje={error} reintentar={recargar} />}
        {!datos ? <Cargando /> : lista.length === 0 ? (
          <div className="vacio">No hay usuarios que coincidan con la búsqueda.</div>
        ) : (
          <div className="tabla-envoltura">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  {filtro === 'cliente' ? <><th>Carné</th><th>Tipo</th><th className="num">Usos</th><th>Desde</th></> : <><th>Rol</th><th>Cafetería</th></>}
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.nombre}</b><div className="pequeno texto-suave">{u.email}</div></td>
                    {filtro === 'cliente' ? (
                      <><td>{u.carnet}</td><td style={{ textTransform: 'capitalize' }}>{u.tipoCliente}</td><td className="num">{numero(u.usos)}</td><td>{fecha(u.creadoEn)}</td></>
                    ) : (
                      <><td>{ROL_NOMBRE[u.rol]}</td><td>{nombreCafe[u.cafeteriaId] || '—'}</td></>
                    )}
                    <td>{u.rol === 'admin' ? <span className="chip chip-tapa">Activo</span> : <Interruptor checked={u.activo} onChange={(v) => cambiarEstado(u, v)}><span className="sr">Activo</span></Interruptor>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {datos && datos.total > 100 && <p className="pequeno texto-suave">Se muestran 100 de {numero(datos.total)}. Usa la búsqueda para encontrar a alguien.</p>}
      </div>
      {creando && cafeterias && (
        <FormUsuario cafeterias={cafeterias} onCerrar={() => setCreando(false)}
          onCreado={(u) => { setCreando(false); avisar(`${u.nombre} ya puede iniciar sesión`); recargar(); }} />
      )}
      {toast}
    </>
  );
}
