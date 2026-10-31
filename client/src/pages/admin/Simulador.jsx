import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cargando, Error, Kpi, useDatos } from '../../components/ui.jsx';
import { Lineas, COLORES } from '../../components/Graficos.jsx';
import { dinero, numero } from '../../util.js';

/** Supuestos que la persona debe llenar antes de ver la proyección */
const SUPUESTOS = [
  {
    clave: 'participacion', etiqueta: 'Participación', unidad: '% de la población', min: 0.1, max: 100, paso: 0.1,
    pregunta: '¿Qué porcentaje de la población usaría su tupper?',
    ejemploFuente: 'Encuesta del equipo a estudiantes (2026), escenario conservador',
  },
  {
    clave: 'usosSemana', etiqueta: 'Usos por persona a la semana', unidad: 'veces', min: 0.1, max: 14, paso: 0.1,
    pregunta: '¿Cuántas veces por semana compraría con tupper cada participante?',
    ejemploFuente: 'Promedio observado en la plataforma',
  },
  {
    clave: 'semanas', etiqueta: 'Semanas del ciclo', unidad: 'semanas', min: 1, max: 52, paso: 1,
    pregunta: '¿Cuántas semanas de clases tiene el ciclo?',
    ejemploFuente: 'Calendario académico UDB',
  },
  {
    clave: 'costoEnvase', etiqueta: 'Costo de un envase desechable', unidad: 'USD por envase', min: 0.001, max: 5, paso: 0.01,
    pregunta: '¿Cuánto paga un chalet por cada envase de poliestireno?',
    ejemploFuente: 'Entrevista a la dueña de un chalet',
  },
];

const VACIO = Object.fromEntries(SUPUESTOS.flatMap((s) => [[s.clave, ''], [`fuente_${s.clave}`, '']]));

const FUENTES_BIBLIOGRAFICAS = [
  'Snyder y Park (2024): un recipiente reutilizable necesita alrededor de 37 usos para superar al desechable en impacto ambiental.',
];

