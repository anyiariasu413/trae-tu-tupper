import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

/** Carga datos de la API, con recarga periódica opcional */
export function useDatos(ruta, { cada = 0 } = {}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const vivo = useRef(true);

  const cargar = useCallback(async () => {
    if (!ruta) return;
    try {
      const d = await api(ruta);
      if (vivo.current) { setDatos(d); setError(null); }
    } catch (e) {
      if (vivo.current) setError(e.message);
    }
  }, [ruta]);

  useEffect(() => {
    vivo.current = true;
    cargar();
    let t;
    if (cada) t = setInterval(() => { if (!document.hidden) cargar(); }, cada);
    return () => { vivo.current = false; clearInterval(t); };
  }, [cargar, cada]);

  return { datos, error, recargar: cargar };
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <div className="giro" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

export function Error({ mensaje, reintentar }) {
  if (!mensaje) return null;
  return (
    <div className="aviso aviso-error" role="alert">
      {mensaje}{' '}
      {reintentar && <button className="btn-texto btn" onClick={reintentar}>Reintentar</button>}
    </div>
  );
}

export function Interruptor({ checked, onChange, children, disabled }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="pista" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

export function Modal({ titulo, onCerrar, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCerrar]);
  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const mostrar = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  const nodo = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [nodo, mostrar];
}

/** Envase de poliestireno tipo "clamshell" */
export function Envase({ evitado = true, title }) {
  const relleno = evitado ? '#16804F' : '#C9D1DD';
  return (
    <svg viewBox="0 0 40 30" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d="M4 12 Q20 2 36 12 L36 14 L4 14 Z" fill={relleno} opacity="0.75" />
      <path d="M3 15 H37 L33 27 Q32 28.5 30 28.5 H10 Q8 28.5 7 27 Z" fill={relleno} />
    </svg>
  );
}

/** Gráfico de unidades: cada ícono representa `porIcono` envases */
export function Unidades({ total, porIcono = 25, max = 160 }) {
  const iconos = Math.min(max, Math.ceil(total / porIcono));
  return (
    <div>
      <div className="unidades" role="img" aria-label={`${total} envases evitados, representados con ${iconos} íconos de ${porIcono} envases`}>
        {Array.from({ length: iconos }, (_, i) => <Envase key={i} />)}
      </div>
      <div className="leyenda-unidades"><Envase /> = {porIcono} envases de poliestireno evitados{total / porIcono > max ? ` (se muestran los primeros ${max * porIcono})` : ''}</div>
    </div>
  );
}

export function Kpi({ valor, unidad, etiqueta, nota }) {
  return (
    <div>
      <div className="kpi-valor">{valor}{unidad && <small>{unidad}</small>}</div>
      <div className="kpi-etiqueta">{etiqueta}</div>
      {nota && <div className="kpi-nota">{nota}</div>}
    </div>
  );
}

export function Variacion({ valor }) {
  if (valor == null) return null;
  const sube = valor >= 0;
  return <span className={sube ? 'sube' : 'baja'}>{sube ? '▲' : '▼'} {Math.abs(valor).toLocaleString('es-SV')} %</span>;
}

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICONOS = {
  escanear: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /></>,
  lista: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  panel: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  ajustes: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  equipo: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6" /></>,
  tienda: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v7h14v-7" /></>,
  usuarios: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>,
  simulador: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  carne: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><rect x="14" y="9" width="4" height="4" /></>,
  hoja: <><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" /><path d="M5 19l7-7" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  salir: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></>,
    etiqueta: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
};
export function Icono({ nombre, tamano = 22 }) {
  return <svg width={tamano} height={tamano} viewBox="0 0 24 24" {...P} aria-hidden="true">{ICONOS[nombre]}</svg>;
}

export function Logo({ tamano = 34 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 24V15" stroke="#21448E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M32 16C32 10 37 6.5 44 6.5C44 12.5 39 16 32 16Z" fill="#FFDF00" stroke="#21448E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 18.5C32 13.5 27.5 10.5 21.5 10.5C21.5 15.5 26 18.5 32 18.5Z" fill="#FFDF00" stroke="#21448E" strokeWidth="2" strokeLinejoin="round" />
      <rect x="4.5" y="25.5" width="5" height="9" rx="2" fill="#172F66" />
      <rect x="54.5" y="25.5" width="5" height="9" rx="2" fill="#172F66" />
      <rect x="7" y="23" width="50" height="9" rx="3.5" fill="#21448E" />
      <path d="M10.5 33H53.5L50.6 53.2Q50.1 57 46.3 57H17.7Q13.9 57 13.4 53.2Z" fill="#21448E" />
    </svg>
  );
}
