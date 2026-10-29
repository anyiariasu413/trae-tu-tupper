import { useEffect, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { Interruptor, useToast } from '../../components/ui.jsx';
import { describirRegla, dinero, fechaHora, previsualizar } from '../../util.js';

export default function Reglas() {
  const { cafeteria, refrescar } = useAuth();
  const [f, setF] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [toast, avisar] = useToast();

  useEffect(() => { refrescar().catch(() => {}); }, [refrescar]);
  useEffect(() => {
    if (cafeteria && !f) setF({ ...cafeteria.regla, valor: String(cafeteria.regla.valor), montoMinimo: String(cafeteria.regla.montoMinimo), topeDiario: String(cafeteria.regla.topeDiario) });
  }, [cafeteria, f]);

  if (!f) return null;
  const regla = { ...f, valor: Number(f.valor), montoMinimo: Number(f.montoMinimo || 0), topeDiario: Number(f.topeDiario || 0) };
  const cambio = JSON.stringify([regla.tipo, regla.valor, regla.montoMinimo, regla.topeDiario, regla.activo]) !==
    JSON.stringify([cafeteria.regla.tipo, cafeteria.regla.valor, cafeteria.regla.montoMinimo, cafeteria.regla.topeDiario, cafeteria.regla.activo]);

  const guardar = async (datos = regla) => {
    setError(null);
    setGuardando(true);
    try {
      await api(`/cafeterias/${cafeteria.id}/regla`, { metodo: 'PUT', cuerpo: datos });
      await refrescar();
      avisar('Descuento actualizado');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const pausar = async (activo) => {
    setF({ ...f, activo });
    await guardar({ ...cafeteria.regla, activo });
  };

  const ejemplos = [2.5, 3.5, 5].map((m) => ({ m, r: previsualizar({ ...regla, activo: true }, m, 0) }));

  return (
    <div className="contenido-angosto">
      <div className="encabezado">
        <div>
          <h1>Regla de descuento</h1>
          <p>Define el beneficio para quien traiga su tupper a {cafeteria.nombre}.</p>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>{cafeteria.regla.activo ? 'Descuento activo' : 'Descuento pausado'}</h3>
          <p className="pequeno texto-suave" style={{ margin: 0 }}>
            {cafeteria.regla.activo ? describirRegla(cafeteria.regla) : 'Los tuppers se siguen contando como envases evitados.'}
          </p>
        </div>
        <Interruptor checked={cafeteria.regla.activo} onChange={pausar} disabled={guardando}>
          <span className="sr">Descuento activo</span>
        </Interruptor>
      </div>

      <form className="panel" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        {error && <div className="aviso aviso-error" role="alert">{error}</div>}
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 1rem' }}>
          <legend className="etiqueta" style={{ marginBottom: '0.5rem' }}>Tipo de descuento</legend>
          <div className="pestanas" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '0.4rem' }}>
            <button type="button" aria-selected={f.tipo === 'porcentaje'} onClick={() => setF({ ...f, tipo: 'porcentaje', valor: '10' })}>Porcentaje</button>
            <button type="button" aria-selected={f.tipo === 'fijo'} onClick={() => setF({ ...f, tipo: 'fijo', valor: '0.25' })}>Monto fijo</button>
            <button type="button" disabled aria-selected={false} title="Disponible en una próxima versión">Puntos</button>
          </div>
          <span className="pequeno texto-suave">El sistema de puntos canjeables llegará en una próxima versión.</span>
        </fieldset>

        <div className="campo">
          <label htmlFor="valor">{f.tipo === 'porcentaje' ? 'Porcentaje de descuento' : 'Descuento en dólares'}</label>
          <input id="valor" className="input" type="number" inputMode="decimal" min="0" step={f.tipo === 'porcentaje' ? 1 : 0.05}
            value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          <span className="ayuda">{f.tipo === 'porcentaje' ? 'Entre 1 % y 50 %.' : 'Hasta $5.00 por compra.'}</span>
        </div>
        <div className="campo">
          <label htmlFor="min">Compra mínima para aplicar el descuento</label>
          <input id="min" className="input" type="number" inputMode="decimal" min="0" step="0.25" value={f.montoMinimo} onChange={(e) => setF({ ...f, montoMinimo: e.target.value })} />
          <span className="ayuda">Escribe 0 si no hay mínimo. Con mínimo o porcentaje, el empleado ingresa el total de cada compra.</span>
        </div>
        <div className="campo">
          <label htmlFor="tope">Descuentos por cliente al día</label>
          <input id="tope" className="input" type="number" inputMode="numeric" min="0" max="10" step="1" value={f.topeDiario} onChange={(e) => setF({ ...f, topeDiario: e.target.value })} />
          <span className="ayuda">Escribe 0 para no limitar. Después del tope, el tupper se registra sin descuento.</span>
        </div>

        <div className="aviso aviso-info">
          <b>Así queda:</b> {describirRegla({ ...regla, activo: true }) || '—'}.
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
            {ejemplos.map(({ m, r }) => (
              <li key={m}>Compra de {dinero(m)}: {r && r.descuento > 0 ? `descuento de ${dinero(r.descuento)}, paga ${dinero(r.total)}` : 'sin descuento'}</li>
            ))}
          </ul>
        </div>

        <div className="acciones">
          <button className="btn" disabled={!cambio || guardando}>{guardando ? 'Guardando…' : 'Guardar regla'}</button>
        </div>
        <p className="pequeno texto-suave" style={{ marginBottom: 0 }}>Última actualización: {fechaHora(cafeteria.regla.actualizadoEn)}.</p>
      </form>
      {toast}
    </div>
  );
}
