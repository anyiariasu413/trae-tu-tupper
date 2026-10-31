import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Envase, Icono, Logo, useDatos } from '../components/ui.jsx';
import { DATOS, RUTA_INICIO, numero } from '../util.js';
function Copiar({ texto }) {
  const [ok, setOk] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* sin portapapeles */ }
  };
  return <button className="copiar" onClick={copiar} aria-label={`Copiar ${texto}`}>{ok ? 'Copiado' : 'Copiar'}</button>;
}

const BENEFICIOS = [
  { icono: 'hoja', tono: 'hoja', titulo: 'Menos poliestireno',
    texto: 'Cada tupper es un envase de espuma que no se fabrica ni termina en la basura del campus.' },
  { icono: 'etiqueta', tono: 'sol', titulo: 'Ahorro para ti',
    texto: 'Cada chalet define su descuento y se aplica al instante en la caja al mostrar tu carné.' },
  { icono: 'tienda', tono: 'tapa', titulo: 'Chalets que ganan',
    texto: 'Menos gasto en desechables y clientes que vuelven por su beneficio.' },
  { icono: 'panel', tono: 'tinta', titulo: 'Impacto medible',
    texto: 'Cada uso queda registrado: la universidad sabe cuántos envases se evitan y dónde.' },
];

const ROLES = [
  { rol: 'Administrador', nombre: 'Administración UDB', icono: 'panel', tono: 'tinta',
    puede: ['Crea y desactiva cafeterías.', 'Crea cuentas de dueñas, empleados y otros administradores.', 'Ve el consolidado del campus y proyecta escenarios.'] },
  { rol: 'Dueña', nombre: 'Dueña de cafetería', icono: 'tienda', tono: 'tapa',
    puede: ['Define el descuento de su cafetería.', 'Crea las cuentas de sus empleados.', 'Ve las métricas de su cafetería.'] },
  { rol: 'Empleado', nombre: 'Empleado', icono: 'escanear', tono: 'sol',
    puede: ['Escanea el QR o escribe el carné.', 'Registra el tupper y aplica el descuento.', 'Revisa los registros del día.'] },
  { rol: 'Cliente', nombre: 'Estudiante o personal UDB', icono: 'carne', tono: 'hoja',
    puede: ['Crea su cuenta con su carné.', 'Muestra su carné virtual con QR.', 'Consulta su impacto, ahorro e historial.'] },
];

const FLUJO = [
  { rol: 'Administración', tono: 'tinta', titulo: 'Crea una cafetería nueva',
    texto: 'Entra con la cuenta de administración y abre Cafeterías. Toca "Nueva cafetería" y ponle un nombre, por ejemplo "Chalet de Prueba".' },
  { rol: 'Administración', tono: 'tinta', titulo: 'Crea a la dueña o dueño',
    texto: 'En Usuarios, toca "Agregar personal", elige el rol "Dueña de cafetería" y asígnale el chalet que acabas de crear. Anota el correo y la contraseña.' },
  { rol: 'Dueña', tono: 'tapa', titulo: 'Configura el descuento',
    texto: 'Cierra sesión y entra con la cuenta nueva. En Descuento, elige porcentaje o monto fijo, la compra mínima y cuántas veces al día aplica.' },
  { rol: 'Dueña', tono: 'tapa', titulo: 'Crea a un empleado',
    texto: 'En Equipo, toca "Agregar empleado". Esa cuenta queda ligada a tu cafetería.' },
  { rol: 'Empleado', tono: 'sol', titulo: 'Abre la caja',
    texto: 'Cierra sesión y entra con la cuenta del empleado. Verás la pantalla para registrar tuppers con la regla que definió la dueña.' },
  { rol: 'Estudiante', tono: 'hoja', titulo: 'Llega un estudiante con su tupper',
    texto: 'En otro dispositivo o en una ventana de incógnito, crea una cuenta de estudiante o usa la de prueba. Abre el carné virtual.' },
  { rol: 'Empleado y estudiante', tono: 'sol', titulo: 'Registra la compra',
    texto: 'Desde la cuenta del empleado, escanea el QR del carné (o escribe el número), ingresa el monto y confirma. El descuento aparece al instante, y el registro se refleja en el carné del estudiante y en el panel de la dueña.' },
];

