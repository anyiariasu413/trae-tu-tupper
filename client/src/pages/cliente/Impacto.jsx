import { Cargando, Envase, Error, Kpi, useDatos } from '../../components/ui.jsx';
import { DATOS, dinero, numero } from '../../util.js';

const HITOS = [
  { usos: 1, titulo: 'Primer tupper', texto: 'Empezaste el hábito.' },
  { usos: 10, titulo: '10 usos', texto: 'Ya es costumbre.' },
  { usos: 27, titulo: '27 usos', texto: 'Tu tupper compensó su huella de carbono.', fuente: 'Huang et al., 2026' },
  { usos: 37, titulo: '37 usos', texto: 'Tu tupper supera al desechable en impacto ambiental.', fuente: 'Snyder y Park, 2024' },
  { usos: 75, titulo: '75 usos', texto: 'El doble del umbral ambiental.' },
  { usos: 150, titulo: '150 usos', texto: 'Referente de tu comunidad.' },
];

export default function Impacto() {
  const { datos: m, error, recargar } = useDatos('/metricas/yo');
  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!m) return <Cargando />;

  const meta = m.umbrales.ambiental;
  const avance = Math.min(100, (m.usos / meta) * 100);
  const siguiente = HITOS.find((h) => h.usos > m.usos);

  return (
    <div className="contenido-angosto" style={{ maxWidth: 760 }}>
      <div className="encabezado">
        <div><h1>Mi impacto</h1><p>Lo que tu tupper ha evitado desde que te uniste.</p></div>
      </div>

      <div className="tira" style={{ '--cols': 4 }}>
        <Kpi valor={numero(m.usos)} etiqueta="Envases evitados" nota={`${numero(m.usosMes)} este mes`} />
        <Kpi valor={numero(m.gramos)} unidad="g" etiqueta="Poliestireno evitado" />
        <Kpi valor={numero(m.co2eKg, 2)} unidad="kg" etiqueta="CO₂e evitado" />
        <Kpi valor={dinero(m.ahorro)} etiqueta="Ahorrado en descuentos" />
      </div>

      <div className="panel">
        <div className="panel-titulo">
          <h3>Camino a los {meta} usos</h3>
          <span className="pequeno texto-suave">{m.usos >= meta ? 'Meta superada' : `Te faltan ${meta - m.usos}`}</span>
        </div>
        <div className="barra-progreso" role="progressbar" aria-valuemin={0} aria-valuemax={meta} aria-valuenow={Math.min(m.usos, meta)} aria-label="Avance hacia los 37 usos">
          <span style={{ width: `${avance}%` }} />
        </div>
        <p className="pequeno texto-suave" style={{ marginTop: '0.6rem' }}>
          Un recipiente reutilizable necesita alrededor de {meta} usos para superar al desechable en varias categorías de impacto ambiental (Snyder y Park, 2024).
          Por eso importa la constancia, no solo el primer uso.
        </p>
        {m.usos > 0 && (
          <div className="unidades" aria-hidden="true" style={{ marginTop: '0.5rem' }}>
            {Array.from({ length: Math.min(m.usos, 120) }, (_, i) => <Envase key={i} />)}
            {Array.from({ length: Math.max(0, meta - m.usos) }, (_, i) => <Envase key={`p${i}`} evitado={false} />)}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Logros</h3>
        <div className="hitos">
          {HITOS.map((h) => (
            <div key={h.usos} className={`hito ${m.usos >= h.usos ? 'logrado' : ''}`}>
              <b>{h.titulo}</b>
              <span className="pequeno">{h.texto}</span>
              {h.fuente && <div className="pequeno" style={{ opacity: 0.8 }}>{h.fuente}</div>}
            </div>
          ))}
        </div>
        {siguiente && <p className="pequeno texto-suave" style={{ marginTop: '0.75rem', marginBottom: 0 }}>Próximo logro: {siguiente.titulo.toLowerCase()}.</p>}
      </div>

      {m.usos > 0 && (
        <div className="rejilla rejilla-2" style={{ marginTop: '1rem' }}>
          <div className="panel" style={{ marginTop: 0 }}>
            <h3>Tu constancia</h3>
            <ul className="lista">
              <li><span>Semanas seguidas usando tu tupper</span><b>{m.rachaSemanas}</b></li>
              <li><span>Cafetería donde más lo usas</span><b>{m.cafeteriaFavorita}</b></li>
              <li><span>Participantes con menos usos que tú</span><b>{m.percentil} %</b></li>
            </ul>
          </div>
          <div className="panel" style={{ marginTop: 0 }}>
            <h3>¿Sabías que…?</h3>
            {DATOS.slice(3, 5).map((d) => (
              <blockquote key={d.texto} className="dato" style={{ margin: '0 0 0.75rem' }}>
                <p className="pequeno">{d.texto}</p><cite>{d.fuente}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
