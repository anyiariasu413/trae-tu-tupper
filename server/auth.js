import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

const SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[auth] JWT_SECRET no definido: se usa un secreto temporal (las sesiones se cierran al reiniciar).');
  return crypto.randomBytes(32).toString('hex');
})();

export function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, SECRET, { expiresIn: '12h' });
}

export function publico(u) {
  if (!u) return null;
  const { passwordHash, ...resto } = u;
  return resto;
}

/** Middleware: exige sesión válida y, opcionalmente, uno de los roles indicados */
export function requiere(...roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch {
      return res.status(401).json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
    }
    const usuario = getDb().usuarios.find((u) => u.id === payload.sub);
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Usuario no disponible.' });
    if (roles.length && !roles.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    }
    req.usuario = usuario;
    next();
  };
}

// Limitador simple de intentos de inicio de sesión (por IP)
const intentos = new Map();
export function limitarLogin(req, res, next) {
  const ip = req.ip || 'x';
  const ahora = Date.now();
  const lista = (intentos.get(ip) || []).filter((t) => ahora - t < 60_000);
  if (lista.length >= 10) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' });
  }
  lista.push(ahora);
  intentos.set(ip, lista);
  next();
}
