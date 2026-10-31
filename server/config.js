// Constantes del sistema. Los valores de impacto se pueden editar desde el panel
// de administración; aquí quedan los valores por defecto.
export const CONFIG_DEFECTO = {
  // Peso promedio de un envase de poliestireno (estado del arte del proyecto)
  GRAMOS_POR_ENVASE: 15.5,
  // Factor de emisión: kg CO2e por gramo de poliestireno
  CO2E_KG_POR_GRAMO: 0.0031,
  // Población objetivo aproximada del campus Soyapango
  POBLACION_OBJETIVO: 15000,
  // Usos a partir de los cuales un reutilizable supera ambientalmente al desechable (Snyder & Park, 2024)
  UMBRAL_AMBIENTAL_USOS: 37,
  // Punto de compensación de carbono de un sistema reutilizable (Huang et al., 2026)
  UMBRAL_CARBONO_USOS: 27,
  MONEDA: 'USD',
  ZONA_HORARIA: 'America/El_Salvador',
  // Fuente o justificación de cada parámetro editable
  FUENTES: {
    GRAMOS_POR_ENVASE: 'Estimación del equipo del proyecto. Pendiente de verificar pesando envases de los chalets.',
    CO2E_KG_POR_GRAMO: 'Estimación del equipo del proyecto. Pendiente de cita bibliográfica.',
    POBLACION_OBJETIVO: 'Dato aproximado de la población del campus Soyapango de la UDB.',
  },
};

/** Configuración vigente (por defecto + cambios guardados por la administración) */
export const CONFIG = { ...CONFIG_DEFECTO };

/** Parámetros que la administración puede editar, con sus límites */
export const EDITABLES = {
  GRAMOS_POR_ENVASE: { min: 1, max: 100 },
  CO2E_KG_POR_GRAMO: { min: 0.0001, max: 0.05 },
  POBLACION_OBJETIVO: { min: 100, max: 100000 },
};

export function aplicarConfig(cambios = {}) {
  for (const k of Object.keys(CONFIG)) delete CONFIG[k];
  Object.assign(CONFIG, CONFIG_DEFECTO);
  for (const k of Object.keys(EDITABLES)) if (cambios[k] != null) CONFIG[k] = Number(cambios[k]);
  CONFIG.FUENTES = { ...CONFIG_DEFECTO.FUENTES, ...(cambios.FUENTES || {}) };
}

export const co2ePorEnvase = () => CONFIG.GRAMOS_POR_ENVASE * CONFIG.CO2E_KG_POR_GRAMO;

// El Salvador usa UTC-6 todo el año (sin horario de verano)
const OFFSET_MS = -6 * 3600 * 1000;

/** Día local de El Salvador (YYYY-MM-DD) para una fecha */
export function diaSV(fecha = new Date()) {
  return new Date(new Date(fecha).getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Hora local de El Salvador (0-23) */
export function horaSV(fecha = new Date()) {
  return new Date(new Date(fecha).getTime() + OFFSET_MS).getUTCHours();
}

/** Construye un instante UTC a partir de un día local de El Salvador y una hora */
export function instanteSV(dia, hora = 0, minuto = 0) {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hora, minuto) - OFFSET_MS);
}

/** Suma días a un día YYYY-MM-DD */
export function sumarDias(dia, n) {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de un día YYYY-MM-DD */
export function diaSemana(dia) {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const redondear = (n, dec = 2) => Math.round(n * 10 ** dec) / 10 ** dec;
