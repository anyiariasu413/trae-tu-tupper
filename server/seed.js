// Generador de datos de demostración.
// Los datos se generan relativos a la fecha actual, así los paneles
// siempre muestran actividad reciente (últimas 8 semanas + el día de hoy).
import bcrypt from 'bcryptjs';
import { CONFIG, co2ePorEnvase, diaSV, horaSV, instanteSV, sumarDias, diaSemana, redondear } from './config.js';
import { calcularDescuento, requiereMonto } from './reglas.js';

export const CREDENCIALES_DEMO = {
  admin: { email: 'admin@udb.edu.sv', password: 'Admin2026!' },
  duena: { email: 'duena.dliss@udb.edu.sv', password: 'Duena2026!' },
  empleado: { email: 'empleado.dliss@udb.edu.sv', password: 'Empleado2026!' },
  cliente: { email: 'ap250201@alumno.udb.edu.sv', carnet: 'AP250201', password: 'Cliente2026!' },
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES = ['José', 'María', 'Carlos', 'Ana', 'Luis', 'Gabriela', 'Diego', 'Fernanda', 'Kevin', 'Daniela', 'Óscar', 'Valeria', 'Jonathan', 'Andrea', 'Ernesto', 'Katherine', 'Mario', 'Alejandra', 'Ricardo', 'Paola', 'Josué', 'Melissa', 'Fernando', 'Karla', 'Rodrigo', 'Michelle', 'Alexander', 'Tatiana', 'Javier', 'Raquel', 'Bryan', 'Gisela', 'Emerson', 'Patricia', 'René', 'Claudia', 'Walter', 'Jennifer', 'Francisco', 'Lucía'];
const APELLIDOS = ['Hernández', 'Martínez', 'López', 'García', 'Rodríguez', 'Pérez', 'Ramírez', 'Flores', 'Rivera', 'Cruz', 'Alvarado', 'Mejía', 'Guzmán', 'Romero', 'Aguilar', 'Castillo', 'Chávez', 'Menjívar', 'Orellana', 'Portillo', 'Ayala', 'Escobar', 'Rosales', 'Molina', 'Vásquez', 'Bonilla', 'Argueta', 'Canales', 'Quintanilla', 'Zelaya'];

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Distribución de ventas por hora (7:00 a 16:59)
const PESOS_HORA = { 7: 6, 8: 8, 9: 5, 10: 4, 11: 10, 12: 22, 13: 20, 14: 9, 15: 6, 16: 4 };
const SUMA_PESOS = Object.values(PESOS_HORA).reduce((a, b) => a + b, 0);

// Equipo del proyecto: aparecen como clientes con historial de uso
const EQUIPO = [
  { nombre: 'Adriana Alejandra Aguilar Peraza', carnet: 'AP250201', usos: 31, favorita: 'caf-dliss' },
  { nombre: 'Karla Angie Arias Pérez', carnet: 'AP260403', usos: 26, favorita: 'caf-luna' },
  { nombre: 'Gerardo Andrés Cruz Aguirre', carnet: 'CA250809', usos: 22, favorita: 'caf-dliss' },
  { nombre: 'Emily Camila Najarro Escamilla', carnet: 'NE250271', usos: 18, favorita: 'caf-cafeteria' },
  { nombre: 'Gabriela Judith Morán Vega', carnet: 'MV250156', usos: 14, favorita: 'caf-luna' },
];

export function generarDatos(ahora = new Date()) {
  const rnd = mulberry32(20231101);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const entre = (a, b) => a + rnd() * (b - a);

  const hoy = diaSV(ahora);
  const DIAS = 56;
  const inicio = sumarDias(hoy, -DIAS);
  const creadoBase = instanteSV(sumarDias(inicio, -14), 8).toISOString();

  const hashAdmin = bcrypt.hashSync(CREDENCIALES_DEMO.admin.password, 10);
  const hashDuena = bcrypt.hashSync(CREDENCIALES_DEMO.duena.password, 10);
  const hashEmpleado = bcrypt.hashSync(CREDENCIALES_DEMO.empleado.password, 10);
  const hashCliente = bcrypt.hashSync(CREDENCIALES_DEMO.cliente.password, 10);

  const cafeterias = [
    { id: 'caf-dliss', nombre: "Cafetería D'Liss", ubicacion: 'CITT, frente al Edificio 6', activa: true, creadoEn: creadoBase,
      regla: { tipo: 'porcentaje', valor: 10, montoMinimo: 2, topeDiario: 2, activo: true, actualizadoEn: creadoBase } },
    { id: 'caf-luna', nombre: 'Cafetería Luna&', ubicacion: 'Frente al Edificio C', activa: true, creadoEn: creadoBase,
      regla: { tipo: 'fijo', valor: 0.25, montoMinimo: 0, topeDiario: 3, activo: true, actualizadoEn: creadoBase } },
    { id: 'caf-cafeteria', nombre: 'Cafetería', ubicacion: 'Frente al Edificio C, a la izquierda de Cafetería Luna&', activa: true, creadoEn: creadoBase,
      regla: { tipo: 'porcentaje', valor: 15, montoMinimo: 3, topeDiario: 1, activo: true, actualizadoEn: creadoBase } },
  ];

  const usuarios = [
    { id: 'u-admin', nombre: 'Administración UDB', email: CREDENCIALES_DEMO.admin.email, rol: 'admin', cafeteriaId: null, passwordHash: hashAdmin, activo: true, creadoEn: creadoBase },
    { id: 'u-duena-dliss', nombre: 'Rosa Elena Méndez', email: 'duena.dliss@udb.edu.sv', rol: 'duena', cafeteriaId: 'caf-dliss', passwordHash: hashDuena, activo: true, creadoEn: creadoBase },
    { id: 'u-duena-luna', nombre: 'Marta Alicia Rivas', email: 'duena.luna@udb.edu.sv', rol: 'duena', cafeteriaId: 'caf-luna', passwordHash: hashDuena, activo: true, creadoEn: creadoBase },
    { id: 'u-duena-cafeteria', nombre: 'Gloria Beatriz Santos', email: 'duena.cafeteria@udb.edu.sv', rol: 'duena', cafeteriaId: 'caf-cafeteria', passwordHash: hashDuena, activo: true, creadoEn: creadoBase },
    { id: 'u-emp-dliss-1', nombre: 'Jorge Alberto Peña', email: 'empleado.dliss@udb.edu.sv', rol: 'empleado', cafeteriaId: 'caf-dliss', passwordHash: hashEmpleado, activo: true, creadoEn: creadoBase },
    { id: 'u-emp-dliss-2', nombre: 'Karen Lissette Ortiz', email: 'empleado2.dliss@udb.edu.sv', rol: 'empleado', cafeteriaId: 'caf-dliss', passwordHash: hashEmpleado, activo: true, creadoEn: creadoBase },
    { id: 'u-emp-luna', nombre: 'Samuel Antonio Cruz', email: 'empleado.luna@udb.edu.sv', rol: 'empleado', cafeteriaId: 'caf-luna', passwordHash: hashEmpleado, activo: true, creadoEn: creadoBase },
    { id: 'u-emp-cafeteria', nombre: 'Iris Yamileth Duarte', email: 'empleado.cafeteria@udb.edu.sv', rol: 'empleado', cafeteriaId: 'caf-cafeteria', passwordHash: hashEmpleado, activo: true, creadoEn: creadoBase },
  ];
  const empleadosPorCafe = {};
  for (const u of usuarios) if (u.rol === 'empleado') (empleadosPorCafe[u.cafeteriaId] ||= []).push(u.id);

  // ---- Clientes ----
  const clientes = [];
  const carnets = new Set(EQUIPO.map((e) => e.carnet));
  const cafeIds = cafeterias.map((c) => c.id);

  const equipo = EQUIPO.map((e, i) => {
    const u = {
      id: `u-equipo-${i + 1}`, nombre: e.nombre, email: `${e.carnet.toLowerCase()}@alumno.udb.edu.sv`,
      carnet: e.carnet, tipoCliente: 'estudiante', rol: 'cliente', cafeteriaId: null,
      passwordHash: hashCliente, activo: true, creadoEn: instanteSV(inicio, 9 + i).toISOString(),
    };
    usuarios.push(u);
    return { u, usos: e.usos, favorita: e.favorita };
  });

  for (let i = 0; i < 600; i++) {
    const nombre = pick(NOMBRES);
    const ap1 = pick(APELLIDOS);
    let ap2 = pick(APELLIDOS);
    if (ap2 === ap1) ap2 = pick(APELLIDOS);
    const tipo = rnd() < 0.86 ? 'estudiante' : rnd() < 0.6 ? 'docente' : 'administrativo';
    let carnet;
    do {
      const anio = String(19 + Math.floor(rnd() * 8)).padStart(2, '0');
      carnet = sinTildes(ap1[0] + ap2[0]).toUpperCase() + anio + String(Math.floor(rnd() * 10000)).padStart(4, '0');
    } while (carnets.has(carnet));
    carnets.add(carnet);
    const email = tipo === 'estudiante'
      ? `${carnet.toLowerCase()}@alumno.udb.edu.sv`
      : `${sinTildes(nombre).toLowerCase()}.${sinTildes(ap1).toLowerCase()}${i}@udb.edu.sv`;

    // Los participantes se van sumando a lo largo de las semanas (curva de adopción)
    const inicioDia = Math.floor(DIAS * Math.pow(rnd(), 1.3));
    const peso = Math.pow(rnd(), 2.2) * 4 + 0.15; // pocos muy frecuentes, muchos ocasionales
    const cafeFavorita = cafeIds[rnd() < 0.5 ? 0 : rnd() < 0.6 ? 1 : 2];
    const c = {
      id: `u-cli-${i + 1}`, nombre: `${nombre} ${ap1} ${ap2}`, email, carnet, tipoCliente: tipo,
      rol: 'cliente', cafeteriaId: null, passwordHash: hashCliente, activo: true,
      creadoEn: instanteSV(sumarDias(inicio, inicioDia), 8 + Math.floor(rnd() * 8), Math.floor(rnd() * 60)).toISOString(),
    };
    usuarios.push(c);
    clientes.push({ u: c, inicioDia, peso, cafeFavorita });
  }

  // ---- Registros de reutilización ----
  const registros = [];
  const ventasSinTupper = [];
  const BASE = { 'caf-dliss': 250, 'caf-luna': 175, 'caf-cafeteria': 135 };
  const ahoraMs = ahora.getTime();
  let seq = 0;

  const montoAleatorio = () => redondear(Math.round(entre(1.75, 5.5) * 4) / 4);

  const crearRegistro = (cliente, cafe, dia, usosHoyCafe) => {
    const horas = Object.keys(PESOS_HORA).map(Number);
    let r = rnd() * SUMA_PESOS, hora = 12;
    for (const h of horas) { r -= PESOS_HORA[h]; if (r <= 0) { hora = h; break; } }
    const fecha = instanteSV(dia, hora, Math.floor(rnd() * 60));
    if (fecha.getTime() > ahoraMs) return null;
    const monto = requiereMonto(cafe.regla) ? montoAleatorio() : null;
    const calc = calcularDescuento(cafe.regla, monto, usosHoyCafe);
    seq++;
    return {
      id: `r-${seq}`, clienteId: cliente.id, cafeteriaId: cafe.id,
      empleadoId: pick(empleadosPorCafe[cafe.id]), fecha: fecha.toISOString(),
      monto, descuento: calc.descuento, total: calc.total, motivoSinDescuento: calc.motivo,
      tipoDescuento: cafe.regla.tipo, valorDescuento: cafe.regla.valor,
      gramosEvitados: CONFIG.GRAMOS_POR_ENVASE, co2eKg: redondear(co2ePorEnvase(), 5),
    };
  };

  // Fracción del día operativo ya transcurrida (para el día de hoy)
  const horaActual = horaSV(ahora);
  let pesoTranscurrido = 0;
  for (const [h, p] of Object.entries(PESOS_HORA)) if (Number(h) < horaActual) pesoTranscurrido += p;
  const fraccionHoy = pesoTranscurrido / SUMA_PESOS;

  // Días de uso de cada integrante del equipo, repartidos en las 8 semanas
  const diasHabiles = [];
  for (let d = 0; d <= DIAS; d++) { const dia = sumarDias(inicio, d); const ds = diaSemana(dia); if (ds >= 1 && ds <= 5 && dia !== hoy) diasHabiles.push(dia); }
  for (const m of equipo) {
    m.dias = new Map();
    while (m.dias.size < Math.min(m.usos, diasHabiles.length)) {
      const dia = diasHabiles[Math.floor(rnd() * diasHabiles.length)];
      // 3 de cada 4 usos en su cafetería favorita
      m.dias.set(dia, rnd() < 0.75 ? m.favorita : pick(cafeIds));
    }
  }

  for (let d = 0; d <= DIAS; d++) {
    const dia = sumarDias(inicio, d);
    const ds = diaSemana(dia);
    if (ds === 0) continue; // domingo cerrado
    const factorDia = ds === 6 ? 0.22 : ds === 5 ? 0.85 : 1;
    const esHoy = dia === hoy;
    const factorHoy = esHoy ? fraccionHoy : 1;
    // La participación crece del ~6 % al ~20 % a lo largo del periodo
    const progreso = d / DIAS;

    for (const cafe of cafeterias) {
      const ventas = Math.round(BASE[cafe.id] * factorDia * entre(0.85, 1.12) * factorHoy);
      const extra = cafe.id === 'caf-luna' ? 0.025 : cafe.id === 'caf-cafeteria' ? -0.01 : 0;
      const proporcion = Math.max(0.02, 0.06 + 0.14 * progreso + extra + entre(-0.02, 0.02));
      let conTupper = Math.round(ventas * proporcion);

      const elegibles = clientes.filter((c) => c.inicioDia <= d);
      const usadosHoy = new Set();
      const usosHoyPorCliente = {};

      for (const m of equipo) {
        if (m.dias.get(dia) !== cafe.id) continue;
        const reg = crearRegistro(m.u, cafe, dia, 0);
        if (reg) { registros.push(reg); usadosHoy.add(m.u.id); conTupper--; }
      }

      let intentos = 0;
      let creados = 0;
      while (creados < conTupper && intentos < conTupper * 6 && elegibles.length) {
        intentos++;
        const total = elegibles.reduce((s, c) => s + c.peso * (c.cafeFavorita === cafe.id ? 4 : 1), 0);
        let r = rnd() * total, elegido = elegibles[0];
        for (const c of elegibles) { r -= c.peso * (c.cafeFavorita === cafe.id ? 4 : 1); if (r <= 0) { elegido = c; break; } }
        const usos = usosHoyPorCliente[elegido.u.id] || 0;
        if (usadosHoy.has(elegido.u.id) && (usos >= 2 || rnd() < 0.85)) continue;
        const reg = crearRegistro(elegido.u, cafe, dia, usos);
        if (!reg) { creados++; continue; }
        registros.push(reg);
        usadosHoy.add(elegido.u.id);
        usosHoyPorCliente[elegido.u.id] = usos + 1;
        creados++;
      }
      const sinTupper = Math.max(0, ventas - creados);
      if (sinTupper > 0) ventasSinTupper.push({ cafeteriaId: cafe.id, dia, cantidad: sinTupper });
    }
  }

  registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const contador = {};
  for (const r of registros) {
    contador[r.clienteId] = (contador[r.clienteId] || 0) + 1;
    r.numeroReutilizacion = contador[r.clienteId];
  }

  return {
    meta: { version: 1, generadoEn: ahora.toISOString(), seq },
    cafeterias,
    usuarios,
    registros,
    ventasSinTupper,
  };
}
