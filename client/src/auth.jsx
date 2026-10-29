import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, guardarToken, tokenGuardado, alCerrarSesion } from './api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cafeteria, setCafeteria] = useState(null);
  const [cargando, setCargando] = useState(Boolean(tokenGuardado()));

  const salir = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
    setCafeteria(null);
  }, []);

  const refrescar = useCallback(async () => {
    const d = await api('/auth/yo');
    setUsuario(d.usuario);
    setCafeteria(d.cafeteria);
    return d.usuario;
  }, []);

  useEffect(() => {
    alCerrarSesion(salir);
    if (!tokenGuardado()) return;
    refrescar().catch(salir).finally(() => setCargando(false));
  }, [refrescar, salir]);

  const entrar = async (identificador, password) => {
    const d = await api('/auth/login', { metodo: 'POST', cuerpo: { identificador, password } });
    guardarToken(d.token);
    return refrescar();
  };

  const registrarse = async (datos) => {
    const d = await api('/auth/registro', { metodo: 'POST', cuerpo: datos });
    guardarToken(d.token);
    return refrescar();
  };

  return (
    <Ctx.Provider value={{ usuario, cafeteria, cargando, entrar, registrarse, salir, refrescar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
