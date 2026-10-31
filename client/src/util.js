const TZ = 'America/El_Salvador';

export const dinero = (n) => {
  if (n == null) return '—';
  const v = Number(n);
  const t = Math.abs(v).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? '−' : ''}$${t}`;
};
export const numero = (n, dec = 0) =>
  n == null ? '—' : Number(n).toLocaleString('es-SV', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const kg = (g) => numero(g / 1000, g >= 10000 ? 1 : 2);

export const hora = (iso) => new Date(iso).toLocaleTimeString('es-SV', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
export const fecha = (iso) => new Date(iso).toLocaleDateString('es-SV', { timeZone: TZ, day: 'numeric', month: 'short' });
export const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-SV', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
export const fechaHora = (iso) => `${fecha(iso)}, ${hora(iso)}`;

/** "2026-10-28" -> "28 oct" (sin desfase de zona horaria) */
export const diaCorto = (dia) => {
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('es-SV', { timeZone: 'UTC', day: 'numeric', month: 'short' });
};

export const describirRegla = (r) => {
  if (!r) return '';
  const base = r.tipo === 'porcentaje' ? `${numero(r.valor)} % de descuento` : `${dinero(r.valor)} de descuento`;
  const extras = [];
  if (r.montoMinimo > 0) extras.push(`en compras desde ${dinero(r.montoMinimo)}`);
  if (r.topeDiario > 0) extras.push(`hasta ${r.topeDiario} ${r.topeDiario === 1 ? 'vez' : 'veces'} al día`);
  return [base, ...extras].join(', ');
};

export const requiereMonto = (r) => r && (r.tipo === 'porcentaje' || Number(r.montoMinimo) > 0);

/** Vista previa del descuento (el servidor hace el cálculo definitivo) */
export function previsualizar(regla, monto, usosHoy) {
  if (!regla) return null;
  const m = monto === '' || monto == null ? null : Number(monto);
  if (!regla.activo) return { descuento: 0, motivo: 'Descuento pausado por la cafetería' };
  if (regla.topeDiario > 0 && usosHoy >= regla.topeDiario) return { descuento: 0, motivo: 'Ya alcanzó el tope diario de descuentos' };
  if (requiereMonto(regla) && (m == null || !(m > 0))) return null;
  if (regla.montoMinimo > 0 && m < regla.montoMinimo) return { descuento: 0, motivo: `Compra menor al mínimo de ${dinero(regla.montoMinimo)}` };
  const d = regla.tipo === 'porcentaje' ? Math.round(m * regla.valor) / 100 : m != null ? Math.min(regla.valor, m) : regla.valor;
  return { descuento: Math.round(d * 100) / 100, total: m != null ? Math.round((m - d) * 100) / 100 : null };
}

export const ROL_NOMBRE = { admin: 'Administración', duena: 'Dueña de cafetería', empleado: 'Empleado', cliente: 'Cliente' };
export const RUTA_INICIO = { admin: '/admin', duena: '/duena', empleado: '/empleado', cliente: '/cliente' };

/** Datos de concientización, tomados de la revisión del estado del arte del proyecto */
export const DATOS = [
  { texto: 'Un recipiente reutilizable necesita alrededor de 37 usos para superar al desechable en varias categorías de impacto ambiental.', fuente: 'Snyder y Park (2024)' },
  { texto: 'Un sistema reutilizable estudiado en China compensó su huella de carbono a partir de unos 27 usos y redujo cerca de 24 % las emisiones por pedido.', fuente: 'Huang et al. (2026)' },
  { texto: 'El programa TecFood2Go del Tecnológico de Monterrey había evitado 17,710 recipientes desechables para junio de 2024.', fuente: 'Irais (2024)' },
  { texto: 'Washington State University evitó unos 65,000 recipientes desechables en tres cafeterías, con una tasa de devolución cercana al 97 %.', fuente: 'Nakata (2024)' },
  { texto: 'La conciencia ambiental no basta: la comodidad, la higiene percibida y los incentivos pesan tanto como la intención de cuidar el ambiente.', fuente: 'Li et al. (2025); Hakim y Aprianingsih (2024)' },
];
