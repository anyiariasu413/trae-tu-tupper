import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { cargar, getDb, guardar, nuevoId, restaurar } from './db.js';
import { firmarToken, publico, requiere, limitarLogin } from './auth.js';
import { CONFIG, CONFIG_DEFECTO, EDITABLES, aplicarConfig, co2ePorEnvase, diaSV, sumarDias, redondear } from './config.js';
import { calcularDescuento, requiereMonto, validarRegla } from './reglas.js';
import { metricasCafeterias, metricasCliente, impactoPublico } from './metricas.js';
import { CREDENCIALES_DEMO } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

cargar();
const db = () => getDb();

// ---------- utilidades ----------
const RE_CARNET = /^[A-Z]{2}\d{6}$/;
const RE_EMAIL_UDB = /^[^\s@]+@([a-z0-9-]+\.)*udb\.edu\.sv$/i;

/** Acepta el contenido del QR virtual ("UDB-TUPPER:HM250117") o el carné escrito a mano */
function normalizarCarnet(texto = '') {
  let t = String(texto).trim().toUpperCase();
  if (t.startsWith('UDB-TUPPER:')) t = t.slice('UDB-TUPPER:'.length);
  return t.replace(/[^A-Z0-9]/g, '');
}

function validarPassword(p) {
  if (typeof p !== 'string' || p.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(p) || !/\d/.test(p)) return 'La contraseña debe incluir letras y números.';
  return null;
}

function cafeteriaDelPersonal(req, res, idSolicitado) {
  const u = req.usuario;
  const id = u.rol === 'admin' ? idSolicitado : u.cafeteriaId;
  const caf = db().cafeterias.find((c) => c.id === id);
  if (!caf) { res.status(404).json({ error: 'Cafetería no encontrada.' }); return null; }
  return caf;
}

const usosHoyEn = (clienteId, cafeteriaId) => {
  const hoy = diaSV();
  return db().registros.filter((r) => r.clienteId === clienteId && r.cafeteriaId === cafeteriaId && diaSV(r.fecha) === hoy).length;
};

