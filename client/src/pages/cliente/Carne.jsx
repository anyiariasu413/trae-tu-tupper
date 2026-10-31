import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../auth.jsx';
import { useDatos } from '../../components/ui.jsx';
import { DATOS, describirRegla, dinero, numero } from '../../util.js';

export default function Carne() {
  const { usuario } = useAuth();
  const loc = useLocation();
  const { datos: m } = useDatos('/metricas/yo', { cada: 15000 });
  const { datos: cafes } = useDatos('/public/cafeterias');
  const dato = useMemo(() => DATOS[Math.floor(Math.random() * DATOS.length)], []);

  return (
    <div className="contenido-angosto">
      {loc.state?.nuevo && (
        <div className="aviso aviso-ok no-imprimir">Tu cuenta está lista. Muestra este código en la caja cuando pidas tu comida en tu tupper.</div>
      )}

      <div className="carne">
        <div className="carne-tapa" aria-hidden="true" />
        <div className="carne-cabecera">
          <div><strong>Universidad Don Bosco</strong>Trae tu Tupper</div>
          <div style={{ textTransform: 'capitalize' }}>{usuario.tipoCliente}</div>
        </div>
        <div className="carne-qr">
          <QRCodeSVG value={`UDB-TUPPER:${usuario.carnet}`} size={196} level="M" fgColor="#152238" title={`Código QR del carné ${usuario.carnet}`} />
        </div>
        <div className="carne-frase">Mi tupper, mi compromiso</div>
        <div className="carne-nombre">{usuario.nombre}</div>
        <div className="carne-numero">{usuario.carnet}</div>
      </div>

      <p className="pequeno texto-suave no-imprimir" style={{ textAlign: 'center', marginTop: '0.9rem' }}>
        Si no puedes mostrar el código, dicta tu número de carné en la caja.{' '}
        <button className="btn-texto btn" style={{ minHeight: 0, padding: '0 0.25rem' }} onClick={() => window.print()}>Imprimir carné</button>
      </p>

      {m && (
        <Link to="/cliente/impacto" className="panel no-imprimir" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginTop: '1rem' }}>
          <div className="panel-titulo"><h3>Tu impacto</h3><span className="pequeno" style={{ color: 'var(--tapa)' }}>Ver detalle</span></div>
          {m.usos === 0 ? (
            <p className="texto-suave" style={{ margin: 0 }}>Aún no registras tu primer tupper. Lleva el tuyo al chalet y estrena tu carné.</p>
          ) : (
            <div className="tira" style={{ '--cols': 3, marginBottom: 0 }}>
              <div><div className="kpi-valor">{numero(m.usos)}</div><div className="kpi-etiqueta">tuppers</div></div>
              <div><div className="kpi-valor">{numero(m.gramos)}<small>g</small></div><div className="kpi-etiqueta">de poliestireno evitado</div></div>
              <div><div className="kpi-valor">{dinero(m.ahorro)}</div><div className="kpi-etiqueta">ahorrado</div></div>
            </div>
          )}
        </Link>
      )}

      {cafes && (
        <div className="panel no-imprimir">
          <h3>Descuentos por cafetería</h3>
          <ul className="lista">
            {cafes.map((c) => (
              <li key={c.id}>
                <div><div className="principal">{c.nombre}</div><div className="secundario">{c.ubicacion}</div></div>
                <div style={{ textAlign: 'right', maxWidth: '55%' }} className="pequeno">
                  {!c.activa ? <span className="chip chip-ambar">Cerrada temporalmente</span>
                    : c.regla.activo ? describirRegla(c.regla) : <span className="chip">Descuento en pausa</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <blockquote className="dato no-imprimir" style={{ margin: '1.25rem 0 0' }}>
        <p>{dato.texto}</p>
        <cite>{dato.fuente}</cite>
      </blockquote>
    </div>
  );
}
