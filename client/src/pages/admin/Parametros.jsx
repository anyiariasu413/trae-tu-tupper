import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Cargando, Error, Kpi, useDatos, useToast } from '../../components/ui.jsx';
import { fechaHora, numero } from '../../util.js';

const CAMPOS = [
  {
    clave: 'GRAMOS_POR_ENVASE', etiqueta: 'Peso de un envase de poliestireno', unidad: 'g', paso: 0.1,
    ayuda: 'Peso promedio de un envase desechable de espuma. Se usa para calcular los gramos y kilos evitados.',
  },
  {
    clave: 'CO2E_KG_POR_GRAMO', etiqueta: 'Factor de emisión del poliestireno', unidad: 'kg CO₂e por gramo', paso: 0.0001,
    ayuda: 'Huella de carbono de producir y desechar un gramo de poliestireno. Se usa para calcular el CO₂e evitado.',
  },
  {
    clave: 'POBLACION_OBJETIVO', etiqueta: 'Población del campus', unidad: 'personas', paso: 100,
    ayuda: 'Base para la tasa de adopción y para el simulador de proyección.',
  },
];

export default function Parametros() {
  const { datos: cfg, error, recargar } = useDatos('/config');
  const [f, setF] = useState(null);
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [toast, avisar] = useToast();

  useEffect(() => {
    if (cfg) setF(Object.fromEntries(CAMPOS.flatMap((c) => [[c.clave, String(cfg[c.clave])], [`fuente_${c.clave}`, cfg.FUENTES?.[c.clave] || '']])));
  }, [cfg]);

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!cfg || !f) return <Cargando />;

  const vista = {
    gramos: Number(f.GRAMOS_POR_ENVASE) || 0,
    factor: Number(f.CO2E_KG_POR_GRAMO) || 0,
  };
  const co2ePorEnvase = vista.gramos * vista.factor;
  const cambio = CAMPOS.some((c) => Number(f[c.clave]) !== cfg[c.clave] || f[`fuente_${c.clave}`] !== (cfg.FUENTES?.[c.clave] || ''));
  const enDefecto = CAMPOS.every((c) => cfg[c.clave] === cfg.DEFECTO[c.clave]);

  const guardar = async (cuerpo) => {
    setErrorForm(null);
    setGuardando(true);
    try {
      await api('/config', { metodo: 'PUT', cuerpo });
      await recargar();
      avisar(cuerpo.restablecer ? 'Valores por defecto restablecidos' : 'Parámetros guardados');
    } catch (e) {
      setErrorForm(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="contenido-angosto" style={{ maxWidth: 720 }}>
      <div className="encabezado">
        <div>
          <h1>Parámetros de impacto</h1>
          <p className="medida">Valores con los que el sistema calcula el poliestireno y el CO₂e evitados. Al cambiarlos se recalculan todas las métricas, incluido el historial.</p>
        </div>
      </div>

      <form className="panel" onSubmit={(e) => { e.preventDefault(); guardar({ ...Object.fromEntries(CAMPOS.map((c) => [c.clave, Number(f[c.clave])])), fuentes: Object.fromEntries(CAMPOS.map((c) => [c.clave, f[`fuente_${c.clave}`]])) }); }}>
        {errorForm && <div className="aviso aviso-error" role="alert">{errorForm}</div>}
        {CAMPOS.map((c) => (
          <div className="campo" key={c.clave}>
            <label htmlFor={c.clave}>{c.etiqueta} <span className="texto-suave" style={{ fontWeight: 400 }}>({c.unidad})</span></label>
            <input id={c.clave} className="input" type="number" inputMode="decimal" step={c.paso} min="0"
              value={f[c.clave]} onChange={(e) => setF({ ...f, [c.clave]: e.target.value })} />
            <span className="ayuda">{c.ayuda} Valor por defecto: {numero(cfg.DEFECTO[c.clave], c.paso < 1 ? (c.paso < 0.01 ? 4 : 1) : 0)}.</span>
            <label htmlFor={`fuente_${c.clave}`} className="pequeno" style={{ marginTop: '0.35rem' }}>Fuente</label>
            <input id={`fuente_${c.clave}`} className="input" value={f[`fuente_${c.clave}`]} placeholder="Autor (año), documento o medición propia"
              onChange={(e) => setF({ ...f, [`fuente_${c.clave}`]: e.target.value })} />
          </div>
        ))}

        <div className="tira" style={{ '--cols': 3 }}>
          <Kpi valor={numero(vista.gramos, 1)} unidad="g" etiqueta="Poliestireno por tupper" />
          <Kpi valor={numero(co2ePorEnvase * 1000, 1)} unidad="g" etiqueta="CO₂e por tupper" />
          <Kpi valor={numero(co2ePorEnvase * 1000, 0)} unidad="kg" etiqueta="CO₂e por cada 1,000 tuppers" />
        </div>

        <div className="acciones" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-texto" disabled={guardando || enDefecto} onClick={() => guardar({ restablecer: true })}>
            Restablecer valores por defecto
          </button>
          <button className="btn" disabled={!cambio || guardando}>{guardando ? 'Guardando…' : 'Guardar parámetros'}</button>
        </div>
        {cfg.actualizadoEn && <p className="pequeno texto-suave" style={{ margin: '0.75rem 0 0' }}>Última actualización: {fechaHora(cfg.actualizadoEn)}.</p>}
      </form>
      {toast}
    </div>
  );
}