// ---------- públicas ----------
app.get('/api/health', (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

app.get('/api/public/impacto', (req, res) => res.json(impactoPublico(db())));

app.get('/api/public/guia', (req, res) => res.json({
  credenciales: [
    { rol: 'Administrador', descripcion: 'Gestión global, métricas consolidadas y simulador', ...CREDENCIALES_DEMO.admin },
    { rol: 'Dueña de cafetería', descripcion: "Cafetería D'Liss: reglas de descuento y métricas", ...CREDENCIALES_DEMO.duena },
    { rol: 'Empleado', descripcion: "Cafetería D'Liss: registro de tuppers", ...CREDENCIALES_DEMO.empleado },
    { rol: 'Cliente (estudiante)', descripcion: 'Carné virtual e impacto personal', email: CREDENCIALES_DEMO.cliente.email, password: CREDENCIALES_DEMO.cliente.password, carnet: CREDENCIALES_DEMO.cliente.carnet },
  ],
}));

app.get('/api/public/cafeterias', (req, res) => res.json(
  db().cafeterias.map((c) => ({ id: c.id, nombre: c.nombre, ubicacion: c.ubicacion, activa: c.activa, regla: c.regla })),
));

app.get('/api/config', (req, res) => res.json({ ...CONFIG, CO2E_POR_ENVASE: redondear(co2ePorEnvase(), 5), DEFECTO: CONFIG_DEFECTO, actualizadoEn: db().config?.actualizadoEn || null }));

app.put('/api/config', requiere('admin'), (req, res) => {
  const nuevos = { ...(db().config || {}) };
  for (const [k, lim] of Object.entries(EDITABLES)) {
    if (req.body?.[k] === undefined) continue;
    const v = Number(req.body[k]);
    if (!Number.isFinite(v) || v < lim.min || v > lim.max) {
      return res.status(400).json({ error: `El valor de ${k} debe estar entre ${lim.min} y ${lim.max}.` });
    }
    nuevos[k] = v;
  }
  if (req.body?.fuentes && typeof req.body.fuentes === 'object') {
    nuevos.FUENTES = { ...(nuevos.FUENTES || {}) };
    for (const k of Object.keys(EDITABLES)) {
      if (req.body.fuentes[k] === undefined) continue;
      const t = String(req.body.fuentes[k]).trim().slice(0, 300);
      if (t.length < 3) return res.status(400).json({ error: 'Escribe la fuente o justificación de cada parámetro.' });
      nuevos.FUENTES[k] = t;
    }
  }
  if (req.body?.restablecer) { for (const k of Object.keys(EDITABLES)) delete nuevos[k]; delete nuevos.FUENTES; }
  nuevos.actualizadoEn = new Date().toISOString();
  db().config = nuevos;
  aplicarConfig(nuevos);
  guardar();
  res.json({ ...CONFIG, CO2E_POR_ENVASE: redondear(co2ePorEnvase(), 5), DEFECTO: CONFIG_DEFECTO, actualizadoEn: nuevos.actualizadoEn });
});

// ---------- autenticación ----------
app.post('/api/auth/login', limitarLogin, (req, res) => {
  const { identificador = '', password = '' } = req.body || {};
  const id = String(identificador).trim().toLowerCase();
  if (!id || !password) return res.status(400).json({ error: 'Ingresa tu correo o carné y tu contraseña.' });
  const u = db().usuarios.find((x) => x.email.toLowerCase() === id || (x.carnet && x.carnet.toLowerCase() === id));
  if (!u || !bcrypt.compareSync(String(password), u.passwordHash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
  if (!u.activo) return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta a la administración.' });
  if (u.cafeteriaId) {
    const caf = db().cafeterias.find((c) => c.id === u.cafeteriaId);
    if (!caf) return res.status(403).json({ error: 'La cafetería asignada ya no existe.' });
  }
  res.json({ token: firmarToken(u), usuario: publico(u) });
});

app.post('/api/auth/registro', limitarLogin, (req, res) => {
  const { nombre = '', carnet = '', email = '', password = '' } = req.body || {};
  const c = normalizarCarnet(carnet);
  const e = String(email).trim().toLowerCase();
  const n = String(nombre).trim().replace(/\s+/g, ' ');
  if (n.length < 5 || !n.includes(' ')) return res.status(400).json({ error: 'Escribe tu nombre y apellido.' });
  if (!RE_CARNET.test(c)) return res.status(400).json({ error: 'El carné debe tener 2 letras y 6 números (ej. AP250201).' });
  if (!RE_EMAIL_UDB.test(e)) return res.status(400).json({ error: 'Usa tu correo institucional (@udb.edu.sv o @alumno.udb.edu.sv).' });
  const errPass = validarPassword(password);
  if (errPass) return res.status(400).json({ error: errPass });
  if (db().usuarios.some((u) => u.carnet === c)) return res.status(409).json({ error: 'Ya existe una cuenta con ese carné.' });
  // El registro público siempre crea clientes; el tipo se deduce del correo institucional
  const tipoCliente = e.endsWith('@alumno.udb.edu.sv') ? 'estudiante' : 'personal UDB';
  if (db().usuarios.some((u) => u.email.toLowerCase() === e)) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

  const u = {
    id: nuevoId('u'), nombre: n, email: e, carnet: c, tipoCliente, rol: 'cliente', cafeteriaId: null,
    passwordHash: bcrypt.hashSync(password, 10), activo: true, creadoEn: new Date().toISOString(),
  };
  db().usuarios.push(u);
  guardar();
  res.status(201).json({ token: firmarToken(u), usuario: publico(u) });
});

app.get('/api/auth/yo', requiere(), (req, res) => {
  const u = req.usuario;
  const cafeteria = u.cafeteriaId ? db().cafeterias.find((c) => c.id === u.cafeteriaId) : null;
  res.json({ usuario: publico(u), cafeteria });
});

app.put('/api/auth/password', requiere(), (req, res) => {
  const { actual = '', nueva = '' } = req.body || {};
  if (!bcrypt.compareSync(String(actual), req.usuario.passwordHash)) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
  const err = validarPassword(nueva);
  if (err) return res.status(400).json({ error: err });
  req.usuario.passwordHash = bcrypt.hashSync(nueva, 10);
  guardar();
  res.json({ ok: true });
});

// ---------- empleado: registro de tuppers ----------
app.get('/api/clientes/:carnet', requiere('empleado', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res);
  if (!caf) return;
  const carnet = normalizarCarnet(req.params.carnet);
  const cliente = db().usuarios.find((u) => u.rol === 'cliente' && u.carnet === carnet);
  if (!cliente) return res.status(404).json({ error: `No hay ninguna cuenta registrada con el carné ${carnet || '(vacío)'}.` });
  if (!cliente.activo) return res.status(403).json({ error: 'La cuenta de este cliente está desactivada.' });
  const totalUsos = db().registros.filter((r) => r.clienteId === cliente.id).length;
  res.json({
    cliente: { id: cliente.id, nombre: cliente.nombre, carnet: cliente.carnet, tipoCliente: cliente.tipoCliente },
    usosHoy: usosHoyEn(cliente.id, caf.id),
    totalUsos,
    cafeteria: { id: caf.id, nombre: caf.nombre, activa: caf.activa },
    regla: caf.regla,
    requiereMonto: requiereMonto(caf.regla),
  });
});

app.post('/api/registros', requiere('empleado', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res);
  if (!caf) return;
  if (!caf.activa) return res.status(403).json({ error: 'Esta cafetería está desactivada temporalmente por la administración.' });
  const carnet = normalizarCarnet(req.body?.carnet);
  const cliente = db().usuarios.find((u) => u.rol === 'cliente' && u.carnet === carnet);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  if (!cliente.activo) return res.status(403).json({ error: 'La cuenta de este cliente está desactivada.' });

  // Evita registros duplicados por doble escaneo
  const reciente = db().registros.findLast?.((r) => r.clienteId === cliente.id && r.cafeteriaId === caf.id);
  if (reciente && Date.now() - new Date(reciente.fecha).getTime() < 60_000) {
    return res.status(409).json({ error: 'Este carné ya se registró hace menos de un minuto en esta cafetería.' });
  }

  const montoRaw = req.body?.monto;
  const monto = montoRaw === null || montoRaw === undefined || montoRaw === '' ? null : redondear(Number(montoRaw));
  if (monto !== null && (Number.isNaN(monto) || monto > 100)) return res.status(400).json({ error: 'Monto de compra inválido.' });

  const usosHoy = usosHoyEn(cliente.id, caf.id);
  const calc = calcularDescuento(caf.regla, monto, usosHoy);
  if (calc.error) return res.status(400).json({ error: calc.error });

  const numero = db().registros.filter((r) => r.clienteId === cliente.id).length + 1;
  const registro = {
    id: nuevoId('r'), clienteId: cliente.id, cafeteriaId: caf.id, empleadoId: req.usuario.id,
    fecha: new Date().toISOString(), monto, descuento: calc.descuento, total: calc.total,
    motivoSinDescuento: calc.motivo, tipoDescuento: caf.regla.tipo, valorDescuento: caf.regla.valor,
    gramosEvitados: CONFIG.GRAMOS_POR_ENVASE, co2eKg: redondear(co2ePorEnvase(), 5), numeroReutilizacion: numero,
  };
  db().registros.push(registro);
  guardar();
  res.status(201).json({
    registro,
    cliente: { nombre: cliente.nombre, carnet: cliente.carnet },
    impactoCliente: {
      usos: numero,
      gramos: redondear(numero * CONFIG.GRAMOS_POR_ENVASE, 1),
    },
  });
});

app.get('/api/registros/hoy', requiere('empleado', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res);
  if (!caf) return;
  const hoy = diaSV();
  const usuarios = Object.fromEntries(db().usuarios.map((u) => [u.id, u]));
  const regs = db().registros
    .filter((r) => r.cafeteriaId === caf.id && diaSV(r.fecha) === hoy)
    .reverse()
    .map((r) => ({
      ...r,
      clienteNombre: usuarios[r.clienteId]?.nombre,
      clienteCarnet: usuarios[r.clienteId]?.carnet,
      empleadoNombre: usuarios[r.empleadoId]?.nombre,
    }));
  const sin = db().ventasSinTupper.find((v) => v.cafeteriaId === caf.id && v.dia === hoy)?.cantidad || 0;
  res.json({
    registros: regs,
    sinTupper: sin,
    resumen: {
      envases: regs.length,
      gramos: redondear(regs.length * CONFIG.GRAMOS_POR_ENVASE, 1),
      descuentos: redondear(regs.reduce((s, r) => s + r.descuento, 0)),
    },
  });
});

app.delete('/api/registros/:id', requiere('empleado', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res);
  if (!caf) return;
  const idx = db().registros.findIndex((r) => r.id === req.params.id && r.cafeteriaId === caf.id);
  if (idx < 0) return res.status(404).json({ error: 'Registro no encontrado.' });
  const r = db().registros[idx];
  if (diaSV(r.fecha) !== diaSV()) return res.status(403).json({ error: 'Solo se pueden anular registros del día de hoy.' });
  db().registros.splice(idx, 1);
  for (const x of db().registros) if (x.clienteId === r.clienteId && x.numeroReutilizacion > r.numeroReutilizacion) x.numeroReutilizacion--;
  guardar();
  res.json({ ok: true });
});

