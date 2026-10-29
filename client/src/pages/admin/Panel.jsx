import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { Barras, COLORES } from '../../components/Graficos.jsx';
import { GraficosHabitos, GraficosTendencia, ImpactoPeriodo, Recientes, SelectorPeriodo, TiraHoy } from '../../components/Metricas.jsx';
import { Cargando, Error, Kpi, Modal, useDatos, useToast } from '../../components/ui.jsx';
import { dinero, numero } from '../../util.js';

export default function PanelAdmin() {
  const [dias, setDias] = useState(30);
  const { datos: m, error, recargar } = useDatos(`/metricas/global?dias=${dias}`, { cada: 20000 });
  const [restaurando, setRestaurando] = useState(false);
  const [toast, avisar] = useToast();

  const restaurar = async () => {
    try {
      await api('/admin/restaurar', { metodo: 'POST' });
      setRestaurando(false);
      avisar('Datos de demostración restaurados');
      recargar();
    } catch (e) { avisar(e.message); }
  };

  if (error) return <Error mensaje={error} reintentar={recargar} />;
  if (!m) return <Cargando texto="Calculando métricas de las cafeterías…" />;
  const a = m.adopcion;
  const comparativa = m.porCafeteria.map((c) => ({ nombre: c.nombre.replace('Chalet ', ''), 'Con tupper (%)': c.periodo.pctConTupper }));

  return (
    <>
      <div className="encabezado">
        <div><h1>Panorama general</h1><p>Las {m.porCafeteria.length} cafeterías del campus Soyapango.</p></div>
        <SelectorPeriodo dias={dias} setDias={setDias} />
      </div>

      <TiraHoy m={m} />

      <div className="panel">
        <div className="panel-titulo">
          <h3>Adopción en la comunidad universitaria</h3>
          <Link className="pequeno" to="/admin/simulador">Proyectar escenarios</Link>
        </div>
        <div className="tira" style={{ '--cols': 4, marginBottom: 0 }}>
          <Kpi valor={numero(a.tasa, 2)} unidad="%" etiqueta="Tasa de adopción" nota={`${numero(a.participantes)} de ${numero(a.poblacion)} personas`} />
          <Kpi valor={numero(a.registrados)} etiqueta="Cuentas registradas" nota={`${numero(m.clientes.nuevosSemana)} participantes nuevos esta semana`} />
          <Kpi valor={numero(a.usosSemanalesPorParticipante, 1)} etiqueta="Usos por semana" nota="Por participante activo, últimas 4 semanas" />
          <Kpi valor={numero(m.clientes.superanUmbralCarbono)} etiqueta="Tuppers con 27 usos o más" nota={`${numero(m.clientes.superanUmbralAmbiental)} ya pasan de 37 usos`} />
        </div>
      </div>

      <div className="rejilla rejilla-3-1" style={{ marginTop: '1rem' }}>
        <div className="panel">
          <div className="panel-titulo"><h3>Comparativa por cafetería</h3><span className="pequeno texto-suave">Periodo seleccionado</span></div>
          <div className="tabla-envoltura">
            <table>
              <thead>
                <tr><th>Cafetería</th><th className="num">Tuppers hoy</th><th className="num">Tuppers</th><th className="num">% con tupper</th><th className="num">Poliestireno</th><th className="num">Descuentos</th></tr>
              </thead>
              <tbody>
                {m.porCafeteria.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.nombre}</b>{!c.activa && <> <span className="chip chip-ambar">Inactiva</span></>}</td>
                    <td className="num">{numero(c.hoy.envases)}</td>
                    <td className="num">{numero(c.periodo.envases)}</td>
                    <td className="num">{numero(c.periodo.pctConTupper, 1)} %</td>
                    <td className="num">{numero(c.periodo.kg, 1)} kg</td>
                    <td className="num">{dinero(c.periodo.descuentos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-titulo"><h3>Ventas con tupper</h3></div>
          <Barras datos={comparativa} x="nombre" series={[{ clave: 'Con tupper (%)', nombre: 'Con tupper (%)', color: COLORES.tapa }]} alto={200} formatoY={(v) => `${v}%`} />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}><GraficosTendencia m={m} /></div>
      <div className="rejilla rejilla-3-1" style={{ marginTop: '1rem' }}>
        <ImpactoPeriodo m={m} />
        <Recientes m={m} />
      </div>
      <GraficosHabitos m={m} />

      <div className="panel" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>Datos de demostración</h3>
          <p className="pequeno texto-suave" style={{ margin: 0 }}>Vuelve a generar 8 semanas de actividad simulada hasta hoy. Se borran los registros y las cuentas creadas durante las pruebas.</p>
        </div>
        <button className="btn btn-peligro" onClick={() => setRestaurando(true)}>Restaurar datos</button>
      </div>

      {restaurando && (
        <Modal titulo="¿Restaurar los datos de demostración?" onCerrar={() => setRestaurando(false)}>
          <p>Se reemplazarán todos los registros, cafeterías y cuentas por los datos simulados originales. Las cuentas de prueba de la guía seguirán funcionando.</p>
          <div className="acciones">
            <button className="btn btn-secundario" onClick={() => setRestaurando(false)}>Cancelar</button>
            <button className="btn btn-peligro" onClick={restaurar}>Restaurar datos</button>
          </div>
        </Modal>
      )}
      {toast}
    </>
  );
}
