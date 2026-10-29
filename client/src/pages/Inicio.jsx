import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Logo, Unidades, useDatos } from '../components/ui.jsx';
import { Barras } from '../components/Graficos.jsx';
import { DATOS, RUTA_INICIO, diaCorto, dinero, fechaLarga, numero } from '../util.js';

function Copiar({ texto }) {
  const [ok, setOk] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* sin portapapeles */ }
  };
  return <button className="copiar" onClick={copiar} aria-label={`Copiar ${texto}`}>{ok ? 'Copiado' : 'Copiar'}</button>;
}

export default function Inicio() {
  const { usuario } = useAuth();
  const { datos: impacto, error } = useDatos('/public/impacto', { cada: 30000 });
  const { datos: guia } = useDatos('/public/guia');
  const [lento, setLento] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLento(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const semanas = impacto?.porSemana.map((s, i, arr) => ({
    semana: `${diaCorto(s.semana)}${i === arr.length - 1 ? ' (en curso)' : ''}`,
    envases: s.envases,
  })) || [];

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
            <a className="btn btn-secundario" href="#guia">Guía para evaluar la plataforma</a>
          </div>
        </div>

        <div className="contador" aria-live="polite">
          {!impacto && !error && (
            <p className="texto-suave">{lento ? 'Conectando con el servidor. La primera carga puede tardar unos segundos…' : 'Cargando el impacto acumulado…'}</p>
          )}
          {error && <p className="texto-suave">No se pudo cargar el impacto en este momento.</p>}
          {impacto && (
            <>
              <div className="contador-cifra">{numero(impacto.envases)}</div>
              <p className="contador-texto">
                envases de poliestireno evitados en las {impacto.cafeteriasActivas} cafeterías
                {impacto.desde && <> desde el {fechaLarga(impacto.desde)}</>}.
              </p>
              <Unidades total={impacto.envases} porIcono={25} max={140} />
              <div className="contador-pie">
                <div><b>{numero(impacto.kg, 1)} kg</b>de poliestireno</div>
                <div><b>{numero(impacto.co2eKg, 1)} kg</b>de CO₂e</div>
                <div><b>{numero(impacto.participantes)}</b>personas participando</div>
                <div><b>{numero(impacto.pctConTupperRecientes, 1)} %</b>de las ventas recientes, con tupper</div>
              </div>
            </>
          )}
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
            <div className="rejilla" style={{ marginTop: '1.25rem' }}>
              {DATOS.slice(0, 3).map((d) => (
                <blockquote key={d.texto} className="dato" style={{ margin: 0 }}>
                  <p>{d.texto}</p>
                  <cite>{d.fuente}</cite>
                </blockquote>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-titulo"><h3>Envases evitados por semana</h3></div>
            {semanas.length ? <Barras datos={semanas} x="semana" series={[{ clave: 'envases', nombre: 'Envases evitados', color: '#16804F' }]} alto={260} /> : <p className="texto-suave">Sin datos todavía.</p>}
            {impacto && <p className="pequeno texto-suave" style={{ marginTop: '0.5rem' }}>Descuentos otorgados a la comunidad: {dinero(impacto.descuentosOtorgados)}.</p>}
          </div>
        </div>
      </section>

      <section className="seccion seccion-gris" id="guia">
        <h2>Guía para evaluar la plataforma</h2>
        <p className="medida texto-suave">
          La plataforma está cargada con 8 semanas de actividad simulada en las tres cafeterías para que los paneles muestren datos reales de uso.
          Puedes entrar con cualquiera de estas cuentas de prueba o crear tu propia cuenta de estudiante.
        </p>
        <div className="rejilla rejilla-1-2" style={{ marginTop: '1rem', alignItems: 'start' }}>
          <div>
            <h3>Recorrido sugerido</h3>
            <ol className="recorrido">
              <li>Entra como <b>cliente</b> y abre tu carné virtual. Anota el número de carné.</li>
              <li>Cierra sesión y entra como <b>empleado</b>. Elige “Escribir carné”, ingresa ese número y un monto de compra.</li>
              <li>Entra como <b>dueña</b>: el registro aparece en su panel. Cambia la regla de descuento y repite el paso 2 para ver el efecto.</li>
              <li>Entra como <b>administración</b> para ver el consolidado de las tres cafeterías y el simulador de proyección.</li>
            </ol>
            <p className="pequeno texto-suave">Para probar el escáner, abre el carné virtual en un celular y el panel del empleado en otro dispositivo con cámara.</p>
          </div>
          <div className="credenciales">
            {guia?.credenciales.map((c) => (
              <div className="credencial" key={c.rol}>
                <h3>{c.rol}</h3>
                <div className="pequeno texto-suave">{c.descripcion}</div>
                <dl>
                  <dt>Correo</dt><dd>{c.email} <Copiar texto={c.email} /></dd>
                  {c.carnet && <><dt>Carné</dt><dd>{c.carnet} <Copiar texto={c.carnet} /></dd></>}
                  <dt>Clave</dt><dd>{c.password} <Copiar texto={c.password} /></dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="pie">
        Proyecto académico de la materia Gestión Ambiental. Universidad Don Bosco, campus Soyapango, 2026.
        <br />Supuestos de cálculo: 15.5 g de poliestireno por envase y 0.0031 kg CO₂e por gramo.
      </footer>
    </div>
  );
}
