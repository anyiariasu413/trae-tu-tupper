import { CONFIG, diaSV, horaSV, sumarDias, redondear } from './config.js';

export function resumir(registros, sinTupper = 0) {
  const envases = registros.length;
  const descuentos = registros.reduce((s, r) => s + (r.descuento || 0), 0);
  const gramos = envases * CONFIG.GRAMOS_POR_ENVASE;
  const ventas = envases + sinTupper;
  return {
    envases,
    gramos: redondear(gramos, 1),
    kg: redondear(gramos / 1000, 2),
    co2eKg: redondear(gramos * CONFIG.CO2E_KG_POR_GRAMO, 2),
    descuentos: redondear(descuentos),
    ventasSinTupper: sinTupper,
    ventasTotales: ventas,
    pctConTupper: ventas ? redondear((envases / ventas) * 100, 1) : 0,
    clientesUnicos: new Set(registros.map((r) => r.clienteId)).size,
  };
}

const sumaSin = (filas) => filas.reduce((s, v) => s + v.cantidad, 0);

/** Enmascara un carné para reportes anonimizados: HM250117 -> HM25••17 */
export const enmascarar = (carnet = '') => (carnet.length > 4 ? carnet.slice(0, 4) + '••' + carnet.slice(-2) : '••••');

/**
 * Métricas para un conjunto de cafeterías (una para la dueña, todas para el admin).
 */
export function metricasCafeterias(db, cafeIds, dias = 30) {
  const set = new Set(cafeIds);
  const hoy = diaSV();
  const desde = sumarDias(hoy, -(dias - 1));
  const desdeSemana = sumarDias(hoy, -6);
  const desdeSemanaAnt = sumarDias(hoy, -13);

  const regs = db.registros.filter((r) => set.has(r.cafeteriaId)).map((r) => ({ ...r, dia: diaSV(r.fecha) }));
  const sin = db.ventasSinTupper.filter((v) => set.has(v.cafeteriaId));

  const enRango = (a, b) => (x) => x.dia >= a && x.dia <= b;
  const regsHoy = regs.filter((r) => r.dia === hoy);
  const regsSemana = regs.filter(enRango(desdeSemana, hoy));
  const regsSemanaAnt = regs.filter(enRango(desdeSemanaAnt, sumarDias(desdeSemana, -1)));
  const regsPeriodo = regs.filter(enRango(desde, hoy));

  const semana = resumir(regsSemana, sumaSin(sin.filter(enRango(desdeSemana, hoy))));
  const semanaAnterior = resumir(regsSemanaAnt, sumaSin(sin.filter(enRango(desdeSemanaAnt, sumarDias(desdeSemana, -1)))));

  // Serie diaria
  const porDia = {};
  for (let i = 0; i < dias; i++) porDia[sumarDias(desde, i)] = { envases: 0, sinTupper: 0, descuentos: 0 };
  for (const r of regsPeriodo) { porDia[r.dia].envases++; porDia[r.dia].descuentos += r.descuento || 0; }
  for (const v of sin) if (porDia[v.dia]) porDia[v.dia].sinTupper += v.cantidad;
  const serie = Object.entries(porDia).map(([dia, v]) => ({
    dia,
    envases: v.envases,
    sinTupper: v.sinTupper,
    descuentos: redondear(v.descuentos),
    pct: v.envases + v.sinTupper ? redondear((v.envases / (v.envases + v.sinTupper)) * 100, 1) : null,
  }));

  // Distribución por hora (periodo)
  const horas = {};
  for (let h = 7; h <= 16; h++) horas[h] = 0;
  for (const r of regsPeriodo) { const h = horaSV(r.fecha); if (h in horas) horas[h]++; }
  const porHora = Object.entries(horas).map(([h, n]) => ({ hora: `${h}:00`, envases: n }));

  // Clientes del periodo
  const usosPeriodo = {};
  for (const r of regsPeriodo) usosPeriodo[r.clienteId] = (usosPeriodo[r.clienteId] || 0) + 1;
  const primerUso = {};
  for (const r of regs) if (!primerUso[r.clienteId]) primerUso[r.clienteId] = r.dia;
  const nuevosSemana = Object.values(primerUso).filter((d) => d >= desdeSemana).length;

  // Distribución de usos acumulados por participante (todas las cafeterías del conjunto)
  const usosTotales = {};
  for (const r of regs) usosTotales[r.clienteId] = (usosTotales[r.clienteId] || 0) + 1;
  const buckets = [
    { rango: '1', min: 1, max: 1 },
    { rango: '2–4', min: 2, max: 4 },
    { rango: '5–9', min: 5, max: 9 },
    { rango: '10–26', min: 10, max: 26 },
    { rango: '27–36', min: 27, max: 36 },
    { rango: '37+', min: 37, max: Infinity },
  ].map((b) => ({ rango: b.rango, participantes: Object.values(usosTotales).filter((n) => n >= b.min && n <= b.max).length }));

  const porCafeteria = cafeIds.map((id) => {
    const caf = db.cafeterias.find((c) => c.id === id);
    const rc = regs.filter((r) => r.cafeteriaId === id);
    const sc = sin.filter((v) => v.cafeteriaId === id);
    return {
      id,
      nombre: caf?.nombre || id,
      activa: caf?.activa ?? false,
      hoy: resumir(rc.filter((r) => r.dia === hoy), sumaSin(sc.filter((v) => v.dia === hoy))),
      periodo: resumir(rc.filter(enRango(desde, hoy)), sumaSin(sc.filter(enRango(desde, hoy)))),
      total: resumir(rc, sumaSin(sc)),
    };
  });

  const nombreCafe = Object.fromEntries(db.cafeterias.map((c) => [c.id, c.nombre]));
  const usuarios = Object.fromEntries(db.usuarios.map((u) => [u.id, u]));
  const recientes = regs.slice(-12).reverse().map((r) => ({
    id: r.id,
    fecha: r.fecha,
    cafeteria: nombreCafe[r.cafeteriaId],
    cliente: enmascarar(usuarios[r.clienteId]?.carnet),
    descuento: r.descuento,
    numeroReutilizacion: r.numeroReutilizacion,
  }));

  return {
    dias,
    hoy: resumir(regsHoy, sumaSin(sin.filter((v) => v.dia === hoy))),
    semana,
    semanaAnterior,
    variacionSemanal: semanaAnterior.envases ? redondear(((semana.envases - semanaAnterior.envases) / semanaAnterior.envases) * 100, 1) : null,
    periodo: resumir(regsPeriodo, sumaSin(sin.filter(enRango(desde, hoy)))),
    total: resumir(regs, sumaSin(sin)),
    serie,
    porHora,
    clientes: {
      activosPeriodo: Object.keys(usosPeriodo).length,
      recurrentesPeriodo: Object.values(usosPeriodo).filter((n) => n >= 3).length,
      nuevosSemana,
      totalParticipantes: Object.keys(usosTotales).length,
      superanUmbralAmbiental: Object.values(usosTotales).filter((n) => n >= CONFIG.UMBRAL_AMBIENTAL_USOS).length,
      superanUmbralCarbono: Object.values(usosTotales).filter((n) => n >= CONFIG.UMBRAL_CARBONO_USOS).length,
      promedioUsos: Object.keys(usosTotales).length ? redondear(regs.length / Object.keys(usosTotales).length, 1) : 0,
    },
    distribucionUsos: buckets,
    porCafeteria,
    recientes,
  };
}

