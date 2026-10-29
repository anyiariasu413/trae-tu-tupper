// Constantes del sistema. Cambiarlas aquí actualiza todos los cálculos.
export const CONFIG = {
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
};

export const CO2E_POR_ENVASE = CONFIG.GRAMOS_POR_ENVASE * CONFIG.CO2E_KG_POR_GRAMO;

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
