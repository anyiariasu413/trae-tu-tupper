import { Cargando, Error, useDatos } from '../../components/ui.jsx';
import { dinero, fechaHora } from '../../util.js';

export default function Historial() {
  const { datos: m, error, recargar } = useDatos('/metricas/yo');
  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!m) return <Cargando />;

  return (
    <div className="contenido-angosto">
      <div className="encabezado"><div><h1>Historial</h1><p>Cada vez que usaste tu tupper en un chalet.</p></div></div>
      <div className="panel">
        {m.historial.length === 0 ? (
          <div className="vacio">Tu historial está vacío. Tu primer tupper aparecerá aquí en cuanto lo registren en la caja.</div>
        ) : (
          <ul className="lista">
            {m.historial.map((r) => (
              <li key={r.id}>
                <div>
                  <div className="principal">{r.cafeteria}</div>
                  <div className="secundario">{fechaHora(r.fecha)}, uso n.º {r.numeroReutilizacion}</div>
                  {r.motivoSinDescuento && <div className="secundario">{r.motivoSinDescuento}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {r.descuento > 0 ? <span className="chip chip-hoja">−{dinero(r.descuento)}</span> : <span className="chip">Sin descuento</span>}
                  {r.monto != null && <div className="secundario">Compra {dinero(r.monto)}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