export default function Inicio() {
  const { usuario } = useAuth();
  const { datos: guia } = useDatos('/public/guia');
  const { datos: cfg } = useDatos('/config');
  const gramos = cfg?.GRAMOS_POR_ENVASE ?? 15.5;
  const factor = cfg?.CO2E_KG_POR_GRAMO ?? 0.0031;


  return (
    <div className="publico">
      <header className="barra">
        <Link to="/" className="marca">
          <Logo />
          <div><strong>Trae tu Tupper</strong><span>Universidad Don Bosco</span></div>
        </Link>
        <div className="barra-usuario">
          {usuario ? (
            <Link className="btn" to={RUTA_INICIO[usuario.rol]}>Ir a mi panel</Link>
          ) : (
            <>
              <Link className="btn btn-texto" to="/login">Iniciar sesión</Link>
              <Link className="btn oculto-movil" to="/registro">Crear cuenta</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>Tu tupper vale un descuento en los chalets de la UDB.</h1>
          <p className="bajada">
            Pide tu comida en un recipiente propio, muestra tu carné virtual y la cafetería te descuenta en el momento.
            Cada vez que lo haces, el sistema cuenta un envase de poliestireno que no terminó en la basura.
          </p>
          <div className="hero-acciones">
            {!usuario && <Link className="btn btn-hoja" to="/registro">Crear mi cuenta</Link>}
            <a className="btn btn-secundario" href="#guia">Guía para probar la aplicación</a>
          </div>
        </div>

        <div className="proposito">
          <h2 className="proposito-titulo">Un tupper, cuatro beneficios</h2>
          <ul className="beneficios">
            {BENEFICIOS.map((b) => (
              <li key={b.titulo} className={`beneficio beneficio-${b.tono}`}>
                <span className="beneficio-icono"><Icono nombre={b.icono} tamano={26} /></span>
                <div>
                  <h3>{b.titulo}</h3>
                  <p>{b.texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="proposito-cita">Reducir los residuos desde el origen, no después.</p>
        </div>
      </section>

      <section className="seccion seccion-gris">
        <h2>Cómo funciona</h2>
        <ol className="pasos">
          <li>
            <h3>Crea tu cuenta con tu carné</h3>
            <p className="texto-suave">Usa tu número de carné y tu correo institucional. La app genera tu carné virtual con un código QR.</p>
          </li>
          <li>
            <h3>Pide tu comida en tu tupper</h3>
            <p className="texto-suave">En la caja, el personal escanea tu QR o escribe tu carné. El descuento de esa cafetería se aplica al instante.</p>
          </li>
          <li>
            <h3>Mira tu impacto crecer</h3>
            <p className="texto-suave">Consulta cuántos envases has evitado, cuánto has ahorrado y cuándo tu tupper supera al desechable en impacto ambiental.</p>
          </li>
        </ol>
      </section>

      <section className="seccion">
        <div className="rejilla rejilla-2" style={{ alignItems: 'start' }}>
          <div>
            <h2>Por qué medirlo</h2>
            <p className="medida texto-suave">
              En 2023, estudiantes de la UDB impulsaron la campaña “Trae tu tupper” para promover los recipientes reutilizables (Guzmán, 2023).
              La campaña generó conciencia, pero no permitía saber cuántos envases se evitaban ni quién mantenía el hábito.
              Esta plataforma da continuidad a esa iniciativa con incentivos y datos verificables.
            </p>
              <figure className="foto-campana">
              <img src="/imagen.jpg" alt="Estudiantes de la UDB muestran sus recipientes reutilizables durante la campaña Trae tu tupper" loading="lazy" />
              <figcaption>Campaña “Trae tu tupper”, 2023. Foto: Universidad Don Bosco (Guzmán, 2023).</figcaption>
            </figure>
            <div className="rejilla" style={{ marginTop: '1.25rem' }}>
              {DATOS.slice(2, 4).map((d) => (
                <blockquote key={d.texto} className="dato" style={{ margin: 0 }}>
                  <p>{d.texto}</p>
                  <cite>{d.fuente}</cite>
                </blockquote>
              ))}
            </div>
          </div>
          <div className="comparacion">
            <h3 className="comparacion-titulo">Desechable o tupper</h3>
            <div className="comparacion-cols">
              <div className="lado lado-desechable">
                <div className="lado-icono" aria-hidden="true"><Envase evitado={false} /></div>
                <h4>Envase de poliestireno</h4>
                <ul>
                  <li>Se usa una vez, durante unos minutos.</li>
                  <li>Pesa unos 15.5 g que van directo a la basura.</li>
                  <li>Es difícil de reciclar y tarda siglos en degradarse.</li>
                </ul>
              </div>
              <div className="lado lado-tupper">
                <div className="lado-icono" aria-hidden="true"><Logo /></div>
                <h4>Tu tupper</h4>
                <ul>
                  <li>Se usa todos los días, por años.</li>
                  <li>Te da un descuento en cada compra.</li>
                  <li>Cada uso queda registrado como un envase evitado.</li>
                </ul>
              </div>
            </div>
            <div className="equivalencia">
              <b>37 usos</b>
              <p>es lo que necesita un tupper para superar al desechable en impacto ambiental (Snyder y Park, 2024). Con 37 usos, un solo tupper evita cerca de 573 g de poliestireno.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion seccion-gris" id="guia">
        <h2>Guía para probar la aplicación</h2>
        <p className="medida texto-suave">
          La aplicación tiene cuatro roles, cada uno con su propia pantalla. Las cuentas de prueba ya tienen 8 semanas de actividad simulada para que los paneles muestren datos.
        </p>

        <h3 className="guia-subtitulo">Roles de la aplicación</h3>
        <ul className="roles-lista">
          {ROLES.map((r) => {
            const c = guia?.credenciales.find((x) => x.rol.startsWith(r.rol));
            return (
              <li key={r.rol} className={`rol-tarjeta guia-${r.tono}`}>
                <div className="guia-cab">
                  <span className="guia-icono"><Icono nombre={r.icono} tamano={24} /></span>
                  <h4>{r.nombre}</h4>
                </div>
                <ul className="guia-tareas">
                  {r.puede.map((t) => <li key={t}>{t}</li>)}
                </ul>
                {c && (
                  <dl className="guia-cuenta">
                    <dt>{c.carnet ? 'Carné' : 'Correo'}</dt><dd>{c.carnet || c.email} <Copiar texto={c.carnet || c.email} /></dd>
                    <dt>Clave</dt><dd>{c.password} <Copiar texto={c.password} /></dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>

        <h3 className="guia-subtitulo">Flujo de prueba sugerido</h3>
        <div className="flujo-bloque">
          <div className="flujo-ilustraciones">
            <img src="/ilustraciones/caja-del-chalet.svg" alt="Tupper con pupusas sobre el mostrador del chalet, junto a un celular con el carné virtual y una etiqueta de descuento" width="400" height="300" loading="lazy" />
            <img src="/ilustraciones/ciclo-del-tupper.svg" alt="Ciclo del tupper: llenar en el chalet, escanear, comer y lavar, y volver a usar" width="400" height="300" loading="lazy" />
          </div>
          <div>
            <p className="medida texto-suave">Recorre el sistema completo, desde que la universidad abre una cafetería hasta la primera compra con tupper.</p>
            <ol className="flujo">
              {FLUJO.map((p) => (
                <li key={p.titulo} className={`flujo-paso guia-${p.tono}`}>
                  <span className="flujo-rol">{p.rol}</span>
                  <h4>{p.titulo}</h4>
                  <p>{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="guia-propia">
          <span className="guia-icono"><Icono nombre="usuarios" tamano={26} /></span>
          <div>
            <h3>Cualquiera puede crear su cuenta de estudiante</h3>
            <p>Solo necesita un número de carné (2 letras y 6 números) y un correo institucional. Las cuentas de dueña, empleado y administración solo las crea el personal autorizado.</p>
          </div>
          <Link className="btn btn-hoja" to="/registro">Crear mi cuenta</Link>
        </div>

        <p className="pequeno texto-suave" style={{ marginTop: '1rem' }}>
          Para probar el escáner, abre el carné en un celular y la cuenta de empleado en otro dispositivo con cámara.
        </p>
      </section>

      <footer className="pie">
        Proyecto académico de la materia Gestión Ambiental. Universidad Don Bosco, campus Soyapango, 2026.
        <br />Supuestos de cálculo: 15.5 g de poliestireno por envase y 0.0031 kg CO₂e por gramo.
      </footer>
    </div>
  );
}