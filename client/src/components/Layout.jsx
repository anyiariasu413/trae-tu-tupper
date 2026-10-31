import { Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Cargando, Icono, Logo } from './ui.jsx';
import { ROL_NOMBRE } from '../util.js';

const MENUS = {
  empleado: [
    { a: '/empleado', texto: 'Registrar', icono: 'escanear', fin: true },
    { a: '/empleado/hoy', texto: 'Hoy', icono: 'lista' },
    { a: '/cuenta', texto: 'Cuenta', icono: 'usuarios' },
  ],
  duena: [
    { a: '/duena', texto: 'Panel', icono: 'panel', fin: true },
    { a: '/duena/reglas', texto: 'Descuento', icono: 'ajustes' },
    { a: '/duena/registrar', texto: 'Registrar', icono: 'escanear' },
    { a: '/duena/equipo', texto: 'Equipo', icono: 'equipo' },
  ],
  admin: [
    { a: '/admin', texto: 'Panel', icono: 'panel', fin: true },
    { a: '/admin/simulador', texto: 'Proyección', icono: 'simulador' },
    { a: '/admin/cafeterias', texto: 'Cafeterías', icono: 'tienda' },
    { a: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { a: '/admin/parametros', texto: 'Parámetros', icono: 'hoja' },
  ],
  cliente: [
    { a: '/cliente', texto: 'Mi carné', icono: 'carne', fin: true },
    { a: '/cliente/impacto', texto: 'Mi impacto', icono: 'hoja' },
    { a: '/cliente/historial', texto: 'Historial', icono: 'reloj' },
    { a: '/cuenta', texto: 'Cuenta', icono: 'usuarios' },
  ],
};

export default function Layout() {
  const { usuario, cafeteria, salir } = useAuth();
  const navegar = useNavigate();
  const menu = MENUS[usuario.rol] || [];
  const cerrar = () => { salir(); navegar('/'); };
  const subtitulo = cafeteria ? cafeteria.nombre : ROL_NOMBRE[usuario.rol];

  return (
    <div className="app">
      <header className="barra">
        <Link to="/" className="marca" aria-label="Trae tu Tupper, inicio">
          <Logo />
          <div><strong>Trae tu Tupper</strong><span>Universidad Don Bosco</span></div>
        </Link>
        <div className="barra-usuario">
          <div className="quien">
            <span className="oculto-movil">{usuario.nombre}</span>
            <small>{subtitulo}</small>
          </div>
          <button className="btn btn-secundario" onClick={cerrar} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icono nombre="salir" tamano={18} /><span className="oculto-movil">Salir</span>
          </button>
        </div>
      </header>
      <div className="cuerpo">
        <nav className="lateral" aria-label="Navegación principal">
          {menu.map((m) => (
            <NavLink key={m.a} to={m.a} end={m.fin} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={m.icono} />{m.texto}
            </NavLink>
          ))}
          {usuario.rol !== 'cliente' && usuario.rol !== 'empleado' && (
            <NavLink to="/cuenta" className={({ isActive }) => (isActive ? 'activo' : '')}><Icono nombre="usuarios" />Mi cuenta</NavLink>
          )}
          <div className="pie-lateral">Sesión: {ROL_NOMBRE[usuario.rol]}</div>
        </nav>
        <main className="contenido" id="contenido">
          <Suspense fallback={<Cargando />}><Outlet /></Suspense>
        </main>
      </div>
      <nav className="nav-movil" aria-label="Navegación principal">
        {menu.map((m) => (
          <NavLink key={m.a} to={m.a} end={m.fin} className={({ isActive }) => (isActive ? 'activo' : '')}>
            <Icono nombre={m.icono} />{m.texto}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
