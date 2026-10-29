import { Barras, Lineas, COLORES } from './Graficos.jsx';
import { Kpi, Unidades, Variacion } from './ui.jsx';
import { diaCorto, dinero, fechaHora, numero } from '../util.js';

export function SelectorPeriodo({ dias, setDias }) {
  return (
    <label className="pequeno" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      Periodo
      <select className="input" style={{ width: 'auto', minHeight: 40 }} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
        <option value={7}>Últimos 7 días</option>
        <option value={30}>Últimos 30 días</option>
        <option value={56}>Últimas 8 semanas</option>
      </select>
    </label>
  );
}

export function TiraHoy({ m }) {
  return (
    <div className="tira" style={{ '--cols': 4 }}>
      <Kpi valor={numero(m.hoy.envases)} etiqueta="Tuppers hoy" nota={`${numero(m.hoy.clientesUnicos)} personas distintas`} />
      <Kpi valor={numero(m.hoy.pctConTupper, 1)} unidad="%" etiqueta="Ventas de hoy con tupper" nota={`${numero(m.hoy.ventasTotales)} ventas en total`} />
      <Kpi valor={numero(m.semana.envases)} etiqueta="Envases evitados en 7 días" nota={<><Variacion valor={m.variacionSemanal} /> frente a la semana anterior</>} />
      <Kpi valor={dinero(m.semana.descuentos)} etiqueta="Descuentos en 7 días" nota={`${numero(m.semana.kg, 1)} kg de poliestireno evitados`} />
    </div>
  );
}

export function GraficosTendencia({ m }) {
  const serie = m.serie.map((d) => ({ ...d, etiqueta: diaCorto(d.dia) }));
  return (
    <div className="rejilla rejilla-2">
      <div className="panel">
        <div className="panel-titulo"><h3>Ventas por día</h3><span className="pequeno texto-suave">Con tupper y con desechable</span></div>
        <Barras datos={serie} x="etiqueta" apilado series={[
          { clave: 'envases', nombre: 'Con tupper', color: COLORES.hoja },
          { clave: 'sinTupper', nombre: 'Con desechable', color: COLORES.gris },
        ]} />
      </div>
      <div className="panel">
        <div className="panel-titulo"><h3>Proporción de ventas con tupper</h3><span className="pequeno texto-suave">% diario</span></div>
        <Lineas datos={serie.filter((d) => d.pct != null)} x="etiqueta" formatoY={(v) => `${v}%`} dominioY={[0, 'auto']}
          series={[{ clave: 'pct', nombre: '% con tupper', color: COLORES.tapa }]} />
      </div>
    </div>
  );
}

export function GraficosHabitos({ m, umbral = 37 }) {
  return (
    <div className="rejilla rejilla-2" style={{ marginTop: '1rem' }}>
      <div className="panel">
        <div className="panel-titulo"><h3>Horas con más tuppers</h3><span className="pequeno texto-suave">Periodo seleccionado</span></div>
        <Barras datos={m.porHora} x="hora" series={[{ clave: 'envases', nombre: 'Tuppers', color: COLORES.tapa }]} alto={220} />
      </div>
      <div className="panel">
        <div className="panel-titulo"><h3>Participantes según usos acumulados</h3></div>
        <Barras datos={m.distribucionUsos} x="rango" series={[{ clave: 'participantes', nombre: 'Participantes', color: COLORES.hoja }]} alto={220} />
        <p className="pequeno texto-suave" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          {m.clientes.superanUmbralAmbiental} {m.clientes.superanUmbralAmbiental === 1 ? 'persona ya supera' : 'personas ya superan'} los {umbral} usos con los que un reutilizable
          supera al desechable en impacto ambiental (Snyder y Park, 2024). Promedio: {numero(m.clientes.promedioUsos, 1)} usos por participante.
        </p>
      </div>
    </div>
  );
}

export function ImpactoPeriodo({ m }) {
  return (
    <div className="panel">
      <div className="panel-titulo"><h3>Impacto ambiental del periodo</h3></div>
      <Unidades total={m.periodo.envases} porIcono={10} max={120} />
      <div className="tira" style={{ '--cols': 3, marginTop: '1rem', marginBottom: 0 }}>
        <Kpi valor={numero(m.periodo.kg, 2)} unidad="kg" etiqueta="Poliestireno evitado" />
        <Kpi valor={numero(m.periodo.co2eKg, 1)} unidad="kg" etiqueta="CO₂e evitado" />
        <Kpi valor={numero(m.clientes.activosPeriodo)} etiqueta="Participantes activos" nota={`${numero(m.clientes.recurrentesPeriodo)} con 3 usos o más`} />
      </div>
    </div>
  );
}

export function Recientes({ m }) {
  return (
    <div className="panel">
      <div className="panel-titulo"><h3>Últimos registros</h3><span className="pequeno texto-suave">Carnés anonimizados</span></div>
      <ul className="lista">
        {m.recientes.slice(0, 7).map((r) => (
          <li key={r.id}>
            <div>
              <div className="principal">{r.cliente}</div>
              <div className="secundario">{fechaHora(r.fecha)}{r.cafeteria && m.porCafeteria.length > 1 ? `, ${r.cafeteria}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {r.descuento > 0 ? <span className="chip chip-hoja">−{dinero(r.descuento)}</span> : <span className="chip">Sin descuento</span>}
              <div className="secundario">uso n.º {r.numeroReutilizacion}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
