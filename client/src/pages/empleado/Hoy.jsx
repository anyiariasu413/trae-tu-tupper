import { useState } from 'react';
import { api } from '../../api.js';
import { Cargando, Error, Kpi, useDatos, useToast } from '../../components/ui.jsx';
import { dinero, hora, numero } from '../../util.js';

export default function Hoy() {
  const { datos, error, recargar } = useDatos('/registros/hoy', { cada: 15000 });
  const [confirmando, setConfirmando] = useState(null);
  const [toast, avisar] = useToast();

  const anular = async (id) => {
    try {
      await api(`/registros/${id}`, { metodo: 'DELETE' });
      avisar('Registro anulado');
      setConfirmando(null);
      recargar();
    } catch (e) {
      avisar(e.message);
    }
  };

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!datos) return <Cargando />;
  const total = datos.resumen.envases + datos.sinTupper;

  return (
    <div className="contenido-angosto">
      <div className="encabezado"><div><h1>Registros de hoy</h1><p>Se actualiza cada 15 segundos.</p></div></div>
      <div className="tira" style={{ '--cols': 3 }}>
        <Kpi valor={datos.resumen.envases} etiqueta="Tuppers" />
        <Kpi valor={dinero(datos.resumen.descuentos)} etiqueta="Descuentos" />
        <Kpi valor={total ? `${numero((datos.resumen.envases / total) * 100)} %` : '—'} etiqueta="Ventas con tupper" />
      </div>
      <div className="panel">
        {datos.registros.length === 0 ? (
          <div className="vacio">Todavía no hay tuppers registrados hoy. El primero aparecerá aquí.</div>
        ) : (
          <ul className="lista">
            {datos.registros.map((r) => (
              <li key={r.id}>
                <div>
                  <div className="principal">{r.clienteNombre}</div>
                  <div className="secundario">
                    {hora(r.fecha)}, {r.clienteCarnet}
                    {r.monto != null && `, compra ${dinero(r.monto)}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {r.descuento > 0 ? <span className="chip chip-hoja">−{dinero(r.descuento)}</span> : <span className="chip">Sin descuento</span>}
                  <div>
                    {confirmando === r.id ? (
                      <>
                        <button className="btn btn-texto" style={{ color: 'var(--rojo)' }} onClick={() => anular(r.id)}>Sí, anular</button>
                        <button className="btn btn-texto" onClick={() => setConfirmando(null)}>No</button>
                      </>
                    ) : (
                      <button className="btn btn-texto pequeno" onClick={() => setConfirmando(r.id)}>Anular</button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {toast}
    </div>
  );
}
