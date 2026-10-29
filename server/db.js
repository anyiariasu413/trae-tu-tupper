// Persistencia en un archivo JSON (server/data/db.json).
// Los datos viven en memoria y se escriben al disco de forma atómica.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarDatos } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = null;
let timer = null;

export function cargar() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log(`[db] Cargado ${DB_FILE} (${db.registros.length} registros)`);
      return db;
    } catch (e) {
      console.error('[db] db.json dañado, se regenera:', e.message);
    }
  }
  return restaurar();
}

export function restaurar() {
  db = generarDatos(new Date());
  escribirAhora();
  console.log(`[db] Datos de demostración generados (${db.registros.length} registros)`);
  return db;
}

export function getDb() {
  return db;
}

function escribirAhora() {
  const tmp = DB_FILE + '.tmp';
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

/** Programa una escritura a disco (agrupa cambios seguidos) */
export function guardar() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { escribirAhora(); } catch (e) { console.error('[db] Error al guardar:', e.message); }
  }, 250);
}

export function nuevoId(prefijo) {
  db.meta.seq = (db.meta.seq || 0) + 1;
  return `${prefijo}-${db.meta.seq}-${Date.now().toString(36)}`;
}