app.post('/api/ventas-sin-tupper', requiere('empleado', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res);
  if (!caf) return;
  if (!caf.activa) return res.status(403).json({ error: 'Esta cafetería está desactivada temporalmente.' });
  const delta = Number(req.body?.delta ?? 1) < 0 ? -1 : 1;
  const hoy = diaSV();
  let fila = db().ventasSinTupper.find((v) => v.cafeteriaId === caf.id && v.dia === hoy);
  if (!fila) { fila = { cafeteriaId: caf.id, dia: hoy, cantidad: 0 }; db().ventasSinTupper.push(fila); }
  fila.cantidad = Math.max(0, fila.cantidad + delta);
  guardar();
  res.json({ sinTupper: fila.cantidad });
});

// ---------- cafeterías ----------
app.get('/api/cafeterias', requiere('admin', 'duena', 'empleado'), (req, res) => {
  const u = req.usuario;
  const lista = u.rol === 'admin' ? db().cafeterias : db().cafeterias.filter((c) => c.id === u.cafeteriaId);
  res.json(lista.map((c) => ({
    ...c,
    personal: db().usuarios.filter((x) => x.cafeteriaId === c.id).map((x) => ({ id: x.id, nombre: x.nombre, rol: x.rol, activo: x.activo })),
    totalRegistros: db().registros.filter((r) => r.cafeteriaId === c.id).length,
  })));
});

