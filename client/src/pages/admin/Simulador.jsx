import { useEffect, useMemo, useState } from 'react';
import { Cargando, Error, Kpi, useDatos } from '../../components/ui.jsx';
import { Lineas, COLORES } from '../../components/Graficos.jsx';
import { dinero, numero } from '../../util.js';

function Deslizador({ id, etiqueta, valor, min, max, paso, onChange, formato, nota }) {
  return (
    <div className="campo">
      <label htmlFor={id} style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{etiqueta}</span><span>{formato(valor)}</span>
      </label>
      <input id={id} className="rango" type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(Number(e.target.value))} />
      {nota && <span className="ayuda">{nota}</span>}
    </div>
  );
}

export default function Simulador() {
  const { datos: m, error, recargar } = useDatos('/metricas/global?dias=28');
  const { datos: cfg } = useDatos('/config');
  const [p, setP] = useState(null);

  useEffect(() => {
    if (m && cfg && !p) {
      setP({
        poblacion: cfg.POBLACION_OBJETIVO,
        participacion: 10,
        usosSemana: Math.max(0.5, Math.round(m.adopcion.usosSemanalesPorParticipante * 10) / 10),
        semanas: 16,
        costoEnvase: 0.1,
      });
    }
  }, [m, cfg, p]);

  const r = useMemo(() => {
    if (!p || !m || !cfg) return null;
    const descuentoPromedio = m.periodo.envases ? m.periodo.descuentos / m.periodo.envases : 0;
    const calc = (participacion, usosSemana) => {
      const personas = Math.round((p.poblacion * participacion) / 100);
      const porSemana = personas * usosSemana;
      const envases = Math.round(porSemana * p.semanas);
      const gramos = envases * cfg.GRAMOS_POR_ENVASE;
      return { personas, porSemana, envases, kg: gramos / 1000, co2e: gramos * cfg.CO2E_KG_POR_GRAMO };
    };
    const esc = calc(p.participacion, p.usosSemana);
    const actual = calc(m.adopcion.tasa, m.adopcion.usosSemanalesPorParticipante);
    const ventasSemana = m.semana.ventasTotales;
    const curva = Array.from({ length: p.semanas }, (_, i) => ({
      semana: `S${i + 1}`,
      'Tu escenario': Math.round(((esc.porSemana * (i + 1)) * cfg.GRAMOS_POR_ENVASE) / 100) / 10,
      'Ritmo actual': Math.round(((actual.porSemana * (i + 1)) * cfg.GRAMOS_POR_ENVASE) / 100) / 10,
    }));
    const usosPorPersona = p.usosSemana * p.semanas;
    return {
      esc, actual, curva, descuentoPromedio, ventasSemana,
      descuentos: esc.envases * descuentoPromedio,
      ahorroDesechables: esc.envases * p.costoEnvase,
      usosPorPersona,
      excedeVentas: ventasSemana > 0 && esc.porSemana > ventasSemana * 1.0,
    };
  }, [p, m, cfg]);

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!r) return <Cargando texto="Preparando el simulador…" />;
  const set = (k) => (v) => setP({ ...p, [k]: v });

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Proyección de impacto</h1>
          <p className="medida">Estima la reducción potencial de envases desechables según cuánta gente participe. Los valores iniciales salen del uso real de las últimas 4 semanas.</p>
        </div>
      </div>

      <div className="rejilla rejilla-1-2">
        <div className="panel">
          <h3>Supuestos</h3>
          <Deslizador id="part" etiqueta="Participación" valor={p.participacion} min={1} max={60} paso={1} onChange={set('participacion')}
            formato={(v) => `${v} %`} nota={`Hoy participa el ${numero(m.adopcion.tasa, 2)} % de la población.`} />
          <Deslizador id="usos" etiqueta="Usos por persona a la semana" valor={p.usosSemana} min={0.5} max={5} paso={0.1} onChange={set('usosSemana')}
            formato={(v) => numero(v, 1)} nota={`Promedio actual: ${numero(m.adopcion.usosSemanalesPorParticipante, 1)}.`} />
          <div className="campo">
            <label htmlFor="pob">Población objetivo</label>
            <input id="pob" className="input" type="number" min="100" step="100" value={p.poblacion} onChange={(e) => set('poblacion')(Math.max(0, Number(e.target.value)))} />
          </div>
          <div className="campo">
            <label htmlFor="sem">Semanas del ciclo académico</label>
            <input id="sem" className="input" type="number" min="1" max="52" value={p.semanas} onChange={(e) => set('semanas')(Math.min(52, Math.max(1, Number(e.target.value))))} />
          </div>
          <div className="campo">
            <label htmlFor="costo">Costo de un envase desechable para la cafetería</label>
            <input id="costo" className="input" type="number" min="0" step="0.01" value={p.costoEnvase} onChange={(e) => set('costoEnvase')(Math.max(0, Number(e.target.value)))} />
            <span className="ayuda">Valor supuesto. Ajústalo con el precio real que pagan las cafeterías.</span>
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="pequeno texto-suave">Con {numero(r.esc.personas)} personas usando su tupper {numero(p.usosSemana, 1)} {p.usosSemana === 1 ? 'vez' : 'veces'} por semana, en un ciclo se evitarían</div>
            <div className="sim-salida" style={{ margin: '0.35rem 0 1rem' }}>{numero(r.esc.envases)} envases</div>
            <div className="tira" style={{ '--cols': 3, marginBottom: '0.75rem' }}>
              <Kpi valor={numero(r.esc.kg, 1)} unidad="kg" etiqueta="Poliestireno" nota={`${numero(r.esc.kg * 2, 0)} kg al año (2 ciclos)`} />
              <Kpi valor={numero(r.esc.co2e, 1)} unidad="kg" etiqueta="CO₂e evitado" />
              <Kpi valor={`×${numero(r.actual.envases ? r.esc.envases / r.actual.envases : 0, 1)}`} etiqueta="Frente al ritmo actual" nota={`${numero(r.actual.envases)} envases por ciclo hoy`} />
            </div>
            {r.excedeVentas && (
              <div className="aviso aviso-alerta">Este escenario supera las {numero(r.ventasSemana)} ventas semanales actuales de las tres cafeterías. Sería necesario que aumentaran las ventas para alcanzarlo.</div>
            )}
            <div className="panel-titulo"><h3>Poliestireno evitado acumulado</h3><span className="pequeno texto-suave">kg por semana del ciclo</span></div>
            <Lineas datos={r.curva} x="semana" series={[
              { clave: 'Tu escenario', nombre: 'Tu escenario', color: COLORES.hoja },
              { clave: 'Ritmo actual', nombre: 'Ritmo actual', color: COLORES.gris },
            ]} formatoY={(v) => `${v}`} alto={230} />
          </div>

          <div className="rejilla rejilla-2" style={{ marginTop: '1rem' }}>
            <div className="panel">
              <h3>Balance para las cafeterías</h3>
              <ul className="lista">
                <li><span>Descuentos otorgados</span><b>{dinero(r.descuentos)}</b></li>
                <li><span>Ahorro en desechables</span><b>{dinero(r.ahorroDesechables)}</b></li>
                <li><span>Diferencia</span><b className={r.ahorroDesechables - r.descuentos >= 0 ? 'sube' : 'baja'}>{dinero(r.ahorroDesechables - r.descuentos)}</b></li>
              </ul>
              <p className="pequeno texto-suave" style={{ marginBottom: 0 }}>
                Descuento promedio real por tupper: {dinero(r.descuentoPromedio)}. Para que el descuento se pague solo con el ahorro en envases, no debería superar {dinero(p.costoEnvase)} por tupper.
              </p>
            </div>
            <div className="panel">
              <h3>¿Cuándo vale la pena un tupper?</h3>
              <p className="pequeno">
                En este escenario, cada tupper se usa unas <b>{numero(r.usosPorPersona)} veces</b> por ciclo.
              </p>
              <div className="barra-progreso" aria-hidden="true"><span style={{ width: `${Math.min(100, (r.usosPorPersona / 37) * 100)}%` }} /></div>
              <p className="pequeno texto-suave" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
                {r.usosPorPersona >= 37
                  ? 'Supera los 37 usos con los que un reutilizable gana al desechable en impacto ambiental (Snyder y Park, 2024).'
                  : `Le faltan ${numero(37 - r.usosPorPersona)} usos para alcanzar los 37 con los que un reutilizable gana al desechable (Snyder y Park, 2024). Mantener el hábito por más de un ciclo es clave.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