/** Métricas personales de un cliente */
export function metricasCliente(db, clienteId) {
  const regs = db.registros.filter((r) => r.clienteId === clienteId);
  const res = resumir(regs);
  const ahorro = res.descuentos;
  const hoy = diaSV();
  const mes = hoy.slice(0, 7);
  const usosMes = regs.filter((r) => diaSV(r.fecha).startsWith(mes)).length;

  // Racha de semanas consecutivas (lunes a domingo) con al menos un uso
  const semanaDe = (dia) => {
    const [y, m, d] = dia.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dow = (dt.getUTCDay() + 6) % 7;
    return new Date(dt.getTime() - dow * 86400000).toISOString().slice(0, 10);
  };
  const semanas = new Set(regs.map((r) => semanaDe(diaSV(r.fecha))));
  let racha = 0;
  let s = semanaDe(hoy);
  if (!semanas.has(s)) s = sumarDias(s, -7); // la semana actual aún puede estar en curso
  while (semanas.has(s)) { racha++; s = sumarDias(s, -7); }

  // Percentil entre todos los participantes
  const usosPor = {};
  for (const r of db.registros) usosPor[r.clienteId] = (usosPor[r.clienteId] || 0) + 1;
  const todos = Object.values(usosPor);
  const superados = todos.filter((n) => n < regs.length).length;
  const percentil = todos.length && regs.length ? Math.round((superados / todos.length) * 100) : 0;

  const nombreCafe = Object.fromEntries(db.cafeterias.map((c) => [c.id, c.nombre]));
  const favorita = Object.entries(regs.reduce((a, r) => ({ ...a, [r.cafeteriaId]: (a[r.cafeteriaId] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])[0];

  return {
    usos: regs.length,
    gramos: res.gramos,
    kg: res.kg,
    co2eKg: res.co2eKg,
    ahorro,
    usosMes,
    rachaSemanas: racha,
    percentil,
    cafeteriaFavorita: favorita ? nombreCafe[favorita[0]] : null,
    umbrales: { ambiental: CONFIG.UMBRAL_AMBIENTAL_USOS, carbono: CONFIG.UMBRAL_CARBONO_USOS },
    historial: regs.slice().reverse().map((r) => ({
      id: r.id,
      fecha: r.fecha,
      cafeteria: nombreCafe[r.cafeteriaId] || 'Cafetería',
      monto: r.monto,
      descuento: r.descuento,
      motivoSinDescuento: r.motivoSinDescuento,
      numeroReutilizacion: r.numeroReutilizacion,
    })),
  };
}

/** Impacto público acumulado (sin datos personales) */
export function impactoPublico(db) {
  const total = resumir(db.registros, sumaSin(db.ventasSinTupper));
  const hoy = diaSV();
  const desde = sumarDias(hoy, -13);
  const recientes = db.registros.filter((r) => diaSV(r.fecha) >= desde);
  const sinRec = db.ventasSinTupper.filter((v) => v.dia >= desde);
  const porSemana = {};
  for (const r of db.registros) {
    const d = diaSV(r.fecha);
    const [y, m, dd] = d.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, dd));
    const lunes = new Date(dt.getTime() - ((dt.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
    porSemana[lunes] = (porSemana[lunes] || 0) + 1;
  }
  return {
    envases: total.envases,
    kg: total.kg,
    co2eKg: total.co2eKg,
    participantes: total.clientesUnicos,
    cafeteriasActivas: db.cafeterias.filter((c) => c.activa).length,
    pctConTupperRecientes: resumir(recientes, sumaSin(sinRec)).pctConTupper,
    descuentosOtorgados: total.descuentos,
    desde: db.registros[0]?.fecha || null,
    porSemana: Object.entries(porSemana).sort().map(([semana, envases]) => ({ semana, envases })),
  };
}
