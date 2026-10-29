import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import Escaner from '../../components/Escaner.jsx';
import { Icono, useDatos, useToast } from '../../components/ui.jsx';
import { describirRegla, dinero, numero, previsualizar } from '../../util.js';

const iniciales = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function Registrar() {
  const { cafeteria, refrescar } = useAuth();
  const [modo, setModo] = useState('manual');
  const [carnet, setCarnet] = useState('');
  const [ficha, setFicha] = useState(null);
  const [monto, setMonto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [toast, avisar] = useToast();
  const { datos: hoy, recargar: recargarHoy } = useDatos('/registros/hoy');
  const refMonto = useRef(null);
  const refCarnet = useRef(null);

  // La regla puede cambiar mientras el empleado trabaja: refrescar la cafetería al entrar
  useEffect(() => { refrescar().catch(() => {}); }, [refrescar]);

  const buscar = useCallback(async (texto) => {
    setError(null);
    setOcupado(true);
    setEscaneando(false);
    try {
      const d = await api(`/clientes/${encodeURIComponent(texto.trim())}`);
      setFicha(d);
      setMonto('');
      setTimeout(() => refMonto.current?.focus(), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }, []);

  const confirmar = async () => {
    setError(null);
    setOcupado(true);
    try {
      const d = await api('/registros', { metodo: 'POST', cuerpo: { carnet: ficha.cliente.carnet, monto: ficha.requiereMonto ? monto : monto || null } });
      setResultado(d);
      setFicha(null);
      recargarHoy();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const siguiente = () => {
    setResultado(null);
    setFicha(null);
    setCarnet('');
    setMonto('');
    setError(null);
    if (modo === 'qr') setEscaneando(true);
    else setTimeout(() => refCarnet.current?.focus(), 50);
  };

  const sinTupper = async (delta) => {
    try {
      await api('/ventas-sin-tupper', { metodo: 'POST', cuerpo: { delta } });
      recargarHoy();
      avisar(delta > 0 ? 'Venta sin tupper registrada' : 'Se quitó una venta sin tupper');
    } catch (e) {
      avisar(e.message);
    }
  };

  const regla = ficha?.regla || cafeteria?.regla;
  const vista = ficha ? previsualizar(ficha.regla, monto, ficha.usosHoy) : null;
  const montoValido = !ficha?.requiereMonto || Number(monto) > 0;

  return (
    <div className="contenido-angosto">
      <div className="encabezado">
        <div>
          <h1>Registrar tupper</h1>
          <p>{cafeteria?.nombre}{regla ? `: ${describirRegla(regla)}` : ''}</p>
        </div>
      </div>

      {cafeteria && !cafeteria.activa && (
        <div className="aviso aviso-alerta">La administración desactivó temporalmente esta cafetería. No se pueden hacer registros.</div>
      )}
      {regla && !regla.activo && (
        <div className="aviso aviso-info">El descuento está pausado. Los tuppers se siguen registrando como impacto ambiental, pero sin descuento.</div>
      )}
      {error && <div className="aviso aviso-error" role="alert">{error}</div>}

      {resultado ? (
        <div className="panel confirmacion" aria-live="assertive">
          <div className="sello"><Icono nombre="check" tamano={40} /></div>
          {resultado.registro.descuento > 0 ? (
            <>
              <div className="texto-suave">Descuento aplicado</div>
              <div className="monto-descuento">−{dinero(resultado.registro.descuento)}</div>
              {resultado.registro.total != null && <p style={{ fontSize: '1.2rem' }}>Cobrar <b>{dinero(resultado.registro.total)}</b></p>}
            </>
          ) : (
            <>
              <h2>Tupper registrado</h2>
              <p className="texto-suave">Sin descuento: {resultado.registro.motivoSinDescuento?.toLowerCase()}.</p>
              {resultado.registro.total != null && <p style={{ fontSize: '1.2rem' }}>Cobrar <b>{dinero(resultado.registro.total)}</b></p>}
            </>
          )}
          <p className="texto-suave">
            Reutilización número {resultado.impactoCliente.usos} de {resultado.cliente.nombre.split(' ')[0]}. En total ha evitado {numero(resultado.impactoCliente.gramos)} g de poliestireno.
          </p>
          <button className="btn btn-grande" onClick={siguiente} autoFocus>Siguiente cliente</button>
        </div>
      ) : ficha ? (
        <div className="panel">
          <div className="cliente-ficha">
            <div className="avatar" aria-hidden="true">{iniciales(ficha.cliente.nombre)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ficha.cliente.nombre}</div>
              <div className="texto-suave pequeno">{ficha.cliente.carnet}, {ficha.cliente.tipoCliente}</div>
            </div>
          </div>
          <p className="pequeno texto-suave" style={{ marginTop: '0.75rem' }}>
            Será su reutilización número {ficha.totalUsos + 1}.{ficha.usosHoy > 0 && ` Hoy ya registró ${ficha.usosHoy} ${ficha.usosHoy === 1 ? 'vez' : 'veces'} en esta cafetería.`}
          </p>

          {ficha.requiereMonto && (
            <div className="campo" style={{ marginTop: '1rem' }}>
              <label htmlFor="monto">Total de la compra</label>
              <input id="monto" ref={refMonto} className="input input-grande" inputMode="decimal" type="number" min="0" step="0.05"
                placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && montoValido && confirmar()} />
            </div>
          )}

          {vista && (
            <div className="desglose">
              {monto !== '' && <><span>Compra</span><span>{dinero(Number(monto))}</span></>}
              <span>Descuento</span><span className={vista.descuento > 0 ? 'sube' : ''}>{vista.descuento > 0 ? `−${dinero(vista.descuento)}` : dinero(0)}</span>
              {vista.total != null && <><span className="total">A cobrar</span><span className="total">{dinero(vista.total)}</span></>}
            </div>
          )}
          {vista?.motivo && <div className="aviso aviso-info">{vista.motivo}. El tupper igual cuenta como envase evitado.</div>}

          <div className="rejilla" style={{ marginTop: '0.5rem' }}>
            <button className="btn btn-hoja btn-grande" onClick={confirmar} disabled={ocupado || !montoValido || !cafeteria?.activa}>
              {ocupado ? 'Registrando…' : 'Confirmar tupper'}
            </button>
            <button className="btn btn-secundario" onClick={siguiente}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="pestanas" role="tablist">
            <button role="tab" aria-selected={modo === 'manual'} onClick={() => { setModo('manual'); setEscaneando(false); }}>Escribir carné</button>
            <button role="tab" aria-selected={modo === 'qr'} onClick={() => setModo('qr')}>Escanear QR</button>
          </div>

          {modo === 'qr' ? (
            escaneando ? (
              <Escaner onLeido={buscar} />
            ) : (
              <div className="vacio">
                <p>El cliente muestra el QR de su carné virtual desde la app o impreso.</p>
                <button className="btn btn-grande" onClick={() => setEscaneando(true)}><Icono nombre="escanear" />Activar cámara</button>
              </div>
            )
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (carnet.trim()) buscar(carnet); }}>
              <div className="campo">
                <label htmlFor="carnet">Número de carné del cliente</label>
                <input id="carnet" ref={refCarnet} className="input input-grande" value={carnet} maxLength={8} autoComplete="off"
                  onChange={(e) => setCarnet(e.target.value.toUpperCase())} placeholder="HM250117" autoCapitalize="characters" />
              </div>
              <button className="btn btn-grande" disabled={ocupado || carnet.trim().length < 3}>{ocupado ? 'Buscando…' : 'Buscar cliente'}</button>
            </form>
          )}
        </div>
      )}

      <div className="panel">
        <div className="contador-sin">
          <div>
            <h3 style={{ margin: 0 }}>Ventas sin tupper hoy</h3>
            <p className="pequeno texto-suave" style={{ margin: 0 }}>Toca + en cada venta con desechable. Sirve para medir la proporción de ventas con tupper.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button className="btn btn-secundario" onClick={() => sinTupper(-1)} aria-label="Quitar una venta sin tupper" disabled={!hoy?.sinTupper}>−</button>
            <span className="cifra" aria-live="polite">{hoy?.sinTupper ?? '–'}</span>
            <button className="btn btn-secundario" onClick={() => sinTupper(1)} aria-label="Sumar una venta sin tupper" disabled={!cafeteria?.activa}>+</button>
          </div>
        </div>
        {hoy && (
          <p className="pequeno texto-suave" style={{ margin: '0.75rem 0 0' }}>
            Hoy en esta cafetería: {hoy.resumen.envases} tuppers, {numero(hoy.resumen.gramos)} g de poliestireno evitados y {dinero(hoy.resumen.descuentos)} en descuentos.
          </p>
        )}
      </div>
      {toast}
    </div>
  );
}
