import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cargando, Error, useDatos } from '../../components/ui.jsx';
import { GraficosHabitos, GraficosTendencia, ImpactoPeriodo, Recientes, SelectorPeriodo, TiraHoy } from '../../components/Metricas.jsx';
import { describirRegla } from '../../util.js';

export default function PanelDuena() {
  const [dias, setDias] = useState(30);
  const { datos: m, error, recargar } = useDatos(`/metricas/cafeteria?dias=${dias}`, { cada: 20000 });

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!m) return <Cargando texto="Calculando métricas…" />;
  const caf = m.cafeteria;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>{caf.nombre}</h1>
          <p>
            {caf.regla.activo ? describirRegla(caf.regla) : 'Descuento pausado'}.{' '}
            <Link to="/duena/reglas">Cambiar descuento</Link>
          </p>
        </div>
        <SelectorPeriodo dias={dias} setDias={setDias} />
      </div>
      {!caf.activa && <div className="aviso aviso-alerta">La administración desactivó temporalmente esta cafetería.</div>}
      <TiraHoy m={m} />
      <GraficosTendencia m={m} />
      <div className="rejilla rejilla-3-1" style={{ marginTop: '1rem' }}>
        <ImpactoPeriodo m={m} />
        <Recientes m={m} />
      </div>
      <GraficosHabitos m={m} />
      <p className="pequeno texto-suave" style={{ marginTop: '1rem' }}>Los datos se actualizan cada 20 segundos.</p>
    </>
  );
}
