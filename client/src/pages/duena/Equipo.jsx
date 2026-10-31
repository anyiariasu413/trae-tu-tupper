import { useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import FormUsuario from '../../components/FormUsuario.jsx';
import { Cargando, Error, Interruptor, useDatos, useToast } from '../../components/ui.jsx';

export default function Equipo() {
  const { cafeteria } = useAuth();
  const { datos, error, recargar } = useDatos('/usuarios?rol=empleado');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [toast, avisar] = useToast();

  const cambiarEstado = async (u, activo) => {
    try {
      await api(`/usuarios/${u.id}/estado`, { metodo: 'PATCH', cuerpo: { activo } });
      avisar(activo ? `${u.nombre} puede volver a registrar` : `${u.nombre} ya no puede iniciar sesión`);
      recargar();
    } catch (e) { avisar(e.message); }
  };

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!datos) return <Cargando />;

  return (
    <div className="contenido-angosto">
      <div className="encabezado">
        <div><h1>Equipo</h1><p>Personal que registra tuppers en {cafeteria?.nombre}.</p></div>
        <button className="btn" onClick={() => setCreando(true)}>Agregar empleado</button>
      </div>
      <div className="panel">
        {datos.usuarios.length === 0 ? (
          <div className="vacio">Aún no hay empleados. Agrega a la primera persona que atenderá la caja.</div>
        ) : (
          <ul className="lista">
            {datos.usuarios.map((u) => (
              <li key={u.id}>
                <div><div className="principal">{u.nombre}</div><div className="secundario">{u.email}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="btn btn-texto" onClick={() => setEditando(u)}>Editar</button>
                  <Interruptor checked={u.activo} onChange={(v) => cambiarEstado(u, v)}><span className="pequeno">{u.activo ? 'Activo' : 'Inactivo'}</span></Interruptor>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {creando && (
        <FormUsuario rolFijo="empleado" onCerrar={() => setCreando(false)}
          onCreado={(u) => { setCreando(false); avisar(`${u.nombre} ya puede iniciar sesión`); recargar(); }} />
      )}
      {editando && (
        <FormUsuario rolFijo="empleado" inicial={editando} onCerrar={() => setEditando(null)}
          onGuardado={(u) => { setEditando(null); avisar(`Cambios de ${u.nombre} guardados`); recargar(); }} />
      )}
      {toast}
    </div>
  );
}