app.post('/api/cafeterias', requiere('admin'), (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  const ubicacion = String(req.body?.ubicacion || '').trim();
  if (nombre.length < 3) return res.status(400).json({ error: 'Escribe un nombre para la cafetería.' });
  if (db().cafeterias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) return res.status(409).json({ error: 'Ya existe una cafetería con ese nombre.' });
  const ahora = new Date().toISOString();
  const caf = {
    id: nuevoId('caf'), nombre, ubicacion, activa: true, creadoEn: ahora,
    regla: { tipo: 'porcentaje', valor: 10, montoMinimo: 0, topeDiario: 2, activo: true, actualizadoEn: ahora },
  };
  db().cafeterias.push(caf);
  guardar();
  res.status(201).json(caf);
});

app.put('/api/cafeterias/:id', requiere('admin'), (req, res) => {
  const caf = db().cafeterias.find((c) => c.id === req.params.id);
  if (!caf) return res.status(404).json({ error: 'Cafetería no encontrada.' });
  const nombre = String(req.body?.nombre ?? caf.nombre).trim();
  if (nombre.length < 3) return res.status(400).json({ error: 'Escribe un nombre para la cafetería.' });
  caf.nombre = nombre;
  caf.ubicacion = String(req.body?.ubicacion ?? caf.ubicacion).trim();
  if (typeof req.body?.activa === 'boolean') caf.activa = req.body.activa;
  guardar();
  res.json(caf);
});

app.delete('/api/cafeterias/:id', requiere('admin'), (req, res) => {
  const idx = db().cafeterias.findIndex((c) => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Cafetería no encontrada.' });
  const id = db().cafeterias[idx].id;
  if (db().registros.some((r) => r.cafeteriaId === id)) {
    return res.status(409).json({ error: 'Esta cafetería tiene historial de registros. Desactívala en lugar de eliminarla para conservar las métricas.' });
  }
  db().cafeterias.splice(idx, 1);
  for (const u of db().usuarios) if (u.cafeteriaId === id) u.activo = false;
  guardar();
  res.json({ ok: true });
});

app.put('/api/cafeterias/:id/regla', requiere('admin', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res, req.params.id);
  if (!caf) return;
  if (req.usuario.rol === 'duena' && caf.id !== req.params.id) return res.status(403).json({ error: 'Solo puedes configurar tu cafetería.' });
  const nueva = {
    tipo: req.body?.tipo ?? caf.regla.tipo,
    valor: Number(req.body?.valor ?? caf.regla.valor),
    montoMinimo: Number(req.body?.montoMinimo ?? caf.regla.montoMinimo),
    topeDiario: Number(req.body?.topeDiario ?? caf.regla.topeDiario),
    activo: typeof req.body?.activo === 'boolean' ? req.body.activo : caf.regla.activo,
  };
  const errores = validarRegla(nueva);
  if (errores.length) return res.status(400).json({ error: errores.join(' ') });
  caf.regla = { ...nueva, valor: redondear(nueva.valor), montoMinimo: redondear(nueva.montoMinimo), actualizadoEn: new Date().toISOString() };
  guardar();
  res.json(caf);
});

