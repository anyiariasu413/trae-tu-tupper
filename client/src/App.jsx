import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Cargando } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import { RUTA_INICIO } from './util.js';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';

const Registrar = lazy(() => import('./pages/empleado/Registrar.jsx'));
const Hoy = lazy(() => import('./pages/empleado/Hoy.jsx'));
const PanelDuena = lazy(() => import('./pages/duena/Panel.jsx'));
const Reglas = lazy(() => import('./pages/duena/Reglas.jsx'));
const Equipo = lazy(() => import('./pages/duena/Equipo.jsx'));
const PanelAdmin = lazy(() => import('./pages/admin/Panel.jsx'));
const Simulador = lazy(() => import('./pages/admin/Simulador.jsx'));
const Cafeterias = lazy(() => import('./pages/admin/Cafeterias.jsx'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios.jsx'));
const Carne = lazy(() => import('./pages/cliente/Carne.jsx'));
const Impacto = lazy(() => import('./pages/cliente/Impacto.jsx'));
const Historial = lazy(() => import('./pages/cliente/Historial.jsx'));
const Cuenta = lazy(() => import('./pages/Cuenta.jsx'));

function Protegida({ roles }) {
  const { usuario, cargando } = useAuth();
  const loc = useLocation();
  if (cargando) return <Cargando texto="Abriendo tu sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: loc.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<Protegida />}>
        <Route path="/cuenta" element={<Cuenta />} />
      </Route>
      <Route element={<Protegida roles={['empleado']} />}>
        <Route path="/empleado" element={<Registrar />} />
        <Route path="/empleado/hoy" element={<Hoy />} />
      </Route>
      <Route element={<Protegida roles={['duena']} />}>
        <Route path="/duena" element={<PanelDuena />} />
        <Route path="/duena/reglas" element={<Reglas />} />
        <Route path="/duena/registrar" element={<Registrar />} />
        <Route path="/duena/equipo" element={<Equipo />} />
      </Route>
      <Route element={<Protegida roles={['admin']} />}>
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/admin/simulador" element={<Simulador />} />
        <Route path="/admin/cafeterias" element={<Cafeterias />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
      </Route>
      <Route element={<Protegida roles={['cliente']} />}>
        <Route path="/cliente" element={<Carne />} />
        <Route path="/cliente/impacto" element={<Impacto />} />
        <Route path="/cliente/historial" element={<Historial />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
