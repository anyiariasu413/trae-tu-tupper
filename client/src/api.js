const CLAVE = 'ttt_token';

export const tokenGuardado = () => {
  try { return localStorage.getItem(CLAVE); } catch { return null; }
};
export const guardarToken = (t) => {
  try { t ? localStorage.setItem(CLAVE, t) : localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
};

export class ErrorApi extends Error {
  constructor(mensaje, estado) { super(mensaje); this.estado = estado; }
}

let alExpirar = () => {};
export const alCerrarSesion = (fn) => { alExpirar = fn; };

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const headers = {};
  const token = tokenGuardado();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api${ruta}`, { method: metodo, headers, body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0);
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) alExpirar();
    throw new ErrorApi(datos.error || 'No se pudo completar la acción.', res.status);
  }
  return datos;
}