// ---------- usuarios ----------
app.get('/api/usuarios', requiere('admin', 'duena'), (req, res) => {
  const u = req.usuario;
  const rol = req.query.rol;
  const q = String(req.query.q || '').trim().toLowerCase();
  let lista = db().usuarios;
  if (u.rol === 'duena') lista = lista.filter((x) => x.rol === 'empleado' && x.cafeteriaId === u.cafeteriaId);
  if (rol === 'personal') lista = lista.filter((x) => x.rol !== 'cliente');
  else if (rol) lista = lista.filter((x) => x.rol === rol);
  if (q) lista = lista.filter((x) => x.nombre.toLowerCase().includes(q) || x.email.toLowerCase().includes(q) || (x.carnet || '').toLowerCase().includes(q));
  const usos = {};
  for (const r of db().registros) usos[r.clienteId] = (usos[r.clienteId] || 0) + 1;
  const total = lista.length;
  res.json({
    total,
    usuarios: lista.slice(0, 100).map((x) => ({ ...publico(x), usos: x.rol === 'cliente' ? usos[x.id] || 0 : undefined })),
  });
});

app.post('/api/usuarios', requiere('admin', 'duena'), (req, res) => {
  const yo = req.usuario;
  const { nombre = '', email = '', password = '', rol = 'empleado' } = req.body || {};
  let cafeteriaId = req.body?.cafeteriaId;
  if (yo.rol === 'duena') {
    if (rol !== 'empleado') return res.status(403).json({ error: 'Solo puedes crear empleados.' });
    cafeteriaId = yo.cafeteriaId;
  }
  if (!['duena', 'empleado', 'admin'].includes(rol)) return res.status(400).json({ error: 'Rol inválido.' });
  const n = String(nombre).trim().replace(/\s+/g, ' ');
  const e = String(email).trim().toLowerCase();
  if (n.length < 5) return res.status(400).json({ error: 'Escribe el nombre completo.' });
  if (!RE_EMAIL_UDB.test(e)) return res.status(400).json({ error: 'Usa un correo institucional @udb.edu.sv.' });
  if (db().usuarios.some((u) => u.email.toLowerCase() === e)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo.' });
  const err = validarPassword(password);
  if (err) return res.status(400).json({ error: err });
  if (rol !== 'admin' && !db().cafeterias.some((c) => c.id === cafeteriaId)) return res.status(400).json({ error: 'Selecciona una cafetería válida.' });
  const u = {
    id: nuevoId('u'), nombre: n, email: e, rol, cafeteriaId: rol === 'admin' ? null : cafeteriaId,
    passwordHash: bcrypt.hashSync(password, 10), activo: true, creadoEn: new Date().toISOString(),
  };
  db().usuarios.push(u);
  guardar();
  res.status(201).json(publico(u));
});

app.put('/api/usuarios/:id', requiere('admin', 'duena'), (req, res) => {
  const yo = req.usuario;
  const u = db().usuarios.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (yo.rol === 'duena' && !(u.rol === 'empleado' && u.cafeteriaId === yo.cafeteriaId)) {
    return res.status(403).json({ error: 'Solo puedes editar a los empleados de tu cafetería.' });
  }
  const b = req.body || {};
  const cambios = {};

  if (b.nombre !== undefined) {
    const n = String(b.nombre).trim().replace(/\s+/g, ' ');
    if (n.length < 5) return res.status(400).json({ error: 'Escribe el nombre completo.' });
    cambios.nombre = n;
  }
  if (b.email !== undefined) {
    const e = String(b.email).trim().toLowerCase();
    if (!RE_EMAIL_UDB.test(e)) return res.status(400).json({ error: 'Usa un correo institucional @udb.edu.sv.' });
    if (db().usuarios.some((x) => x.id !== u.id && x.email.toLowerCase() === e)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo.' });
    cambios.email = e;
  }
  if (b.carnet !== undefined && u.rol === 'cliente' && yo.rol === 'admin') {
    const c = normalizarCarnet(b.carnet);
    if (!RE_CARNET.test(c)) return res.status(400).json({ error: 'El carné debe tener 2 letras y 6 números.' });
    if (db().usuarios.some((x) => x.id !== u.id && x.carnet === c)) return res.status(409).json({ error: 'Ya existe una cuenta con ese carné.' });
    cambios.carnet = c;
  }
  if (yo.rol === 'admin' && u.rol !== 'cliente') {
    if (b.rol !== undefined) {
      if (!['admin', 'duena', 'empleado'].includes(b.rol)) return res.status(400).json({ error: 'Rol inválido.' });
      if (u.id === yo.id && b.rol !== 'admin') return res.status(400).json({ error: 'No puedes quitarte el rol de administración.' });
      cambios.rol = b.rol;
    }
    const rolFinal = cambios.rol || u.rol;
    if (rolFinal === 'admin') cambios.cafeteriaId = null;
    else {
      const cid = b.cafeteriaId !== undefined ? b.cafeteriaId : u.cafeteriaId;
      if (!db().cafeterias.some((c) => c.id === cid)) return res.status(400).json({ error: 'Selecciona una cafetería válida.' });
      cambios.cafeteriaId = cid;
    }
  }
  if (b.password) {
    const err = validarPassword(b.password);
    if (err) return res.status(400).json({ error: err });
    cambios.passwordHash = bcrypt.hashSync(b.password, 10);
  }
  Object.assign(u, cambios);
  guardar();
  res.json(publico(u));
});

app.patch('/api/usuarios/:id/estado', requiere('admin', 'duena'), (req, res) => {
  const yo = req.usuario;
  const u = db().usuarios.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (u.id === yo.id) return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' });
  if (yo.rol === 'duena' && !(u.rol === 'empleado' && u.cafeteriaId === yo.cafeteriaId)) {
    return res.status(403).json({ error: 'Solo puedes gestionar a los empleados de tu cafetería.' });
  }
  u.activo = Boolean(req.body?.activo);
  guardar();
  res.json(publico(u));
});

// ---------- métricas ----------
app.get('/api/metricas/cafeteria', requiere('admin', 'duena'), (req, res) => {
  const caf = cafeteriaDelPersonal(req, res, req.query.id);
  if (!caf) return;
  const dias = Math.min(90, Math.max(7, Number(req.query.dias) || 30));
  res.json({ cafeteria: caf, ...metricasCafeterias(db(), [caf.id], dias) });
});

app.get('/api/metricas/global', requiere('admin'), (req, res) => {
  const dias = Math.min(90, Math.max(7, Number(req.query.dias) || 30));
  const m = metricasCafeterias(db(), db().cafeterias.map((c) => c.id), dias);
  const participantes = m.clientes.totalParticipantes;
  const registrados = db().usuarios.filter((u) => u.rol === 'cliente').length;
  // Uso semanal promedio de cada participante activo en las últimas 4 semanas (insumo del simulador)
  const desde = sumarDias(diaSV(), -27);
  const ult = db().registros.filter((r) => diaSV(r.fecha) >= desde);
  const activos4 = new Set(ult.map((r) => r.clienteId)).size;
  res.json({
    ...m,
    adopcion: {
      poblacion: CONFIG.POBLACION_OBJETIVO,
      registrados,
      participantes,
      tasa: redondear((participantes / CONFIG.POBLACION_OBJETIVO) * 100, 2),
      usosSemanalesPorParticipante: activos4 ? redondear(ult.length / activos4 / 4, 2) : 0,
    },
  });
});

app.get('/api/metricas/yo', requiere('cliente'), (req, res) => {
  res.json(metricasCliente(db(), req.usuario.id));
});

// ---------- administración de la demo ----------
app.post('/api/admin/restaurar', requiere('admin'), (req, res) => {
  restaurar();
  res.json({ ok: true, registros: db().registros.length });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// ---------- frontend ----------
const DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  app.get('/{*ruta}', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error inesperado.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Trae tu Tupper escuchando en http://localhost:${PORT}`));
