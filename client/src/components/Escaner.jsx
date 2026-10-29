import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

/** Lector de QR con la cámara del dispositivo */
export default function Escaner({ onLeido }) {
  const lector = useRef(null);
  const leido = useRef(false);
  const [estado, setEstado] = useState('iniciando');

  useEffect(() => {
    let cancelado = false;
    const qr = new Html5Qrcode('lector-qr', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
    lector.current = qr;
    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.64); return { width: s, height: s }; } },
      (texto) => {
        if (leido.current) return;
        leido.current = true;
        if (navigator.vibrate) navigator.vibrate(80);
        onLeido(texto);
      },
      () => {},
    ).then(() => { if (!cancelado) setEstado('activo'); })
      .catch(() => { if (!cancelado) setEstado('sin-camara'); });

    return () => {
      cancelado = true;
      const q = lector.current;
      if (q && q.isScanning) q.stop().then(() => q.clear()).catch(() => {});
    };
  }, [onLeido]);

  return (
    <div>
      <div className="lector">
        <div id="lector-qr" />
      </div>
      {estado === 'iniciando' && <p className="texto-suave pequeno" style={{ textAlign: 'center' }}>Activando la cámara. Si el navegador lo pide, permite el acceso.</p>}
      {estado === 'activo' && <p className="texto-suave pequeno" style={{ textAlign: 'center' }}>Apunta al código QR del carné virtual del cliente.</p>}
      {estado === 'sin-camara' && (
        <div className="aviso aviso-alerta">No se pudo usar la cámara de este dispositivo. Revisa los permisos del navegador o usa “Escribir carné”.</div>
      )}
    </div>
  );
}
