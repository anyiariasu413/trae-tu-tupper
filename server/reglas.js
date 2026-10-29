import { redondear } from './config.js';

/** ¿La regla de esta cafetería necesita que el empleado ingrese el monto de compra? */
export function requiereMonto(regla) {
  return regla.tipo === 'porcentaje' || Number(regla.montoMinimo) > 0;
}

/**
 * Calcula el descuento para una compra con tupper.
 * La reutilización SIEMPRE se registra como impacto ambiental; el descuento
 * puede ser 0 si la regla está pausada, se alcanzó el tope o no se llega al mínimo.
 */
export function calcularDescuento(regla, monto, usosHoy) {
  const base = { descuento: 0, total: monto != null ? redondear(monto) : null, motivo: null };

  if (requiereMonto(regla) && (monto == null || Number.isNaN(monto))) {
    return { error: 'Esta cafetería requiere el monto de la compra para calcular el descuento.' };
  }
  if (monto != null && monto <= 0) {
    return { error: 'El monto de la compra debe ser mayor que cero.' };
  }
  if (!regla.activo) {
    return { ...base, motivo: 'Descuento pausado temporalmente por la cafetería' };
  }
  if (regla.topeDiario > 0 && usosHoy >= regla.topeDiario) {
    return {
      ...base,
      motivo: `Tope diario alcanzado (${regla.topeDiario} ${regla.topeDiario === 1 ? 'uso' : 'usos'} con descuento por día)`,
    };
  }
  if (regla.montoMinimo > 0 && monto < regla.montoMinimo) {
    return { ...base, motivo: `La compra no alcanza el mínimo de $${Number(regla.montoMinimo).toFixed(2)}` };
  }

  let descuento = 0;
  if (regla.tipo === 'porcentaje') descuento = redondear((monto * regla.valor) / 100);
  else descuento = monto != null ? Math.min(regla.valor, monto) : regla.valor;
  descuento = redondear(descuento);

  return {
    descuento,
    total: monto != null ? redondear(monto - descuento) : null,
    motivo: null,
  };
}

export function validarRegla(r) {
  const errores = [];
  if (!['porcentaje', 'fijo'].includes(r.tipo)) errores.push('Tipo de descuento inválido.');
  const valor = Number(r.valor);
  if (!(valor > 0)) errores.push('El valor del descuento debe ser mayor que cero.');
  if (r.tipo === 'porcentaje' && valor > 50) errores.push('El porcentaje no puede superar el 50 %.');
  if (r.tipo === 'fijo' && valor > 5) errores.push('El descuento fijo no puede superar $5.00.');
  const minimo = Number(r.montoMinimo ?? 0);
  if (minimo < 0 || minimo > 50) errores.push('El monto mínimo debe estar entre $0 y $50.');
  const tope = Number(r.topeDiario ?? 0);
  if (!Number.isInteger(tope) || tope < 0 || tope > 10) errores.push('El tope diario debe ser un entero entre 0 y 10 (0 = sin tope).');
  return errores;
}