export default function Simulador() {
  const { datos: m, error, recargar } = useDatos('/metricas/global?dias=28');
  const { datos: cfg } = useDatos('/config');
  const [f, setF] = useState(VACIO);
  const [p, setP] = useState(null); // supuestos confirmados
  const [intento, setIntento] = useState(false);

  const referencias = m && {
    participacion: { valor: Math.round(m.adopcion.tasa * 100) / 100, texto: `Participación registrada en la plataforma: ${numero(m.adopcion.tasa, 2)} %.` },
    usosSemana: { valor: Math.round(m.adopcion.usosSemanalesPorParticipante * 10) / 10, texto: `Promedio en la plataforma, últimas 4 semanas: ${numero(m.adopcion.usosSemanalesPorParticipante, 1)}.` },
    semanas: null,
    costoEnvase: null,
  };

  const errores = Object.fromEntries(SUPUESTOS.map((s) => {
    const v = Number(f[s.clave]);
    if (f[s.clave] === '' || !Number.isFinite(v)) return [s.clave, 'Escribe un valor.'];
    if (v < s.min || v > s.max) return [s.clave, `Debe estar entre ${s.min} y ${s.max}.`];
    if (f[`fuente_${s.clave}`].trim().length < 3) return [s.clave, 'Indica la fuente o justificación de este valor.'];
    return [s.clave, null];
  }));
  const completo = Object.values(errores).every((e) => !e);

  const r = useMemo(() => {
    if (!p || !m || !cfg) return null;
    const descuentoPromedio = m.periodo.envases ? m.periodo.descuentos / m.periodo.envases : 0;
    const calc = (participacion, usosSemana) => {
      const personas = Math.round((cfg.POBLACION_OBJETIVO * participacion) / 100);
      const porSemana = personas * usosSemana;
      const envases = Math.round(porSemana * p.semanas);
      const gramos = envases * cfg.GRAMOS_POR_ENVASE;
      return { personas, porSemana, envases, kg: gramos / 1000, co2e: gramos * cfg.CO2E_KG_POR_GRAMO };
    };
    const esc = calc(p.participacion, p.usosSemana);
    const actual = calc(m.adopcion.tasa, m.adopcion.usosSemanalesPorParticipante);
    const curva = Array.from({ length: p.semanas }, (_, i) => ({
      semana: `S${i + 1}`,
      'Tu escenario': Math.round(((esc.porSemana * (i + 1)) * cfg.GRAMOS_POR_ENVASE) / 100) / 10,
      'Ritmo actual': Math.round(((actual.porSemana * (i + 1)) * cfg.GRAMOS_POR_ENVASE) / 100) / 10,
    }));
    return {
      esc, actual, curva, descuentoPromedio,
      ventasSemana: m.semana.ventasTotales,
      descuentos: esc.envases * descuentoPromedio,
      ahorroDesechables: esc.envases * p.costoEnvase,
      usosPorPersona: p.usosSemana * p.semanas,
    };
  }, [p, m, cfg]);

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!m || !cfg) return <Cargando texto="Preparando el simulador…" />;

  const calcular = (e) => {
    e.preventDefault();
    setIntento(true);
    if (!completo) return;
    setP({
      ...Object.fromEntries(SUPUESTOS.map((s) => [s.clave, Number(f[s.clave])])),
      fuentes: Object.fromEntries(SUPUESTOS.map((s) => [s.clave, f[`fuente_${s.clave}`].trim()])),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fijos = [
    { etiqueta: 'Peso de un envase de poliestireno', valor: `${numero(cfg.GRAMOS_POR_ENVASE, 1)} g`, fuente: cfg.FUENTES?.GRAMOS_POR_ENVASE },
    { etiqueta: 'Factor de emisión del poliestireno', valor: `${numero(cfg.CO2E_KG_POR_GRAMO, 4)} kg CO₂e por gramo`, fuente: cfg.FUENTES?.CO2E_KG_POR_GRAMO },
    { etiqueta: 'Población del campus', valor: `${numero(cfg.POBLACION_OBJETIVO)} personas`, fuente: cfg.FUENTES?.POBLACION_OBJETIVO },
  ];

  // ---------- Paso 1: llenar los supuestos ----------
  if (!p) {
    return (
      <div className="contenido-angosto" style={{ maxWidth: 760 }}>
        <div className="encabezado">
          <div>
            <h1>Proyección de impacto</h1>
            <p className="medida">Estima cuántos envases desechables se evitarían en un ciclo según cuánta gente participe. Para que la proyección sea defendible, cada supuesto necesita un valor y su fuente.</p>
          </div>
        </div>

        <form className="panel" onSubmit={calcular} noValidate>
          <h2>1. Define los supuestos</h2>
          {SUPUESTOS.map((s) => {
            const ref = referencias[s.clave];
            const err = intento && errores[s.clave];
            return (
              <fieldset key={s.clave} className="supuesto">
                <legend>{s.pregunta}</legend>
                <div className="supuesto-fila">
                  <div className="campo">
                    <label htmlFor={s.clave}>{s.etiqueta} <span className="texto-suave" style={{ fontWeight: 400 }}>({s.unidad})</span></label>
                    <input id={s.clave} className="input" type="number" inputMode="decimal" min={s.min} max={s.max} step={s.paso}
                      value={f[s.clave]} onChange={(e) => setF({ ...f, [s.clave]: e.target.value })} aria-invalid={Boolean(err)} />
                  </div>
                  <div className="campo">
                    <label htmlFor={`fuente_${s.clave}`}>Fuente o justificación</label>
                    <input id={`fuente_${s.clave}`} className="input" placeholder={`Ej.: ${s.ejemploFuente}`}
                      value={f[`fuente_${s.clave}`]} onChange={(e) => setF({ ...f, [`fuente_${s.clave}`]: e.target.value })} aria-invalid={Boolean(err)} />
                  </div>
                </div>
                {ref && (
                  <p className="supuesto-ref">
                    {ref.texto}{' '}
                    <button type="button" className="btn btn-texto" onClick={() => setF({ ...f, [s.clave]: String(ref.valor), [`fuente_${s.clave}`]: 'Datos registrados en la plataforma Trae tu Tupper' })}>
                      Usar este valor
                    </button>
                  </p>
                )}
                {err && <p className="supuesto-error" role="alert">{err}</p>}
              </fieldset>
            );
          })}

          <h2 style={{ marginTop: '1.5rem' }}>2. Revisa los parámetros fijos</h2>
          <p className="pequeno texto-suave">Vienen de la configuración del sistema. Puedes cambiarlos, junto con su fuente, en <Link to="/admin/parametros">Parámetros</Link>.</p>
          <ul className="lista">
            {fijos.map((x) => (
              <li key={x.etiqueta} style={{ alignItems: 'flex-start' }}>
                <div><div className="principal">{x.etiqueta}</div><div className="secundario">Fuente: {x.fuente}</div></div>
                <b style={{ whiteSpace: 'nowrap' }}>{x.valor}</b>
              </li>
            ))}
          </ul>

          {intento && !completo && <div className="aviso aviso-error" role="alert" style={{ marginTop: '1rem' }}>Completa todos los supuestos con su valor y su fuente para ver la proyección.</div>}
          <div className="acciones">
            <button className="btn btn-grande" style={{ width: 'auto', minHeight: 52 }}>Calcular proyección</button>
          </div>
        </form>
      </div>
    );
  }

  // ---------- Paso 2: resultados ----------
  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Proyección de impacto</h1>
          <p className="medida">Escenario calculado con los supuestos que definiste. Es una estimación lineal: no modela el crecimiento gradual de la participación ni el abandono del hábito.</p>
        </div>
        <button className="btn btn-secundario" onClick={() => setP(null)}>Editar supuestos</button>
      </div>

      <div className="rejilla rejilla-3-1">
        <div>
          <div className="panel">
            <div className="pequeno texto-suave">Con {numero(r.esc.personas)} personas usando su tupper {numero(p.usosSemana, 1)} {p.usosSemana === 1 ? 'vez' : 'veces'} por semana, en {p.semanas} semanas se evitarían</div>
            <div className="sim-salida" style={{ margin: '0.35rem 0 1rem' }}>{numero(r.esc.envases)} envases</div>
            <div className="tira" style={{ '--cols': 3, marginBottom: '0.75rem' }}>
              <Kpi valor={numero(r.esc.kg, 1)} unidad="kg" etiqueta="Poliestireno" />
              <Kpi valor={numero(r.esc.co2e, 1)} unidad="kg" etiqueta="CO₂e evitado" />
              <Kpi valor={`×${numero(r.actual.envases ? r.esc.envases / r.actual.envases : 0, 1)}`} etiqueta="Frente al ritmo de la plataforma" nota={`${numero(r.actual.envases)} envases en el mismo periodo`} />
            </div>
            {r.ventasSemana > 0 && r.esc.porSemana > r.ventasSemana && (
              <div className="aviso aviso-alerta">Este escenario supera las {numero(r.ventasSemana)} ventas semanales registradas en las tres cafeterías. Sería necesario que aumentaran las ventas para alcanzarlo.</div>
            )}
            <div className="panel-titulo"><h3>Poliestireno evitado acumulado</h3><span className="pequeno texto-suave">kg por semana</span></div>
            <Lineas datos={r.curva} x="semana" series={[
              { clave: 'Tu escenario', nombre: 'Tu escenario', color: COLORES.hoja },
              { clave: 'Ritmo actual', nombre: 'Ritmo de la plataforma', color: COLORES.gris },
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
                Descuento promedio registrado por tupper: {dinero(r.descuentoPromedio)}. Para que el descuento se pague solo con el ahorro en envases, no debería superar {dinero(p.costoEnvase)}.
              </p>
            </div>
            <div className="panel">
              <h3>¿Cuándo vale la pena un tupper?</h3>
              <p className="pequeno">En este escenario, cada tupper se usa unas <b>{numero(r.usosPorPersona)} veces</b> en el periodo.</p>
              <div className="barra-progreso" aria-hidden="true"><span style={{ width: `${Math.min(100, (r.usosPorPersona / 37) * 100)}%` }} /></div>
              <p className="pequeno texto-suave" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
                {r.usosPorPersona >= 37
                  ? 'Supera los 37 usos con los que un reutilizable gana al desechable en impacto ambiental (Snyder y Park, 2024).'
                  : `Le faltan ${numero(37 - r.usosPorPersona)} usos para llegar a los 37 con los que un reutilizable gana al desechable (Snyder y Park, 2024).`}
              </p>
            </div>
          </div>
        </div>

        <aside className="panel fuentes">
          <h3>Supuestos y fuentes</h3>
          <dl>
            {SUPUESTOS.map((s) => (
              <div key={s.clave}>
                <dt>{s.etiqueta}: <b>{s.clave === 'costoEnvase' ? dinero(p[s.clave]) : `${numero(p[s.clave], s.paso < 1 ? 1 : 0)}${s.clave === 'participacion' ? ' %' : ''}`}</b></dt>
                <dd>{p.fuentes[s.clave]}</dd>
              </div>
            ))}
            {fijos.map((x) => (
              <div key={x.etiqueta}>
                <dt>{x.etiqueta}: <b>{x.valor}</b></dt>
                <dd>{x.fuente}</dd>
              </div>
            ))}
          </dl>
          <h4>Bibliografía</h4>
          <ul>
            {FUENTES_BIBLIOGRAFICAS.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <h4>Cómo se calcula</h4>
          <p>Personas = población × participación. Envases evitados = personas × usos por semana × semanas. Poliestireno = envases × peso por envase. CO₂e = poliestireno × factor de emisión. Supone que cada uso de tupper reemplaza un envase desechable y no descuenta la huella del propio tupper (fabricación y lavado).</p>
        </aside>
      </div>
    </>
  );
}
