// Regenera los datos de demostración: npm run reset
import { restaurar } from './db.js';
restaurar();
setTimeout(() => process.exit(0), 50);
